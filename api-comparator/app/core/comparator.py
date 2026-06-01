import asyncio
from typing import List, Dict
from app.core.parser import parse_specs_from_bytes
from app.core.diff_engine import deep_diff
from app.core.fault_classifier import classify_faults
from app.models.comparison_result import APIComparisonResult, ComparisonReport, FaultDetail, Severity
from app.core.workers import endpoint_worker, request_body_worker, response_body_worker, timing_worker
from app.config import settings
import datetime


semaphore = asyncio.Semaphore(settings.max_concurrent_comparisons)


async def compare_and_build_report(original_bytes, migrated_bytes, job_id: str) -> ComparisonReport:
    originals = await parse_specs_from_bytes(original_bytes)
    migrated = await parse_specs_from_bytes(migrated_bytes)

    original_map = {o.get("id"): o for o in originals}

    results = []

    async def compare_one(mig):
        async with semaphore:
            oid = mig.get("id")
            orig = original_map.get(oid)
            faults = []
            if orig is None:
                faults.append(FaultDetail(code="ENDPOINT_NOT_FOUND", severity=Severity.ERROR, field_path="id", original=None, migrated=oid, message="Endpoint not found in original"))
                status = classify_faults(faults)
            else:
                # run workers concurrently
                w = await asyncio.gather(
                    endpoint_worker.compare_endpoint(orig, mig),
                    request_body_worker.compare_request_body(orig, mig),
                    response_body_worker.compare_response_body(orig, mig),
                    timing_worker.compare_timing(orig, mig),
                )
                for sub in w:
                    faults.extend(sub)
                status = classify_faults(faults)

            res = APIComparisonResult(
                id=mig.get("id"),
                name=mig.get("name", ""),
                method=mig.get("method", ""),
                path=mig.get("path", ""),
                status=status,
                faults=faults,
                fault_count={"FAIL": sum(1 for f in faults if f.severity == Severity.FAIL), "WARN": sum(1 for f in faults if f.severity == Severity.WARN), "ERROR": sum(1 for f in faults if f.severity == Severity.ERROR)},
            )
            return res

    tasks = [compare_one(m) for m in migrated]
    results = await asyncio.gather(*tasks)

    passed = sum(1 for r in results if r.status == Severity.PASS)
    warned = sum(1 for r in results if r.status == Severity.WARN)
    failed = sum(1 for r in results if r.status == Severity.FAIL)
    errors = sum(1 for r in results if r.status == Severity.ERROR)

    report = ComparisonReport(
        job_id=job_id,
        created_at=datetime.datetime.utcnow().isoformat() + "Z",
        total_apis=len(results),
        passed=passed,
        warned=warned,
        failed=failed,
        errors=errors,
        pass_rate=(passed / max(1, len(results))) * 100.0,
        results=results,
    )
    return report

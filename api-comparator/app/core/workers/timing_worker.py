from typing import List
from app.models.comparison_result import FaultDetail, Severity
from app.config import settings


async def compare_timing(original: dict, migrated: dict) -> List[FaultDetail]:
    faults: List[FaultDetail] = []
    o_t = original.get("response_time")
    m_t = migrated.get("response_time")
    if not m_t:
        faults.append(FaultDetail(code="MISSING_TIMING_DATA", severity=Severity.WARN, field_path="response_time", original=o_t, migrated=None, message="Missing timing data in migrated"))
        return faults
    if not o_t:
        return faults

    for p in ("p50_ms", "p95_ms", "p99_ms"):
        o_v = o_t.get(p)
        m_v = m_t.get(p)
        if o_v is None or m_v is None:
            continue
        if m_v > o_v * (1 + settings.timing_fail_threshold_pct / 100.0):
            faults.append(FaultDetail(code=f"SEVERE_TIMING_REGRESSION_{p}", severity=Severity.FAIL, field_path=f"response_time.{p}", original=o_v, migrated=m_v, message=f"Severe regression on {p}"))
        elif m_v > o_v * (1 + settings.timing_warn_threshold_pct / 100.0):
            faults.append(FaultDetail(code=f"TIMING_REGRESSION_{p}", severity=Severity.WARN, field_path=f"response_time.{p}", original=o_v, migrated=m_v, message=f"Timing regression on {p}"))

    return faults

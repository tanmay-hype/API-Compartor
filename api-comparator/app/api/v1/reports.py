from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.storage_service import storage
from app.services.report_service import ReportService

router = APIRouter()
report_service = ReportService()


@router.get("/{job_id}")
async def get_report(job_id: str, format: Optional[str] = Query("json")):
    report = storage.get_report(job_id)
    if report is None:
        raise HTTPException(status_code=404, detail="job not found")
    if format == "json":
        return report
    if format == "csv":
        return report_service.to_csv(report)
    if format == "html":
        return report_service.to_html(report)
    raise HTTPException(status_code=400, detail="unsupported format")


@router.get("/{job_id}/faults")
async def get_faults(job_id: str, severity: Optional[str] = None, tag: Optional[str] = None):
    report = storage.get_report(job_id)
    if report is None:
        raise HTTPException(status_code=404, detail="job not found")
    faults = []
    for r in report.results:
        for f in r.faults:
            if severity and f.severity != severity:
                continue
            faults.append(f)
    return faults

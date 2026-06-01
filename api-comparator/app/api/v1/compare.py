from fastapi import APIRouter, File, UploadFile, Request
import json
from typing import Optional
import uuid
from app.utils.exceptions import AppException
from app.services.comparison_service import ComparisonService
from app.services.storage_service import storage

router = APIRouter()

service = ComparisonService()


@router.post("/compare")
async def compare_endpoint(
    original: Optional[UploadFile] = File(None),
    migrated: Optional[UploadFile] = File(None),
    request: Request = None,
):
    # Accept multipart files OR JSON body
    if request and request.headers.get("content-type", "").startswith("application/json"):
        try:
            body = await request.json()
        except json.JSONDecodeError:
            raise AppException(status_code=400, error_code="INVALID_JSON", detail="Malformed JSON body")
        if not isinstance(body, dict):
            raise AppException(status_code=400, error_code="INVALID_PAYLOAD", detail="JSON body must be an object with original and migrated fields")
        original_spec = body.get("original")
        migrated_spec = body.get("migrated")
        if original_spec is None or migrated_spec is None:
            raise AppException(status_code=422, error_code="INVALID_PAYLOAD", detail="Provide both original and migrated in the JSON body")
    else:
        if original is None or migrated is None:
            raise AppException(status_code=422, error_code="INVALID_PAYLOAD", detail="Provide both files or JSON body")
        original_spec = await original.read()
        migrated_spec = await migrated.read()

    job_id = str(uuid.uuid4())
    try:
        report = await service.compare_and_report(original_spec, migrated_spec, job_id=job_id)
        storage.save_report(job_id, report)
        return report
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(status_code=500, error_code="INTERNAL_ERROR", detail=str(e))

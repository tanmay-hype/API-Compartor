import json

import pytest
from httpx import AsyncClient

from app.main import app
from app.models.comparison_result import APIComparisonResult, ComparisonReport, FaultDetail, Severity
from app.services.storage_service import storage


@pytest.fixture(autouse=True)
def clear_storage():
    storage._store.clear()
    yield
    storage._store.clear()


@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "version" in response.json()


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_compare_requires_both_files():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/compare",
            files={"original": ("original.json", json.dumps([{"id": "a"}]), "application/json")},
        )

    assert response.status_code == 422
    assert response.json()["detail"]["error_code"] == "INVALID_PAYLOAD"


@pytest.mark.asyncio
async def test_compare_rejects_malformed_json_body():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/compare",
            content=b"{not valid json}",
            headers={"content-type": "application/json"},
        )

    assert response.status_code == 400
    assert response.json()["detail"]["error_code"] == "INVALID_JSON"


@pytest.mark.asyncio
async def test_compare_returns_report_for_valid_files():
    original = [
        {
            "id": "user_get",
            "name": "Get user",
            "method": "GET",
            "path": "/api/v1/users/{id}",
            "path_params": {"id": {"type": "string", "required": True}},
            "query_params": {},
            "request_body": None,
            "responses": {"200": {"content_type": "application/json", "schema": {"properties": {"id": {"type": "string"}, "name": {"type": "string"}}}}},
            "response_time": {"p50_ms": 100, "p95_ms": 300, "p99_ms": 800},
            "tags": ["users"],
        }
    ]
    migrated = [
        {
            "id": "user_get",
            "name": "Get user",
            "method": "GET",
            "path": "/api/v1/users/{id}",
            "path_params": {"id": {"type": "string", "required": True}},
            "query_params": {},
            "request_body": None,
            "responses": {"200": {"content_type": "application/json", "schema": {"properties": {"id": {"type": "string"}, "name": {"type": "string"}}}}},
                "response_time": {"p50_ms": 120, "p95_ms": 400, "p99_ms": 900},
            "tags": ["users"],
        }
    ]

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/compare",
            files={
                "original": ("original.json", json.dumps(original), "application/json"),
                "migrated": ("migrated.json", json.dumps(migrated), "application/json"),
            },
        )

    assert response.status_code == 200
    report = response.json()
    assert report["total_apis"] == 1
    assert report["results"][0]["id"] == "user_get"
    assert any(fault["code"].startswith("TIMING_") for fault in report["results"][0]["faults"])


def _seed_report(job_id: str = "job-123") -> ComparisonReport:
    return ComparisonReport(
        job_id=job_id,
        created_at="2026-06-01T00:00:00Z",
        total_apis=1,
        passed=0,
        warned=1,
        failed=0,
        errors=0,
        pass_rate=0.0,
        results=[
            APIComparisonResult(
                id="user_get",
                name="Get user",
                method="GET",
                path="/api/v1/users/{id}",
                status=Severity.WARN,
                faults=[
                    FaultDetail(
                        code="TIMING_REGRESSION_p95_ms",
                        severity=Severity.WARN,
                        field_path="response_time.p95_ms",
                        original=300,
                        migrated=350,
                        message="Timing regression on p95_ms",
                    ),
                    FaultDetail(
                        code="EXTRA_QUERY_PARAM",
                        severity=Severity.WARN,
                        field_path="query_params.fields",
                        original=None,
                        migrated={"type": "string", "required": False},
                        message="Extra query param fields",
                    ),
                ],
                fault_count={"FAIL": 0, "WARN": 2, "ERROR": 0},
            )
        ],
    )


@pytest.mark.asyncio
async def test_reports_endpoint_formats_and_fault_filtering():
    storage.save_report("job-123", _seed_report())

    async with AsyncClient(app=app, base_url="http://test") as client:
        json_response = await client.get("/api/v1/reports/job-123")
        csv_response = await client.get("/api/v1/reports/job-123?format=csv")
        html_response = await client.get("/api/v1/reports/job-123?format=html")
        faults_response = await client.get("/api/v1/reports/job-123/faults?severity=WARN")
        missing_response = await client.get("/api/v1/reports/missing-job")
        bad_format_response = await client.get("/api/v1/reports/job-123?format=xml")

    assert json_response.status_code == 200
    assert json_response.json()["job_id"] == "job-123"

    assert csv_response.status_code == 200
    assert "api_id,api_name,method,path,status" in csv_response.text

    assert html_response.status_code == 200
    assert "Report job-123" in html_response.text

    assert faults_response.status_code == 200
    assert len(faults_response.json()) == 2

    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "job not found"

    assert bad_format_response.status_code == 400
    assert bad_format_response.json()["detail"] == "unsupported format"
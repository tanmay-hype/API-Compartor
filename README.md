API Comparator
A small FastAPI service that compares two API specifications (internal endpoint list format or OpenAPI v3 JSON) and produces a comparison report. It can include timing data (p50/p95/p99) to surface performance regressions, and returns reports in JSON, CSV, or HTML.

Key use cases:

Validate a migrated API against an original spec.
Detect breaking changes, missing endpoints, parameter mismatches, and timing regressions.
Produce machine- and human-readable reports for CI or manual review.
Features
Accepts either multipart file uploads or a JSON body containing original and migrated specs.
Optional timing metadata per operation via x-response-time with p50_ms, p95_ms, p99_ms.
Comparison results saved as reports (default directory: ./reports).
Report retrieval in JSON, CSV, or HTML.
Fault filtering endpoint to list faults by severity or tag.
Lightweight, single-process FastAPI app with CORS enabled.
Quick start (development)
Prerequisites:

Python 3.10+ (or your project's supported version)
git, pip
Install and run:

bash
git clone https://github.com/tanmay-hype/API-Compartor.git
cd API-Compartor/api-comparator
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
After startup:

Root health: GET http://127.0.0.1:8000/ returns { "status": "ok", "version": "1.0.0" }
All API routes are under the /api/v1 prefix.
Endpoints
POST /api/v1/compare
Compare two specs and return a report.
Accepts:
multipart form: files named original and migrated (file uploads)
or JSON body: { "original": <object-or-openapi-json>, "migrated": <object-or-openapi-json> }
Response: comparison report (JSON). A job_id is generated and the report is saved to storage.
Example: multipart upload

bash
curl -X POST "http://127.0.0.1:8000/api/v1/compare" \
  -F "original=@original_openapi.json" \
  -F "migrated=@migrated_openapi.json"
Example: JSON body

bash
curl -X POST "http://127.0.0.1:8000/api/v1/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "original": { ... OpenAPI JSON or internal format ... },
    "migrated": { ... OpenAPI JSON or internal format ... }
  }'
Notes:

If the request Content-Type is application/json, the endpoint expects a JSON object with original and migrated fields.

For timing comparisons, include x-response-time in each operation (with p50_ms, p95_ms, p99_ms).

GET /api/v1/reports/{job_id}?format={json|csv|html}

Retrieve the saved report by job_id.
Default format: json. CSV and HTML are supported.
GET /api/v1/reports/{job_id}/faults?severity={severity}&tag={tag}

Returns a list of faults for the specified job.
Optional query params:
severity: filter by severity (e.g., warning, fail, whatever the service defines)
tag: filter by a fault tag
GET /api/v1/health

Basic health check endpoint returning status and app version.
Input formats
The service accepts:

OpenAPI v3 JSON (standard structure).
An internal endpoint list format (project uses an internal representation — see example below).
Timing metadata (optional) on each operation via an x-response-time object:
Example timing snippet (attach inside an operation object):

JSON
"x-response-time": {
  "p50_ms": 10,
  "p95_ms": 50,
  "p99_ms": 100
}
Configuration
Configuration is provided via environment or a .env file using pydantic-settings. Key settings (defaults shown):

APP
app_name: api-comparator
app_version: 1.0.0
Behavior / limits
max_apis_per_request (default 5000) — maximum APIs processed per request
timing_warn_threshold_pct (default 20) — percent threshold to mark timing warnings
timing_fail_threshold_pct (default 50) — percent threshold to mark timing failures
max_concurrent_comparisons (default 50)
Storage
report_storage_dir (default ./reports) — where reports are saved
Set env vars in a .env file or export before running.

Project structure (top-level of api-comparator)
Code
api-comparator/
  app/
    main.py                    # FastAPI application entrypoint
    api/
      v1/
        router.py              # v1 router includes compare, reports, health
        compare.py             # /compare endpoint implementation
        reports.py             # /reports endpoints
        health.py              # /health endpoint
    config.py                  # pydantic settings
    utils/
      logger.py                # simple structlog + logging setup
    services/
      comparison_service.py    # core comparison logic (referenced)
      report_service.py        # CSV/HTML helpers (referenced)
      storage_service.py       # report storage abstraction (referenced)
  README.md                    # per-subpackage README (exists)
requirements.txt               # Python dependencies
How it fits together:

app.main creates the FastAPI app, sets CORS, and includes the v1 router.
The v1 router wires three submodules: compare, reports, health.
compare.py delegates heavy work to ComparisonService, which produces a report object saved via storage_service.
reports.py exposes saved reports and converts them to CSV/HTML with ReportService.
Development notes
Logging: structlog configured to output JSON.
Exceptions: compare endpoint uses an AppException type (returning structured errors).
Report storage: ReportService and storage_service handle saving/retrieving the reports to/from disk (report_storage_dir).
If you add or change the comparison logic, update unit tests (not present in the scaffold) and ensure concurrency limits are respected.

Example workflow
Run the app locally.
POST /api/v1/compare with original and migrated specs.
Receive report JSON (and/or job_id) in response; report is persisted under configured report_storage_dir.
GET /api/v1/reports/{job_id}?format=html to view a human-friendly report.
Contributing
Fork the repo, create a branch, open a PR.
Add tests for new comparison rules or bugs.
Add documentation for any new input shape or report fields.
Consider adding a CI workflow to run tests and linting on PRs.

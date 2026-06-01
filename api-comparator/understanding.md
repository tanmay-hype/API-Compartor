# API Comparator - Understanding Document

## 1) What This Project Does
This project compares two API specifications (baseline/original vs migrated) and generates a structured comparison report.

It can accept:
- Internal endpoint-list JSON format
- OpenAPI 3 JSON (automatically normalized into internal format)

The comparison output includes:
- Endpoint-level mismatches (method/path/params)
- Request body differences
- Response body/status-code differences
- Timing regressions (if timing data is present)

---

## 2) Tech Stack and Libraries Used
Core framework and runtime:
- `FastAPI` - API framework
- `Uvicorn` - ASGI server
- `Pydantic` + `pydantic-settings` - typed models and app config

Data processing and utilities:
- `python-multipart` - file upload parsing
- `ijson` - installed for streaming JSON support (currently not actively used in parser logic)
- `structlog` - structured logging
- `aiofiles` - async file utility package (currently minimal direct usage)
- `httpx` - async HTTP client used in tests

Testing:
- `pytest`
- `pytest-asyncio`

---

## 3) High-Level Request Flow
1. Client calls compare endpoint with either uploaded files or JSON body.
2. Input specs are parsed and normalized (`app/core/parser.py`).
3. Core comparator runs endpoint-by-endpoint checks concurrently (`app/core/comparator.py`).
4. Worker modules detect specific classes of differences.
5. Faults are classified into final API status (`PASS/WARN/FAIL/ERROR`).
6. Full report is returned and stored in memory for retrieval via report endpoints.

---

## 4) File-wise Explanation

### Root-level Files

### `README.md`
- Project introduction and minimal local run instructions.
- Mentions OpenAPI 3 support and optional `x-response-time` extension.

### `requirements.txt`
- Python dependency manifest.
- Includes FastAPI stack, validation/settings libraries, test stack, and support packages.

### `Makefile`
- Convenience commands:
  - `install` - install dependencies
  - `dev` - run development server
  - `test` - run tests in async mode
  - `lint` / `format` - run Ruff commands (soft-fail using `|| true`)

### `.gitignore`
- Excludes Python caches, virtual environments, coverage artifacts, IDE files, logs, and local env files.

### `pytest.ini`
- Enables `asyncio_mode = auto` so async tests run without explicit wrappers.

---

## `app/` Package

### `app/main.py`
- FastAPI app bootstrap.
- Initializes logging.
- Adds CORS middleware (currently permissive: `*`).
- Mounts API v1 router under `/api/v1`.
- Provides root health-ish endpoint `/`.

### `app/config.py`
- Central settings class via `BaseSettings`.
- Configurable thresholds and app metadata:
  - timing warning/fail percentages
  - concurrency limits
  - app name/version/log level
- Reads environment values from `.env`.

---

## `app/api/v1/` - HTTP Layer

### `app/api/v1/router.py`
- Aggregates versioned API routes.
- Includes:
  - compare routes
  - report routes under `/reports`
  - health routes

### `app/api/v1/compare.py`
- Main compare endpoint: `POST /api/v1/compare`.
- Accepts either:
  - multipart files (`original`, `migrated`), or
  - JSON body object with `original` and `migrated` fields.
- Validates malformed JSON and missing payloads using `AppException`.
- Generates `job_id`, delegates comparison to service, saves report in storage.

### `app/api/v1/reports.py`
- `GET /api/v1/reports/{job_id}`:
  - returns report as `json` (default), `csv`, or `html`.
- `GET /api/v1/reports/{job_id}/faults`:
  - returns flattened faults list
  - supports optional severity filtering.

### `app/api/v1/health.py`
- `GET /api/v1/health` for service status/version checks.

---

## `app/services/` - Service Layer

### `app/services/comparison_service.py`
- Thin orchestration service.
- Calls `compare_and_build_report` and returns typed `ComparisonReport`.

### `app/services/storage_service.py`
- In-memory report store (`dict`) keyed by `job_id`.
- Methods:
  - `save_report(job_id, report)`
  - `get_report(job_id)`
- Current persistence is process-memory only (resets on restart).

### `app/services/report_service.py`
- Report serialization helpers:
  - `to_csv(report)` - row-wise flattened fault report
  - `to_html(report)` - simple self-contained HTML summary table

---

## `app/core/` - Comparison Engine

### `app/core/parser.py`
- Input parser and normalizer.
- Supports input as bytes/string/dict/list-like.
- If payload is OpenAPI-like (`paths` exists), converts to internal endpoint schema.
- OpenAPI normalization extracts:
  - method/path
  - path/query params
  - requestBody schema
  - responses schema + content type
  - `x-response-time` (or `response_time`) timing metadata

### `app/core/comparator.py`
- Main comparison pipeline.
- Parses both specs, builds `original_map` by endpoint `id`.
- Compares migrated endpoints against original using async workers concurrently.
- Creates per-endpoint result and aggregate report metrics.
- Uses semaphore to cap concurrent comparisons based on config.

### `app/core/fault_classifier.py`
- Converts a list of faults into final endpoint status:
  - no faults -> `PASS`
  - any `ERROR` -> `ERROR`
  - else any `FAIL` -> `FAIL`
  - else -> `WARN`

### `app/core/diff_engine.py`
- Generic recursive diff utility for dict/list/scalar structures.
- Produces `FieldDiff` entries with path and diff type.
- Present in codebase, not currently the primary mechanism used by endpoint workers.

---

## `app/core/workers/` - Specialized Comparators

### `app/core/workers/endpoint_worker.py`
Checks:
- HTTP method mismatch
- path mismatch
- missing/extra path params
- query param missing/type mismatch/extra

### `app/core/workers/request_body_worker.py`
Checks:
- missing/extra request body
- request content-type mismatch
- required field differences
- request property type and format mismatches

### `app/core/workers/response_body_worker.py`
Checks:
- missing/extra status codes
- response content-type mismatch
- response property type mismatch
- missing/extra response fields

### `app/core/workers/timing_worker.py`
Checks:
- missing timing data in migrated
- timing regressions for `p50_ms`, `p95_ms`, `p99_ms`
- thresholds read from config:
  - warn: `timing_warn_threshold_pct`
  - fail: `timing_fail_threshold_pct`

---

## `app/models/`

### `app/models/comparison_result.py`
Typed Pydantic models for all report objects:
- `Severity` enum
- `FaultDetail`
- `FieldDiff`
- `APIComparisonResult`
- `ComparisonReport`

These models define the structured API response contract.

---

## `app/utils/`

### `app/utils/exceptions.py`
- Defines `AppException` (extends `HTTPException`).
- Standardizes error payload shape:
  - `{"error_code": ..., "detail": ...}`

### `app/utils/logger.py`
- Configures standard logging and `structlog` JSON renderer.

### `app/utils/helpers.py`
- Contains helper `normalise_path()` to trim trailing slash.
- Utility is available but endpoint worker currently does local path normalization directly.

---

## `tests/` - Quality and Behavior Verification

### `tests/test_health.py`
- Validates health endpoint returns expected 200 + status.

### `tests/test_parser.py`
- Validates parser for internal JSON list.
- Validates OpenAPI normalization behavior.
- End-to-end compare call with OpenAPI payloads.

### `tests/test_endpoints_edge_cases.py`
Covers edge cases across endpoints:
- root and health endpoint behavior
- compare payload validation failures
- malformed JSON handling
- valid compare response generation
- reports endpoint format paths (`json/csv/html`)
- faults filtering and missing-job behavior

### `tests/fixtures/`
- Sample JSON files used for manual testing and experimentation:
  - `original_sample.json`
  - `migrated_sample.json`
  - `original_sample_1.json`
  - `original_sample_2.json`

---

## 5) Important Design Notes
- Comparison is ID-centric: endpoints are matched by `id`.
- Storage is in-memory only; reports are not persistent across restarts.
- OpenAPI support is normalization-based (maps OpenAPI into internal schema).
- Timing analysis requires timing data (`x-response-time` in OpenAPI mode).
- Concurrency is controlled by semaphore to avoid overloading runtime resources.

---

## 6) Potential Next Improvements
- Add persistent storage backend (SQLite/Postgres/S3) for reports.
- Add auth and stricter CORS for production deployment.
- Return proper `text/csv` and `text/html` response media types for report formats.
- Use timezone-aware UTC timestamps (`datetime.now(timezone.utc)`).
- Consider diff-by-operationId + fallback matching for OpenAPI where IDs are missing.
- Expand OpenAPI normalization for components/refs and richer schema semantics.

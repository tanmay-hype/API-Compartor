# API Comparator

Scaffolded API Migration Comparator — minimal working implementation.

It accepts either the internal endpoint list format or standard OpenAPI 3 JSON.
For timing comparisons, include an optional `x-response-time` object on each operation with `p50_ms`, `p95_ms`, and `p99_ms`.

Run locally:

```bash
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

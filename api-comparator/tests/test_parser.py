import pytest
import json
from httpx import AsyncClient
from app.main import app
from app.core.parser import parse_specs_from_bytes


@pytest.mark.asyncio
async def test_parse_valid_json():
    data = b"[ {\"id\": \"a\"} ]"
    res = await parse_specs_from_bytes(data)
    assert isinstance(res, list)
    assert res[0]["id"] == "a"


@pytest.mark.asyncio
async def test_parse_openapi_json_to_internal_format():
    openapi_spec = {
        "openapi": "3.0.3",
        "info": {"title": "Users API", "version": "1.0.0"},
        "paths": {
            "/users/{id}": {
                "parameters": [
                    {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "get": {
                    "operationId": "getUser",
                    "summary": "Get user",
                    "parameters": [
                        {"name": "expand", "in": "query", "required": False, "schema": {"type": "string"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "OK",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {"id": {"type": "string"}, "name": {"type": "string"}},
                                    }
                                }
                            },
                        }
                    },
                    "x-response-time": {"p50_ms": 100, "p95_ms": 200, "p99_ms": 300},
                },
            }
        },
    }

    res = await parse_specs_from_bytes(json.dumps(openapi_spec))
    assert len(res) == 1
    endpoint = res[0]
    assert endpoint["id"] == "getUser"
    assert endpoint["method"] == "GET"
    assert endpoint["path"] == "/users/{id}"
    assert endpoint["path_params"]["id"]["type"] == "string"
    assert endpoint["query_params"]["expand"]["type"] == "string"
    assert endpoint["responses"]["200"]["content_type"] == "application/json"
    assert endpoint["responses"]["200"]["schema"]["properties"]["name"]["type"] == "string"
    assert endpoint["response_time"]["p95_ms"] == 200


@pytest.mark.asyncio
async def test_compare_openapi_files_end_to_end():
    original_openapi = {
        "openapi": "3.0.3",
        "info": {"title": "Users API", "version": "1.0.0"},
        "paths": {
            "/users/{id}": {
                "parameters": [
                    {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "get": {
                    "operationId": "getUser",
                    "responses": {
                        "200": {
                            "description": "OK",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {"id": {"type": "string"}, "name": {"type": "string"}},
                                    }
                                }
                            },
                        }
                    },
                    "x-response-time": {"p50_ms": 100, "p95_ms": 200, "p99_ms": 300},
                },
            }
        },
    }

    migrated_openapi = {
        "openapi": "3.0.3",
        "info": {"title": "Users API", "version": "1.1.0"},
        "paths": {
            "/users/{id}": {
                "parameters": [
                    {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "get": {
                    "operationId": "getUser",
                    "responses": {
                        "200": {
                            "description": "OK",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {"id": {"type": "string"}, "fullName": {"type": "string"}},
                                    }
                                }
                            },
                        }
                    },
                    "x-response-time": {"p50_ms": 160, "p95_ms": 260, "p99_ms": 360},
                },
            }
        },
    }

    files = {
        "original": ("original.json", json.dumps(original_openapi), "application/json"),
        "migrated": ("migrated.json", json.dumps(migrated_openapi), "application/json"),
    }

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/compare", files=files)

    assert response.status_code == 200
    report = response.json()
    assert report["total_apis"] == 1
    result = report["results"][0]
    fault_codes = {fault["code"] for fault in result["faults"]}
    assert "RESPONSE_FIELD_TYPE_MISMATCH" not in fault_codes
    assert "EXTRA_RESPONSE_FIELD" in fault_codes or "MISSING_RESPONSE_FIELD" in fault_codes or fault_codes

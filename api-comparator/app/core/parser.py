import json
from typing import List, Any, Dict


_OPENAPI_METHODS = {"get", "put", "post", "delete", "options", "head", "patch", "trace"}


def _extract_schema(content: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(content, dict):
        return {}
    for media_type, media_value in content.items():
        if isinstance(media_value, dict) and isinstance(media_value.get("schema"), dict):
            schema = dict(media_value["schema"])
            schema["content_type"] = media_type
            return schema
    return {}


def _normalize_parameter(parameter: Dict[str, Any]) -> Dict[str, Any]:
    schema = parameter.get("schema") or {}
    normalized = {
        "type": schema.get("type"),
        "format": schema.get("format"),
        "required": parameter.get("required", False),
    }
    return {key: value for key, value in normalized.items() if value is not None}


def _normalize_openapi_spec(spec: Dict[str, Any]) -> List[dict]:
    endpoints: List[dict] = []
    paths = spec.get("paths", {}) or {}

    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue

        path_level_params = path_item.get("parameters", []) or []

        for method, operation in path_item.items():
            if method not in _OPENAPI_METHODS or not isinstance(operation, dict):
                continue

            operation_params = list(path_level_params) + list(operation.get("parameters", []) or [])
            path_params: Dict[str, Dict[str, Any]] = {}
            query_params: Dict[str, Dict[str, Any]] = {}

            for parameter in operation_params:
                if not isinstance(parameter, dict):
                    continue
                param_in = parameter.get("in")
                param_name = parameter.get("name")
                if not param_name or param_in not in {"path", "query"}:
                    continue
                normalized = _normalize_parameter(parameter)
                if param_in == "path":
                    path_params[param_name] = normalized
                elif param_in == "query":
                    query_params[param_name] = normalized

            request_body = None
            request_body_obj = operation.get("requestBody")
            if isinstance(request_body_obj, dict):
                content = request_body_obj.get("content", {}) or {}
                schema = _extract_schema(content)
                if schema:
                    request_body = {
                        "content_type": schema.pop("content_type", None),
                        "schema": schema,
                    }

            responses: Dict[str, Any] = {}
            for status_code, response in (operation.get("responses", {}) or {}).items():
                if not isinstance(response, dict):
                    continue
                content = response.get("content", {}) or {}
                schema = _extract_schema(content)
                response_entry: Dict[str, Any] = {}
                if schema:
                    response_entry["content_type"] = schema.pop("content_type", None)
                    response_entry["schema"] = {"properties": schema.get("properties", {})}
                responses[str(status_code)] = response_entry or response

            endpoint_id = operation.get("operationId") or operation.get("x-endpoint-id") or f"{method.upper()} {path}"
            endpoint = {
                "id": endpoint_id,
                "name": operation.get("summary") or operation.get("operationId") or endpoint_id,
                "method": method.upper(),
                "path": path,
                "path_params": path_params,
                "query_params": query_params,
                "request_body": request_body,
                "responses": responses,
                "response_time": operation.get("x-response-time") or operation.get("response_time"),
            }
            endpoints.append(endpoint)

    return endpoints


async def parse_specs_from_bytes(data: Any) -> List[dict]:
    try:
        payload: Any
        if isinstance(data, (bytes, bytearray)):
            payload = json.loads(data.decode("utf-8"))
        elif isinstance(data, str):
            payload = json.loads(data)
        elif isinstance(data, dict):
            payload = data
        else:
            payload = list(data)

        if isinstance(payload, dict) and "paths" in payload:
            return _normalize_openapi_spec(payload)
        if isinstance(payload, list):
            return payload
        return [payload]
    except json.JSONDecodeError:
        raise

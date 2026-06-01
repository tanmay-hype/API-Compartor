from typing import List
from app.models.comparison_result import FaultDetail, Severity


async def compare_endpoint(original: dict, migrated: dict) -> List[FaultDetail]:
    faults: List[FaultDetail] = []
    if original.get("method", "").lower() != migrated.get("method", "").lower():
        faults.append(FaultDetail(code="METHOD_MISMATCH", severity=Severity.FAIL, field_path="method", original=original.get("method"), migrated=migrated.get("method"), message="HTTP method mismatch"))

    # normalise path
    op = original.get("path", "").rstrip("/")
    mp = migrated.get("path", "").rstrip("/")
    if op != mp:
        faults.append(FaultDetail(code="PATH_MISMATCH", severity=Severity.FAIL, field_path="path", original=op, migrated=mp, message="Path mismatch"))

    # path params
    o_params = original.get("path_params", {}) or {}
    m_params = migrated.get("path_params", {}) or {}
    for k in o_params:
        if k not in m_params:
            faults.append(FaultDetail(code="MISSING_PATH_PARAM", severity=Severity.FAIL, field_path=f"path_params.{k}", original=o_params[k], migrated=None, message=f"Missing path param {k}"))
        else:
            if o_params[k].get("type") != m_params[k].get("type"):
                faults.append(FaultDetail(code="PATH_PARAM_TYPE_MISMATCH", severity=Severity.FAIL, field_path=f"path_params.{k}.type", original=o_params[k].get("type"), migrated=m_params[k].get("type"), message=f"Type mismatch for path param {k}"))
    for k in m_params:
        if k not in o_params:
            faults.append(FaultDetail(code="EXTRA_PATH_PARAM", severity=Severity.WARN, field_path=f"path_params.{k}", original=None, migrated=m_params[k], message=f"Extra path param {k}"))

    # query params similar
    o_q = original.get("query_params", {}) or {}
    m_q = migrated.get("query_params", {}) or {}
    for k in o_q:
        if k not in m_q:
            if o_q[k].get("required"):
                faults.append(FaultDetail(code="MISSING_QUERY_PARAM", severity=Severity.FAIL, field_path=f"query_params.{k}", original=o_q[k], migrated=None, message=f"Missing required query param {k}"))
            else:
                faults.append(FaultDetail(code="MISSING_QUERY_PARAM", severity=Severity.WARN, field_path=f"query_params.{k}", original=o_q[k], migrated=None, message=f"Missing optional query param {k}"))
        else:
            if o_q[k].get("type") != m_q[k].get("type"):
                faults.append(FaultDetail(code="QUERY_PARAM_TYPE_MISMATCH", severity=Severity.FAIL, field_path=f"query_params.{k}.type", original=o_q[k].get("type"), migrated=m_q[k].get("type"), message=f"Type mismatch for query param {k}"))
    for k in m_q:
        if k not in o_q:
            faults.append(FaultDetail(code="EXTRA_QUERY_PARAM", severity=Severity.WARN, field_path=f"query_params.{k}", original=None, migrated=m_q[k], message=f"Extra query param {k}"))

    return faults

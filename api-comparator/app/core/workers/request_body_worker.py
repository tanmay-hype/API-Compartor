from typing import List
from app.models.comparison_result import FaultDetail, Severity


def _compare_properties(oprops: dict, mprops: dict, prefix: str = "") -> List[FaultDetail]:
    faults: List[FaultDetail] = []
    for k in (oprops or {}):
        if k not in (mprops or {}):
            faults.append(FaultDetail(code="MISSING_REQUEST_FIELD", severity=Severity.FAIL, field_path=f"{prefix}{k}", original=oprops[k], migrated=None, message=f"Missing request field {k}"))
        else:
            if oprops[k].get("type") != mprops[k].get("type"):
                faults.append(FaultDetail(code="FIELD_TYPE_MISMATCH", severity=Severity.FAIL, field_path=f"{prefix}{k}.type", original=oprops[k].get("type"), migrated=mprops[k].get("type"), message=f"Type mismatch for field {k}"))
            if oprops[k].get("format") != mprops[k].get("format") and oprops[k].get("format") is not None:
                faults.append(FaultDetail(code="FIELD_FORMAT_MISMATCH", severity=Severity.WARN, field_path=f"{prefix}{k}.format", original=oprops[k].get("format"), migrated=mprops[k].get("format"), message=f"Format mismatch for field {k}"))
    for k in (mprops or {}):
        if k not in (oprops or {}):
            faults.append(FaultDetail(code="EXTRA_REQUEST_FIELD", severity=Severity.WARN, field_path=f"{prefix}{k}", original=None, migrated=mprops[k], message=f"Extra request field {k}"))
    return faults


async def compare_request_body(original: dict, migrated: dict) -> List[FaultDetail]:
    faults: List[FaultDetail] = []
    o_rb = original.get("request_body")
    m_rb = migrated.get("request_body")
    if not o_rb and m_rb:
        faults.append(FaultDetail(code="EXTRA_REQUEST_BODY", severity=Severity.WARN, field_path="request_body", original=None, migrated=m_rb, message="Request body present in migrated but not original"))
        return faults
    if o_rb and not m_rb:
        faults.append(FaultDetail(code="MISSING_REQUEST_BODY", severity=Severity.FAIL, field_path="request_body", original=o_rb, migrated=None, message="Missing request body in migrated"))
        return faults

    if o_rb and m_rb:
        if o_rb.get("content_type") != m_rb.get("content_type"):
            faults.append(FaultDetail(code="REQUEST_CONTENT_TYPE_MISMATCH", severity=Severity.FAIL, field_path="request_body.content_type", original=o_rb.get("content_type"), migrated=m_rb.get("content_type"), message="Content type mismatch"))
        o_schema = o_rb.get("schema", {})
        m_schema = m_rb.get("schema", {})
        # required arrays
        o_required = set(o_schema.get("required", []))
        m_required = set(m_schema.get("required", []))
        for r in o_required - m_required:
            faults.append(FaultDetail(code="MISSING_REQUIRED_FIELD", severity=Severity.FAIL, field_path=f"request_body.schema.required.{r}", original=True, migrated=None, message=f"Required field {r} missing"))
        for r in m_required - o_required:
            faults.append(FaultDetail(code="EXTRA_REQUIRED_FIELD", severity=Severity.WARN, field_path=f"request_body.schema.required.{r}", original=None, migrated=True, message=f"Extra required field {r} in migrated"))

        o_props = o_schema.get("properties", {})
        m_props = m_schema.get("properties", {})
        faults.extend(_compare_properties(o_props, m_props, prefix="request_body.schema.properties."))

    return faults

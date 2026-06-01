from typing import List
from app.models.comparison_result import FaultDetail, Severity


def _compare_response_props(oprops: dict, mprops: dict, prefix: str = "") -> List[FaultDetail]:
    faults: List[FaultDetail] = []
    for k in (oprops or {}):
        if k not in (mprops or {}):
            faults.append(FaultDetail(code="MISSING_RESPONSE_FIELD", severity=Severity.FAIL, field_path=f"{prefix}{k}", original=oprops[k], migrated=None, message=f"Missing response field {k}"))
        else:
            if oprops[k].get("type") != mprops[k].get("type"):
                faults.append(FaultDetail(code="RESPONSE_FIELD_TYPE_MISMATCH", severity=Severity.FAIL, field_path=f"{prefix}{k}.type", original=oprops[k].get("type"), migrated=mprops[k].get("type"), message=f"Type mismatch for response field {k}"))
    for k in (mprops or {}):
        if k not in (oprops or {}):
            faults.append(FaultDetail(code="EXTRA_RESPONSE_FIELD", severity=Severity.WARN, field_path=f"{prefix}{k}", original=None, migrated=mprops[k], message=f"Extra response field {k}"))
    return faults


async def compare_response_body(original: dict, migrated: dict) -> List[FaultDetail]:
    faults: List[FaultDetail] = []
    o_res = original.get("responses", {}) or {}
    m_res = migrated.get("responses", {}) or {}
    for code in o_res:
        if code not in m_res:
            faults.append(FaultDetail(code="MISSING_STATUS_CODE", severity=Severity.FAIL, field_path=f"responses.{code}", original=o_res[code], migrated=None, message=f"Missing status code {code} in migrated"))
        else:
            if o_res[code].get("content_type") != m_res[code].get("content_type"):
                faults.append(FaultDetail(code="RESPONSE_CONTENT_TYPE_MISMATCH", severity=Severity.FAIL, field_path=f"responses.{code}.content_type", original=o_res[code].get("content_type"), migrated=m_res[code].get("content_type"), message="Response content type mismatch"))
            o_props = o_res[code].get("schema", {}).get("properties", {})
            m_props = m_res[code].get("schema", {}).get("properties", {})
            faults.extend(_compare_response_props(o_props, m_props, prefix=f"responses.{code}.schema.properties."))
    for code in m_res:
        if code not in o_res:
            faults.append(FaultDetail(code="EXTRA_STATUS_CODE", severity=Severity.WARN, field_path=f"responses.{code}", original=None, migrated=m_res[code], message=f"Extra status code {code} in migrated"))
    return faults

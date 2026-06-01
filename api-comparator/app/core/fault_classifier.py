from typing import List
from app.models.comparison_result import FaultDetail, Severity


def classify_faults(faults: List[FaultDetail]) -> Severity:
    if not faults:
        return Severity.PASS
    severities = {f.severity for f in faults}
    if Severity.ERROR in severities:
        return Severity.ERROR
    if Severity.FAIL in severities:
        return Severity.FAIL
    return Severity.WARN

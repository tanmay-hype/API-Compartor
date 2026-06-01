from enum import Enum
from typing import Any, List, Dict
from pydantic import BaseModel


class Severity(str, Enum):
    PASS = "PASS"
    WARN = "WARN"
    FAIL = "FAIL"
    ERROR = "ERROR"


class FaultDetail(BaseModel):
    code: str
    severity: Severity
    field_path: str
    original: Any = None
    migrated: Any = None
    message: str


class FieldDiff(BaseModel):
    field_path: str
    original: Any = None
    migrated: Any = None
    diff_type: str


class APIComparisonResult(BaseModel):
    id: str
    name: str
    method: str
    path: str
    status: Severity
    faults: List[FaultDetail]
    fault_count: Dict[str, int]


class ComparisonReport(BaseModel):
    job_id: str
    created_at: str
    total_apis: int
    passed: int
    warned: int
    failed: int
    errors: int
    pass_rate: float
    results: List[APIComparisonResult]

from typing import Dict, Any
from app.models.comparison_result import ComparisonReport


class InMemoryStorage:
    def __init__(self):
        self._store: Dict[str, ComparisonReport] = {}

    def save_report(self, job_id: str, report: ComparisonReport):
        self._store[job_id] = report

    def get_report(self, job_id: str):
        return self._store.get(job_id)


storage = InMemoryStorage()

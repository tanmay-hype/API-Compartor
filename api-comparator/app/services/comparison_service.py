import asyncio
from app.core.comparator import compare_and_build_report
from app.core.parser import parse_specs_from_bytes
from app.models.comparison_result import ComparisonReport


class ComparisonService:
    async def compare_and_report(self, original_bytes, migrated_bytes, job_id: str) -> ComparisonReport:
        # accept bytes or already-parsed lists
        report = await compare_and_build_report(original_bytes, migrated_bytes, job_id)
        return report

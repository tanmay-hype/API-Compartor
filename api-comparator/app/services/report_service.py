import csv
import io
from typing import List
from app.models.comparison_result import ComparisonReport, FaultDetail


class ReportService:
    def to_csv(self, report: ComparisonReport) -> str:
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(["api_id", "api_name", "method", "path", "status", "fault_code", "severity", "field_path", "original_value", "migrated_value", "message"])
        for r in report.results:
            for f in r.faults:
                writer.writerow([r.id, r.name, r.method, r.path, r.status, f.code, f.severity, f.field_path, f.original, f.migrated, f.message])
        return out.getvalue()

    def to_html(self, report: ComparisonReport) -> str:
        # Minimal self-contained HTML
        html = f"""
        <html><head><meta charset="utf-8"><title>API Comparison Report</title></head><body>
        <h1>Report {report.job_id}</h1>
        <p>Total: {report.total_apis} — Pass rate: {report.pass_rate:.2f}%</p>
        <table border="1" cellpadding="4" cellspacing="0">
        <thead><tr><th>api</th><th>status</th><th>faults</th></tr></thead><tbody>
        """
        for r in report.results:
            faults_html = "<br/>".join([f"{f.code} ({f.severity}) - {f.field_path}" for f in r.faults])
            html += f"<tr><td>{r.id} {r.name}</td><td>{r.status}</td><td>{faults_html}</td></tr>"
        html += "</tbody></table></body></html>"
        return html

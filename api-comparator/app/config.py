from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "api-comparator"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"
    max_apis_per_request: int = 5000
    timing_warn_threshold_pct: int = 20
    timing_fail_threshold_pct: int = 50
    report_storage_dir: str = "./reports"
    max_concurrent_comparisons: int = 50

    class Config:
        env_file = ".env"


settings = Settings()

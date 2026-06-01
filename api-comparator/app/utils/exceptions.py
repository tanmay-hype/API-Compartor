from fastapi import HTTPException


class AppException(HTTPException):
    def __init__(self, status_code: int = 400, error_code: str = "ERROR", detail: str = ""):
        super().__init__(status_code=status_code, detail={"error_code": error_code, "detail": detail})

from fastapi import APIRouter
from . import compare, reports, health

router = APIRouter()

router.include_router(compare.router, prefix="", tags=["compare"])
router.include_router(reports.router, prefix="/reports", tags=["reports"])
router.include_router(health.router, prefix="", tags=["health"])

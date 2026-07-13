from typing import Any

from fastapi import APIRouter

from app.catalog import CATALOG

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


@router.get("")
def get_catalog() -> dict[str, Any]:
    return CATALOG

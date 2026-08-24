from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(tags=["assets"])
ASSETS_DIR = Path(__file__).resolve().parents[2] / "assets"


@router.get("/assets/{file_path:path}")
async def get_asset(file_path: str) -> FileResponse:
    base = ASSETS_DIR.resolve()
    target = (ASSETS_DIR / file_path).resolve()
    if not target.is_file() or not str(target).startswith(str(base)):
        raise HTTPException(status_code=404, detail="asset not found")
    return FileResponse(target)

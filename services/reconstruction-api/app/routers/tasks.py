from __future__ import annotations

import threading
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.mock import store, worker
from app.schemas import Task

router = APIRouter(prefix="/api/tasks", tags=["tasks"])
ASSETS_DIR = Path(__file__).resolve().parents[2] / "assets"

_MIME_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
}


def _guess_ext(content_type: str | None) -> str:
    return _MIME_EXT.get(content_type or "", "bin")


@router.post("", response_model=Task)
async def create_task(file: UploadFile = File(...), fail: bool = False) -> Task:
    task = store.create_task(fail=fail)

    # mock 阶段:保存原图,供「原图对照」与「重新生成」使用
    rel = f"uploads/{task.id}.{_guess_ext(file.content_type)}"
    dest = ASSETS_DIR / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(await file.read())
    store.update(task.id, sourceImageUrl=f"/assets/{rel}")

    threading.Thread(target=worker.run_task, args=(task.id,), daemon=True).start()

    result = store.get_task(task.id)
    assert result is not None
    return result


@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: str) -> Task:
    task = store.get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="task not found")
    return task


@router.post("/{task_id}/cancel", response_model=Task)
async def cancel_task(task_id: str) -> Task:
    task = store.mark_cancelled(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="task not found")
    return task


@router.post("/{task_id}/regenerate", response_model=Task)
async def regenerate_task(task_id: str) -> Task:
    src = store.get_task(task_id)
    if src is None:
        raise HTTPException(status_code=404, detail="task not found")

    task = store.create_task(source_image_url=src.sourceImageUrl)
    threading.Thread(target=worker.run_task, args=(task.id,), daemon=True).start()

    result = store.get_task(task.id)
    assert result is not None
    return result

"""模拟建模 worker。

真实建模就绪后,只需替换 `run_task` 的实现(调用真实管线并把阶段事件写回 store),
路由与前端无需改动。
"""
from __future__ import annotations

import json
import time
from pathlib import Path

from app.mock import store
from app.schemas import Stage, StageDurations, Status, TaskMetrics, TaskResult

ASSETS_DIR = Path(__file__).resolve().parents[2] / "assets"
STAGE_SLEEP = 1.0  # 每个阶段模拟耗时(秒)


def _build_result() -> TaskResult:
    meta = {"faceCount": 0, "textureSize": ""}
    meta_path = ASSETS_DIR / "demo.meta.json"
    if meta_path.exists():
        with meta_path.open(encoding="utf-8") as f:
            meta.update(json.load(f))

    glb_path = ASSETS_DIR / "demo.glb"
    glb_size = glb_path.stat().st_size if glb_path.exists() else 0

    return TaskResult(
        glbUrl="/assets/demo.glb",
        previewUrl="/assets/preview.png",
        thumbnailUrl="/assets/thumbnail.png",
        maxYawDeg=60,
        metrics=TaskMetrics(
            faceCount=int(meta.get("faceCount", 0)),
            textureSize=str(meta.get("textureSize", "")),
            glbSizeBytes=glb_size,
            stageDurations=StageDurations(),
        ),
    )


def run_task(task_id: str) -> None:
    if store.get_internal(task_id) is None:
        return

    should_fail = store.is_fail(task_id)
    durations: dict[str, float | None] = {}

    for stage in store.STAGES:
        if not store.is_running(task_id):
            return

        # debug 开关:在「表面重建」阶段触发失败,用于验证失败与重试 UI
        if should_fail and stage == Stage.reconstructing_surface:
            store.set_failed(task_id, "RECONSTRUCTION_FAILED", "表面重建失败(模拟)")
            return

        start = time.monotonic()
        store.update(task_id, status=Status.processing, stage=stage)
        time.sleep(STAGE_SLEEP)
        durations[stage.value] = round(time.monotonic() - start, 3)

    result = _build_result()
    result.metrics.stageDurations = StageDurations(**durations)
    if store.is_running(task_id):
        store.update(task_id, status=Status.succeeded, stage=None, result=result)

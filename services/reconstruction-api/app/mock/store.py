"""内存任务存储。

原型阶段用进程内 dict 保存任务,进程重启即清空。
真实持久化(SQLite)在后续轮次加入,worker 与路由只依赖本模块的接口。
"""
from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.schemas import Stage, Status, Task, TaskError

STAGES: list[Stage] = [
    Stage.preprocessing,
    Stage.analyzing,
    Stage.fitting_body,
    Stage.reconstructing_surface,
    Stage.texturing,
    Stage.optimizing,
]

_lock = threading.Lock()
_tasks: dict[str, Task] = {}
_fail_flags: dict[str, bool] = {}


def create_task(*, fail: bool = False, source_image_url: Optional[str] = None) -> Task:
    task = Task(
        id=uuid.uuid4().hex,
        status=Status.pending,
        createdAt=datetime.now(timezone.utc).isoformat(),
        sourceImageUrl=source_image_url,
    )
    with _lock:
        _tasks[task.id] = task
        _fail_flags[task.id] = fail
    return task


def get_task(task_id: str) -> Optional[Task]:
    with _lock:
        task = _tasks.get(task_id)
        return task.model_copy(deep=True) if task is not None else None


def get_internal(task_id: str) -> Optional[Task]:
    with _lock:
        return _tasks.get(task_id)


def is_fail(task_id: str) -> bool:
    with _lock:
        return _fail_flags.get(task_id, False)


def is_running(task_id: str) -> bool:
    with _lock:
        task = _tasks.get(task_id)
        return task is not None and task.status in (Status.pending, Status.processing)


def update(task_id: str, **fields) -> None:
    with _lock:
        task = _tasks.get(task_id)
        if task is None:
            return
        for key, value in fields.items():
            setattr(task, key, value)


def set_failed(task_id: str, code: str, message: str) -> None:
    with _lock:
        task = _tasks.get(task_id)
        if task is None:
            return
        task.status = Status.failed
        task.stage = None
        task.error = TaskError(code=code, message=message)


def mark_cancelled(task_id: str) -> Optional[Task]:
    with _lock:
        task = _tasks.get(task_id)
        if task is None:
            return None
        task.status = Status.cancelled
        task.stage = None
        return task.model_copy(deep=True)

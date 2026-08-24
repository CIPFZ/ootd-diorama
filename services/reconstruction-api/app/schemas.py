"""API 契约的 Pydantic 模型。

字段命名采用 camelCase,与前端 `apps/desktop-web/src/api/types.ts` 一一对应,
序列化后的 JSON 键即与前端类型一致。后续可抽到 `packages/asset-schema` 统一管理。
"""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class Stage(str, Enum):
    preprocessing = "preprocessing"
    analyzing = "analyzing"
    fitting_body = "fitting_body"
    reconstructing_surface = "reconstructing_surface"
    texturing = "texturing"
    optimizing = "optimizing"


class Status(str, Enum):
    pending = "pending"
    processing = "processing"
    succeeded = "succeeded"
    failed = "failed"
    cancelled = "cancelled"


class TaskError(BaseModel):
    code: str
    message: str


class StageDurations(BaseModel):
    preprocessing: Optional[float] = None
    analyzing: Optional[float] = None
    fitting_body: Optional[float] = None
    reconstructing_surface: Optional[float] = None
    texturing: Optional[float] = None
    optimizing: Optional[float] = None


class TaskMetrics(BaseModel):
    faceCount: int
    textureSize: str
    glbSizeBytes: int
    stageDurations: StageDurations


class TaskResult(BaseModel):
    glbUrl: str
    previewUrl: str
    thumbnailUrl: str
    maxYawDeg: int
    metrics: TaskMetrics


class Task(BaseModel):
    id: str
    status: Status
    stage: Optional[Stage] = None
    sourceImageUrl: Optional[str] = None
    error: Optional[TaskError] = None
    result: Optional[TaskResult] = None
    createdAt: str

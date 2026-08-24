from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import assets, tasks

app = FastAPI(title="OOTD Reconstruction API (mock)", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(assets.router)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

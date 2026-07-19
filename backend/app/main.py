from __future__ import annotations

from pathlib import Path
import os
import sys

# Ensure both container root and backend app root are in sys.path for robust module loading
_file_path = Path(__file__).resolve()
_backend_root = _file_path.parents[2]  # workspace / container root
_app_root = _file_path.parents[1]      # backend/ directory
for _path in [_backend_root, _app_root]:
    if str(_path) not in sys.path:
        sys.path.insert(0, str(_path))

def load_dotenv() -> None:
    try:
        # Look for .env in repo root, backend folder, or current working directory
        root = Path(__file__).resolve().parents[2]
        paths = [root / ".env", root / "backend" / ".env", Path(".env")]
        for path in paths:
            try:
                if path.exists():
                    for line in path.read_text(encoding="utf-8").splitlines():
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if "=" in line:
                            key, val = line.split("=", 1)
                            key = key.strip()
                            val = val.strip().strip("'\"")
                            if key:
                                os.environ.setdefault(key, val)
                    break
            except Exception:
                continue
    except Exception:
        pass

load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import get_settings
from app.db import get_engine, init_db
from app.services import SeedService
from sqlalchemy.orm import sessionmaker


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    settings = get_settings()
    if settings.seed_on_startup:
        SessionLocal = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, future=True)
        db = SessionLocal()
        try:
            SeedService(db).seed_if_empty()
        finally:
            db.close()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, Field


def _repo_root() -> Path:
    # backend/app/config.py → backend/ → repo root
    return Path(__file__).resolve().parents[2]


def _default_database_url() -> str:
    env_val = os.getenv("FIRSTCHECK_DATABASE_URL")
    if env_val:
        return env_val
    
    # Try local repository structure
    repo_db = _repo_root() / "backend" / "firstcheck.db"
    if repo_db.parent.exists():
        return f"sqlite:///{repo_db}"
        
    # Fallback for Docker container or standalone backend directory
    container_db = Path(__file__).resolve().parents[1] / "firstcheck.db"
    return f"sqlite:///{container_db}"


def _default_fixtures_dir() -> Path:
    # Try local repository structure
    repo_fixtures = _repo_root() / "data" / "fixtures"
    if repo_fixtures.exists():
        return repo_fixtures
        
    # Fallback for Docker container where backend is the root
    container_fixtures = Path(__file__).resolve().parents[1] / "fixtures"
    return container_fixtures


class Settings(BaseModel):
    """Runtime settings. Keep env surface minimal (AGENTS.md)."""

    app_name: str = "FirstCheck API"
    database_url: str = Field(default_factory=_default_database_url)
    fixtures_dir: Path = Field(default_factory=_default_fixtures_dir)
    seed_on_startup: bool = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

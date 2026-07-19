from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_sourcing_service
from app.db import get_db
from app.schemas.sourcing import (
    QueryRequest,
    QueryResponse,
    ScanRunResponse,
    PerSourceScanResponse,
    GitHubScanRequest,
    HNScanRequest,
    YCScanRequest,
    ScanStatusEntry,
)
from app.services.sourcing_service import SourcingService

router = APIRouter(tags=["sourcing"])


@router.post("/query", response_model=QueryResponse)
def post_query(
    body: QueryRequest,
    service: SourcingService = Depends(get_sourcing_service),
) -> QueryResponse:
    return service.query(body)


@router.post("/scan/run", response_model=ScanRunResponse)
def post_scan_run(
    service: SourcingService = Depends(get_sourcing_service),
) -> ScanRunResponse:
    return service.scan_run()


@router.post("/scan/github", response_model=PerSourceScanResponse)
def post_scan_github(
    body: GitHubScanRequest | None = None,
    db: Session = Depends(get_db),
) -> PerSourceScanResponse:
    from backend.fetchers.scanner import SourcingScanner
    scanner = SourcingScanner(db)
    topics = body.topics if body else None
    since_days = body.since_days if body else None
    res = scanner.scan_github(topics=topics, since_days=since_days)
    return PerSourceScanResponse.model_validate(res)


@router.post("/scan/hn", response_model=PerSourceScanResponse)
def post_scan_hn(
    body: HNScanRequest | None = None,
    db: Session = Depends(get_db),
) -> PerSourceScanResponse:
    from backend.fetchers.scanner import SourcingScanner
    scanner = SourcingScanner(db)
    query = body.query if body else None
    since_days = body.since_days if body else None
    res = scanner.scan_hn(query=query, since_days=since_days)
    return PerSourceScanResponse.model_validate(res)


@router.post("/scan/yc", response_model=PerSourceScanResponse)
def post_scan_yc(
    body: YCScanRequest | None = None,
    db: Session = Depends(get_db),
) -> PerSourceScanResponse:
    from backend.fetchers.scanner import SourcingScanner
    scanner = SourcingScanner(db)
    batches = body.batches if body else None
    industries = body.industries if body else None
    res = scanner.scan_yc(batches=batches, industries=industries)
    return PerSourceScanResponse.model_validate(res)


@router.get("/scan/status", response_model=list[ScanStatusEntry])
def get_scan_status() -> list[ScanStatusEntry]:
    from backend.fetchers.scanner import load_status
    status_list = load_status()
    return [ScanStatusEntry.model_validate(entry) for entry in status_list]


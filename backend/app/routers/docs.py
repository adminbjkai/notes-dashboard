"""API routes for Documentation portal."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.docs import (
    DocContentResponse,
    DocSearchResultResponse,
    DocStatusResponse,
    DocTreeNodeResponse,
    ProjectPulseResponse,
)
from app.services.docs_service import DocsService

router = APIRouter()


def get_docs_service() -> DocsService:
    """Dependency injection for DocsService."""
    return DocsService()


@router.get("/tree", response_model=list[DocTreeNodeResponse])
def get_doc_tree(service: DocsService = Depends(get_docs_service)):
    """Get hierarchical tree of documentation files."""
    return service.get_doc_tree()


@router.get("/status", response_model=DocStatusResponse)
def get_status(service: DocsService = Depends(get_docs_service)):
    """Get live status badges for polling."""
    return service.get_status_summary()


@router.get("/search", response_model=list[DocSearchResultResponse])
def search_docs(
    q: str = Query(..., min_length=2, description="Search query"),
    service: DocsService = Depends(get_docs_service),
):
    """Search documentation content."""
    return service.search(q)


@router.get("/pulse", response_model=ProjectPulseResponse)
def get_project_pulse(service: DocsService = Depends(get_docs_service)):
    """Get AI-generated project health summary."""
    # Import here to avoid circular imports and allow optional dependency
    from app.services.ai_summary_service import AISummaryService

    ai_service = AISummaryService()

    # Gather data
    status = service.get_status_summary()
    docs_content: dict[str, str] = {}
    for node in service.get_doc_tree():
        doc = service.get_doc_by_id(node.id)
        if doc:
            docs_content[doc.filename] = doc.content

    return ai_service.generate_pulse(status.badges, docs_content)


@router.get("/{doc_id}", response_model=DocContentResponse)
def get_doc(doc_id: str, service: DocsService = Depends(get_docs_service)):
    """Get full document content by slug."""
    doc = service.get_doc_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

"""Pydantic schemas for Documentation API."""

from datetime import datetime
from pydantic import BaseModel


class DocBadgeResponse(BaseModel):
    """Status badge extracted from documentation."""

    label: str
    value: str
    status: str  # "passing", "failing", "warning"
    source_file: str
    line_number: int


class DocHeadingResponse(BaseModel):
    """Heading for table of contents."""

    level: int
    text: str
    id: str


class DocTreeNodeResponse(BaseModel):
    """Tree node for documentation navigation."""

    id: str
    title: str
    filename: str
    children: list["DocTreeNodeResponse"]
    modified_at: datetime


class DocContentResponse(BaseModel):
    """Full document content with metadata."""

    id: str
    title: str
    filename: str
    content: str
    badges: list[DocBadgeResponse]
    headings: list[DocHeadingResponse]
    modified_at: datetime


class DocStatusResponse(BaseModel):
    """Live status summary for polling."""

    badges: list[DocBadgeResponse]
    last_modified: datetime | None
    files_checked: int


class DocSearchResultResponse(BaseModel):
    """Search result item."""

    doc_id: str
    filename: str
    line: int
    match: str
    context: str


class ProjectPulseResponse(BaseModel):
    """AI-generated project health summary."""

    summary: str
    metrics: dict[str, str]
    citations: list[dict]
    generated_by: str  # "rule-based" or "claude"

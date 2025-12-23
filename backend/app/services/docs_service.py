"""Documentation service for parsing and serving markdown files."""

import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from app.schemas.docs import (
    DocBadgeResponse,
    DocContentResponse,
    DocHeadingResponse,
    DocSearchResultResponse,
    DocStatusResponse,
    DocTreeNodeResponse,
)

# Documentation root - maps to volume-mounted repo root in Docker
# Falls back to parent of backend for local development
DOCS_ROOT = Path("/repo") if Path("/repo").exists() else Path(__file__).parent.parent.parent.parent

# Files to expose as documentation (order determines display order)
DOC_FILES = [
    "README.md",
    "VERIFICATION_REPORT.md",
    "HIERARCHY_LOGIC.md",
    "BACKEND_HIERARCHY_AUDIT.md",
    "DND_INTERACTION.md",
    "PLANS.md",
    "QA_REPORT.md",
    "AGENTS.md",
]


class DocsService:
    """Service for parsing and serving documentation files."""

    def __init__(self, docs_root: Path = DOCS_ROOT):
        self.docs_root = docs_root

    def get_doc_tree(self) -> list[DocTreeNodeResponse]:
        """Build hierarchical tree of documentation files."""
        nodes = []
        for filename in DOC_FILES:
            path = self.docs_root / filename
            if path.exists():
                nodes.append(
                    DocTreeNodeResponse(
                        id=self._filename_to_slug(filename),
                        title=self._extract_title(path),
                        filename=filename,
                        children=[],  # Flat structure for now
                        modified_at=datetime.fromtimestamp(path.stat().st_mtime),
                    )
                )
        return nodes

    def get_doc_by_id(self, doc_id: str) -> Optional[DocContentResponse]:
        """Get full document content by slug ID."""
        filename = self._slug_to_filename(doc_id)
        if not filename:
            return None

        path = self.docs_root / filename
        if not path.exists():
            return None

        content = path.read_text(encoding="utf-8")
        return DocContentResponse(
            id=doc_id,
            title=self._extract_title(path),
            filename=filename,
            content=content,
            badges=self._extract_badges(content, filename),
            headings=self._extract_headings(content),
            modified_at=datetime.fromtimestamp(path.stat().st_mtime),
        )

    def get_status_summary(self) -> DocStatusResponse:
        """Get live status from all documentation badges."""
        all_badges: list[DocBadgeResponse] = []
        last_modified: Optional[datetime] = None
        files_checked = 0

        for filename in DOC_FILES:
            path = self.docs_root / filename
            if path.exists():
                files_checked += 1
                content = path.read_text(encoding="utf-8")
                all_badges.extend(self._extract_badges(content, filename))
                mtime = datetime.fromtimestamp(path.stat().st_mtime)
                if last_modified is None or mtime > last_modified:
                    last_modified = mtime

        return DocStatusResponse(
            badges=all_badges,
            last_modified=last_modified,
            files_checked=files_checked,
        )

    def search(self, query: str, limit: int = 20) -> list[DocSearchResultResponse]:
        """Search across all documentation files."""
        results: list[DocSearchResultResponse] = []
        query_lower = query.lower()

        for filename in DOC_FILES:
            path = self.docs_root / filename
            if not path.exists():
                continue

            content = path.read_text(encoding="utf-8")
            lines = content.split("\n")

            for i, line in enumerate(lines):
                if query_lower in line.lower():
                    # Extract context (surrounding lines)
                    start = max(0, i - 1)
                    end = min(len(lines), i + 2)
                    context = "\n".join(lines[start:end])

                    results.append(
                        DocSearchResultResponse(
                            doc_id=self._filename_to_slug(filename),
                            filename=filename,
                            line=i + 1,
                            match=line.strip(),
                            context=context,
                        )
                    )

                    if len(results) >= limit:
                        return results

        return results

    def _extract_badges(self, content: str, filename: str) -> list[DocBadgeResponse]:
        """Extract status badges from markdown content."""
        badges: list[DocBadgeResponse] = []
        lines = content.split("\n")

        # Pattern 1: Table rows with pass/fail indicators
        # | Backend Tests | **7/7 PASSING** | ... |
        table_pattern = re.compile(
            r"\|\s*([^|]+)\s*\|\s*\*?\*?(\d+/\d+\s+(?:PASS(?:ING|ED)?|FAIL(?:ING|ED)?|WARNING))\*?\*?\s*\|",
            re.IGNORECASE,
        )

        # Pattern 2: Status lines like "**Playwright Tests | **31/36 PASSING**"
        status_pattern = re.compile(
            r"\*?\*?([^*|:]+?)(?:\s*[|:])?\s*\*?\*?(\d+/\d+\s+(?:PASS(?:ING|ED)?|FAIL(?:ING|ED)?))\*?\*?",
            re.IGNORECASE,
        )

        for i, line in enumerate(lines):
            # Check table pattern first
            match = table_pattern.search(line)
            if match:
                label = match.group(1).strip()
                value = match.group(2).strip().upper()
                status = self._determine_status(value)
                badges.append(
                    DocBadgeResponse(
                        label=label,
                        value=value,
                        status=status,
                        source_file=filename,
                        line_number=i + 1,
                    )
                )
                continue

            # Check status pattern
            match = status_pattern.search(line)
            if match and "/" in match.group(2):
                label = match.group(1).strip()
                value = match.group(2).strip().upper()
                # Skip if label looks like a number or is too short
                if label and len(label) > 2 and not label.isdigit():
                    status = self._determine_status(value)
                    badges.append(
                        DocBadgeResponse(
                            label=label,
                            value=value,
                            status=status,
                            source_file=filename,
                            line_number=i + 1,
                        )
                    )

        return badges

    def _determine_status(self, value: str) -> str:
        """Determine badge status from value string."""
        value_upper = value.upper()
        if "FAIL" in value_upper:
            return "failing"
        if "WARN" in value_upper:
            return "warning"
        if "PASS" in value_upper:
            # Check if all tests passing
            match = re.search(r"(\d+)/(\d+)", value)
            if match:
                passed, total = int(match.group(1)), int(match.group(2))
                if passed < total:
                    return "warning"
            return "passing"
        return "warning"

    def _extract_title(self, path: Path) -> str:
        """Extract title from first # heading or use filename."""
        try:
            content = path.read_text(encoding="utf-8")
            match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
            if match:
                return match.group(1).strip()
        except Exception:
            pass
        return path.stem.replace("_", " ").replace("-", " ").title()

    def _extract_headings(self, content: str) -> list[DocHeadingResponse]:
        """Extract headings for table of contents."""
        headings: list[DocHeadingResponse] = []
        pattern = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)
        for match in pattern.finditer(content):
            level = len(match.group(1))
            text = match.group(2).strip()
            heading_id = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
            headings.append(
                DocHeadingResponse(
                    level=level,
                    text=text,
                    id=heading_id,
                )
            )
        return headings

    def _filename_to_slug(self, filename: str) -> str:
        """Convert filename to URL-safe slug."""
        return filename.replace(".md", "").lower().replace("_", "-")

    def _slug_to_filename(self, slug: str) -> Optional[str]:
        """Convert slug back to filename."""
        for filename in DOC_FILES:
            if self._filename_to_slug(filename) == slug:
                return filename
        return None

"""AI Summary service for generating Project Pulse summaries."""

import os
import re
from typing import Any

from app.schemas.docs import DocBadgeResponse, ProjectPulseResponse


class AISummaryService:
    """Service for generating AI-powered project health summaries."""

    def __init__(self):
        self.anthropic_key = os.environ.get("ANTHROPIC_API_KEY")

    def generate_pulse(
        self, badges: list[DocBadgeResponse], docs_content: dict[str, str]
    ) -> ProjectPulseResponse:
        """Generate project health summary."""
        # Try Claude if API key is available
        if self.anthropic_key:
            try:
                return self._generate_with_claude(badges, docs_content)
            except Exception:
                # Fallback on any error
                pass

        # Fallback to rule-based extraction
        return self._generate_rule_based(badges, docs_content)

    def _generate_rule_based(
        self, badges: list[DocBadgeResponse], docs_content: dict[str, str]
    ) -> ProjectPulseResponse:
        """Extract key metrics using regex patterns."""
        metrics: dict[str, str] = {}
        citations: list[dict[str, Any]] = []

        # Extract pass rates from badges
        for badge in badges:
            if "PASS" in badge.value.upper():
                match = re.search(r"(\d+)/(\d+)", badge.value)
                if match:
                    passed, total = int(match.group(1)), int(match.group(2))
                    rate = (passed / total) * 100 if total > 0 else 0
                    metrics[badge.label] = f"{rate:.0f}%"
                    citations.append(
                        {
                            "file": badge.source_file,
                            "line": badge.line_number,
                            "excerpt": f"{badge.label}: {badge.value}",
                        }
                    )

        # Generate summary based on badge status
        passing_count = sum(1 for b in badges if b.status == "passing")
        warning_count = sum(1 for b in badges if b.status == "warning")
        failing_count = sum(1 for b in badges if b.status == "failing")
        total_count = len(badges)

        if total_count == 0:
            summary = "No status badges found in documentation."
        elif failing_count > 0:
            summary = f"Attention needed: {failing_count} check(s) are failing. Review required."
        elif warning_count > 0:
            summary = f"System operational with {warning_count} warning(s). {passing_count}/{total_count} checks fully passing."
        elif passing_count == total_count:
            summary = f"All {total_count} system checks are passing. Project is in excellent health."
        else:
            summary = f"{passing_count}/{total_count} checks passing. System is operational."

        # Extract additional context from VERIFICATION_REPORT.md if available
        if "VERIFICATION_REPORT.md" in docs_content:
            content = docs_content["VERIFICATION_REPORT.md"]
            # Look for certification status
            if "CERTIFIED OPERATIONAL" in content:
                summary = "Project CERTIFIED OPERATIONAL. " + summary
                citations.append(
                    {
                        "file": "VERIFICATION_REPORT.md",
                        "line": self._find_line_number(content, "CERTIFIED OPERATIONAL"),
                        "excerpt": "CERTIFIED OPERATIONAL",
                    }
                )

        return ProjectPulseResponse(
            summary=summary,
            metrics=metrics,
            citations=citations,
            generated_by="rule-based",
        )

    def _generate_with_claude(
        self, badges: list[DocBadgeResponse], docs_content: dict[str, str]
    ) -> ProjectPulseResponse:
        """Use Claude API to generate intelligent summary."""
        import json

        import anthropic

        client = anthropic.Anthropic(api_key=self.anthropic_key)

        # Build context from docs (limited to avoid token overflow)
        context = "Project Documentation Excerpts:\n\n"
        for filename, content in docs_content.items():
            # Extract first 1000 chars of each doc
            excerpt = content[:1000]
            if len(content) > 1000:
                excerpt += "..."
            context += f"--- {filename} ---\n{excerpt}\n\n"

        # Build badge summary
        badge_summary = "\n".join(
            [
                f"- {b.label}: {b.value} ({b.source_file}:{b.line_number})"
                for b in badges
            ]
        )

        prompt = f"""Analyze this project health data and provide a brief summary.

Status Badges:
{badge_summary}

{context}

Provide a JSON response with:
1. "summary": A 1-2 sentence health summary
2. "metrics": Key metrics as key-value pairs (e.g., {{"Backend Tests": "100%", "E2E Tests": "86%"}})
3. "citations": Array of {{"file": "filename", "line": number, "excerpt": "relevant text"}}

Important: Keep the summary concise and actionable. Cite specific files and lines for claims.

Respond with valid JSON only, no markdown formatting."""

        message = client.messages.create(
            model="claude-3-haiku-20240307",  # Fast, cost-effective
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse response
        response_text = message.content[0].text
        # Clean up potential markdown formatting
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()

        result = json.loads(response_text)

        return ProjectPulseResponse(
            summary=result.get("summary", ""),
            metrics=result.get("metrics", {}),
            citations=result.get("citations", []),
            generated_by="claude",
        )

    def _find_line_number(self, content: str, search_text: str) -> int:
        """Find line number of text in content."""
        lines = content.split("\n")
        for i, line in enumerate(lines):
            if search_text in line:
                return i + 1
        return 1

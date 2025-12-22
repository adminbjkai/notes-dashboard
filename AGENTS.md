# Collaboration Rules

- Always use TypeScript and Tailwind best practices for the frontend.
- Use FastAPI dependency injection for backend services.
- Before every major code change, update PLANS.md and run a /review.
- If a command fails, use the gh-fix-ci logic to diagnose before asking.

## Commands

```bash
# Start all services (Docker)
docker compose up --build

# Run database migrations
docker compose exec backend alembic upgrade head

# Create new migration after model changes
docker compose exec backend alembic revision --autogenerate -m "description"

# Reset everything (nuclear option)
docker compose down -v && docker compose up --build

# Linting
docker compose exec frontend npm run lint
docker compose exec backend ruff check .

# Type checking
docker compose exec frontend npm run type-check
docker compose exec backend mypy app --ignore-missing-imports

# Reset all notes (testing only)
curl -X DELETE http://localhost:8000/api/notes/reset/all
```

## Architecture

```
Browser ──► Next.js (localhost:3000) ──► FastAPI (localhost:8000) ──► PostgreSQL
              │                              │
              │ Server Components            │
              └──► http://backend:8000 ◄─────┘ (Docker internal)
```

**Frontend** (`frontend/`):
- `app/` - Next.js 15 App Router pages (Server Components by default)
- `components/layout/` - App shell, sidebar, page tree
- `components/editor/` - TipTap editor, slash commands, extensions
- `components/pages/` - Page editor component
- `components/ui/` - Reusable UI primitives
- `lib/api.ts` - API client with server/client URL resolution
- `types/` - TypeScript interfaces

**Backend** (`backend/`):
- `app/main.py` - FastAPI entry point
- `app/routers/notes.py` - Note CRUD endpoints
- `app/routers/uploads.py` - File upload endpoint
- `app/services/` - Business logic
- `app/models/` - SQLAlchemy ORM models
- `app/schemas/` - Pydantic validation schemas
- `alembic/` - Database migrations

## Editor Architecture

The rich text editor uses TipTap with these key components:

| File | Purpose |
|------|---------|
| `editor-extensions.ts` | Extension configuration (Table, CodeBlock, TaskList, etc.) |
| `rich-text-editor.tsx` | Main editor component with toolbar |
| `markdown-converter.ts` | Bidirectional Markdown ⇄ HTML conversion using marked/turndown |
| `slash-command.tsx` | Slash menu for inserting blocks (keyboard-driven) |
| `resizable-image.tsx` | Custom image node with resize handles |
| `callout-extension.ts` | Custom callout block extension |
| `file-attachment.tsx` | Attachment chip node for uploaded files |
| `image-url-dialog.tsx` | Modal dialog for inserting images via URL |

**Markdown Conversion:**
- `markdownToHtml()` - Converts markdown to HTML for TipTap (using `marked`)
- `htmlToMarkdown()` - Converts TipTap HTML to markdown for storage (using `turndown`)
- Custom rules handle: tables, task lists, callouts, code blocks, file attachments

**File Attachment Encoding:**
- Storage: Plain Markdown link `[filename](/uploads/uuid-filename.ext)`
- Rendering: Links to `/uploads/` are rendered as interactive chips with download/remove buttons
- Round-trip: `marked` parses to `<a href="/uploads/...">`, `FileAttachment` extension renders as chip, `turndown` serializes back to markdown link

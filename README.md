# Notes Dashboard

A single-tenant notes application with hierarchical pages and rich text editing. No authentication by design.

## Features

- Hierarchical page organization with drag-and-drop reordering
- Rich text editing with TipTap (WYSIWYG)
- Slash command menu for quick block insertion
- Tables with add/remove row/column controls
- Image upload and URL embedding with resize controls
- File attachments
- Code blocks with syntax highlighting
- Task lists, callouts, blockquotes
- Dark mode support
- Auto-save with debouncing

## Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, TipTap
- **Backend**: FastAPI, SQLAlchemy, Alembic
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker Compose

## Quick Start

```bash
# Start all services
docker compose up --build

# Run database migrations (first time or after schema changes)
docker compose exec backend alembic upgrade head
```

**Access points:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

## Project Structure

```
notes-dashboard/
├── frontend/
│   ├── app/                    # Next.js App Router pages
│   ├── components/
│   │   ├── editor/             # TipTap editor components
│   │   ├── layout/             # App shell, sidebar, page tree
│   │   ├── pages/              # Page editor
│   │   └── ui/                 # Reusable UI primitives
│   ├── lib/                    # API client, utilities
│   └── types/                  # TypeScript interfaces
├── backend/
│   ├── app/
│   │   ├── routers/            # API endpoints
│   │   ├── services/           # Business logic
│   │   ├── models/             # SQLAlchemy models
│   │   └── schemas/            # Pydantic schemas
│   └── alembic/                # Database migrations
└── docker-compose.yml
```

## Data Model

Each note has:

- `title` (required) - Note title
- `content` (optional) - Main content stored as Markdown
- `sidenote` (optional) - Secondary annotation
- `parent_id` (optional) - Parent note for hierarchy
- `position` - Order within siblings

## Editor

The editor uses [TipTap](https://tiptap.dev/) with bidirectional Markdown conversion:

- **Storage**: Markdown in PostgreSQL
- **Editing**: WYSIWYG with TipTap
- **Conversion**: `marked` (MD→HTML), `turndown` (HTML→MD)

**Slash Commands** (type `/`):

- Text blocks: Paragraph, Heading 1-3
- Lists: Bullet, Numbered, To-do
- Tables: 2x2, 3x3, 4x4 with row/column controls
- Media: Image upload, Image URL, File attachment
- Other: Quote, Code block, Callout, Divider

## Container Networking

```
┌─────────────────────────────────────────────────────────────┐
│ Docker Network                                              │
│                                                             │
│  ┌───────────┐    http://backend:8000    ┌───────────┐     │
│  │ frontend  │ ───────────────────────▶  │  backend  │     │
│  │ :3000     │   (Server Components)     │  :8000    │     │
│  └───────────┘                           └───────────┘     │
│       │                                       │            │
│       │                              postgresql://db:5432  │
│       │                                       │            │
│       │                                  ┌─────────┐       │
│       │                                  │   db    │       │
│       │                                  │  :5432  │       │
│       │                                  └─────────┘       │
└───────│─────────────────────────────────────────────────────┘
        │
        │ http://localhost:8000 (Browser → Backend)
        ▼
    ┌────────┐
    │ Browser │
    └────────┘
```

- **Server Components** (inside Docker): Use `http://backend:8000`
- **Browser requests** (outside Docker): Use `http://localhost:8000`

## Documentation

- **Implementation Log**: `.nd/docs/implementation-log.md` (canonical location)
- **Claude Code Guide**: `CLAUDE.md` (commands, architecture, API reference)
- **Screenshots**: `.nd/docs/screenshots/YYYY-MM-DD/`

## Testing

```bash
# Run Playwright smoke tests (requires services running)
cd frontend && npx playwright test

# Run with visible browser
cd frontend && npx playwright test --headed

# Run specific test
cd frontend && npx playwright test -g "numbered list"
```

**Smoke tests verify:**
- Homepage loads correctly
- Slash menu keyboard navigation (Arrow keys + Enter)
- Block insertion: numbered list, quote, table
- Content persistence after page refresh
- Dark mode toggle
- Sidebar navigation

Screenshots are saved to `.nd/docs/screenshots/YYYY-MM-DD/`

## Development Commands

```bash
# Linting
docker compose exec frontend npm run lint
docker compose exec backend ruff check .

# Type checking
docker compose exec frontend npm run type-check
docker compose exec backend mypy app --ignore-missing-imports

# Create database migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Reset everything
docker compose down -v && docker compose up --build
```

## Non-Docker Development

If running services directly on host (not recommended):

```bash
# Terminal 1: Start PostgreSQL (or use existing instance)
# Ensure postgres is running on localhost:5432

# Terminal 2: Backend
cd backend
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Terminal 3: Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Environment Variables

| Service | Variable | Docker Value | Purpose |
|---------|----------|--------------|---------|
| frontend | `API_URL` | `http://backend:8000` | Server Components |
| frontend | `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Browser |
| backend | `DATABASE_URL` | `postgresql://...@db:5432/...` | DB connection |
| backend | `CORS_ORIGINS` | `http://localhost:3000` | Allowed origins |

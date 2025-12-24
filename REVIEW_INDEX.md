# REVIEW_INDEX.md

## Governance & Constitution Extraction - File Inventory

Generated: 2024-12-24

---

## claude_prompting_guides/ (9 files)

| File | Why It Matters | Extracted Invariant Rules |
|------|----------------|---------------------------|
| `Create Plugins.md` | Defines Claude Code plugin architecture, slash commands, agents, hooks, MCP servers | - Plugins use `.claude-plugin/plugin.json` manifest<br>- Commands go in `commands/` directory (NOT inside `.claude-plugin/`)<br>- Skills go in `skills/` directory with `SKILL.md` files<br>- Plugin names become slash command namespaces |
| `Agent skills.md` | Explains Skills as model-invoked capabilities for extending Claude | - Skills stored in `~/.claude/skills/` (personal) or `.claude/skills/` (project)<br>- `SKILL.md` required with YAML frontmatter<br>- `name` field: lowercase, numbers, hyphens only (max 64 chars)<br>- `description`: max 1024 chars<br>- `allowed-tools` restricts tool access |
| `discover and install prebuilt plugins.txt` | Plugin marketplace discovery and installation | - Official marketplace: `claude-plugins-official`<br>- Install scope: user, project, or local<br>- Plugin commands namespaced: `/plugin-name:command` |
| `output styles.md` | Output style customization for different agent personas | - Styles modify system prompt directly<br>- Stored in `~/.claude/output-styles/` or `.claude/output-styles/`<br>- `keep-coding-instructions` frontmatter option |
| `hooks.md` | Event-driven shell command execution | - Events: PreToolUse, PostToolUse, Notification, Stop, etc.<br>- Hooks provide deterministic control (not LLM-dependent)<br>- Security: hooks run with user credentials |
| `programmatic usage.md` | Agent SDK and CLI usage | - `-p` flag for non-interactive execution<br>- `--allowedTools` for auto-approval<br>- `--output-format json` for structured output<br>- `--continue` / `--resume` for conversations |
| `model context protocol (mcp).md` | MCP server integration | - Transports: http, sse, stdio<br>- Scopes: local, project, user<br>- Project scope: `.mcp.json` file<br>- Enterprise: `managed-mcp.json` in system directories |
| `troubleshooting.md` | Common issues and solutions | - Config files: `~/.claude/settings.json`, `.claude/settings.json`<br>- Global state: `~/.claude.json`<br>- `/doctor` for installation health check |
| `development containers.md` | Devcontainer setup for consistent environments | - Reference devcontainer at `.devcontainer/`<br>- Firewall rules for network isolation<br>- `--dangerously-skip-permissions` for unattended operation |

---

## docs-by-notebooklm/ (6 files)

| File | Why It Matters | Extracted Invariant Rules |
|------|----------------|---------------------------|
| `System_Hardening_A_Case_Study (1).pdf` | **PRIMARY SOURCE** - Comprehensive audit of backend hierarchy logic and hardening fixes | **BACKEND INVARIANTS:**<br>- `_normalize_positions()` is single source of truth<br>- Positions are 0-indexed ONLY<br>- Deterministic ordering: `ORDER BY position, created_at, id`<br>- Recursion depth limit: 100<br>- Atomic deletes (flush + commit)<br>- Create must call `_normalize_positions()`<br>**FRONTEND INVARIANTS:**<br>- 35/30/35 vertical drop zones<br>- Drag >40px right = indent (force "on")<br>- Drag <-40px left = outdent |
| `A_SIMPLE_GUIDE_TO_THIS_APPs_ARCHITECTURE.txt` | Beginner-friendly architecture overview | **ARCHITECTURE INVARIANTS:**<br>- Dual-URL backend access:<br>  - Browser: `http://localhost:8000`<br>  - Frontend server: `http://backend:8000`<br>- TipTap stores Markdown as persistence format<br>- Three-tier: Frontend (Next.js), Backend (FastAPI), Database (PostgreSQL) |
| `notes-dashboard-e2e-architecture.png` | End-to-end technical architecture diagram | **ENCODED INVARIANTS:**<br>- Client-side pre-validation before API calls<br>- 35/30/35 drop zone strategy with Tailwind CSS<br>- Container network communication via Docker<br>- FastAPI routing through Pydantic schemas<br>- SQLAlchemy ORM with circular reference prevention<br>- PostgreSQL 16 with atomic transactions |
| `notes-dashboard a full-stack project overview.png` | Project overview infographic | **ENCODED INVARIANTS:**<br>- Hierarchical drag-and-drop with 35/30/35 zones<br>- TipTap editor with slash commands<br>- Circular reference prevention<br>- Position normalization<br>- Bidirectional Markdown <-> HTML conversion |
| `notes-dashboard anatomy of a full-stack app.png` | Technology stack breakdown | **ENCODED INVARIANTS:**<br>- Frontend: Next.js 15, TypeScript, Tailwind CSS, dnd-kit<br>- Backend: FastAPI, SQLAlchemy, Pydantic<br>- Infrastructure: PostgreSQL 16, Docker Compose<br>- Full media support: image uploads, URL embedding |
| `A_Bulletproof_Notes_App.mp4` | Video walkthrough (42MB) | **ENCODED INVARIANTS:**<br>- Demo of production-ready system<br>- Showcases hardened hierarchy operations<br>- Visual verification of 35/30/35 drop zones |

---

## Repository Inventory Results

### Upload/Image/File-Picker Paths
| File | Purpose |
|------|---------|
| `backend/app/routers/uploads.py` | File upload endpoint with multipart/form-data |
| `frontend/components/editor/file-attachment.tsx` | File attachment UI component |
| `frontend/components/editor/resizable-image.tsx` | Image display with resize controls |
| `frontend/components/editor/image-url-dialog.tsx` | URL-based image insertion |
| `frontend/components/editor/rich-text-editor.tsx` | TipTap editor integration |

### Hierarchy Logic (normalize_positions, reorder)
| File | Purpose |
|------|---------|
| `backend/app/services/note_service.py` | **CRITICAL** - Core hierarchy service with `_normalize_positions()`, `reorder()`, `_is_descendant()` |
| `backend/app/routers/notes.py` | API routes for CRUD + reorder |
| `backend/tests/test_reorder_comprehensive.py` | Edge case test suite |
| `frontend/components/layout/page-tree.tsx` | dnd-kit integration with 35/30/35 zones |
| `frontend/lib/api.ts` | Frontend API client |

### Next.js /docs Routes
| File | Purpose |
|------|---------|
| `frontend/app/docs/page.tsx` | Docs index page |
| `frontend/app/docs/[slug]/page.tsx` | Dynamic doc page |
| `frontend/app/docs/layout.tsx` | Docs layout wrapper |
| `frontend/components/docs/docs-sidebar.tsx` | Docs navigation |
| `frontend/components/docs/docs-status-live.tsx` | Live status display |

### Multipart/Form-Data Endpoints
| File | Purpose |
|------|---------|
| `backend/app/routers/uploads.py` | Single endpoint: `POST /uploads` with `UploadFile` |

---

## Key Findings

### Critical Backend Functions (note_service.py)
1. `_normalize_positions()` - Enforces 0-indexed sequential positions
2. `_get_next_position()` - Returns count (0-indexed)
3. `_is_descendant()` - Recursive CTE with depth limit of 100
4. `reorder()` - Moves note to temporary position (999999), then normalizes
5. `delete()` - Atomic delete with flush + commit

### Critical Frontend Logic (page-tree.tsx)
1. Drop zones: 35% top (before), 30% middle (on), 35% bottom (after)
2. Indent threshold: >40px horizontal drag = force "on" drop
3. Outdent threshold: <-40px horizontal drag = move to parent level
4. Root drop zone: 20px wide strip on left side

### Forbidden Zone Identified
- **Next.js /docs routes exist on port 3000** - These are internal documentation pages, not for public exposure

---

*This index was generated by reading all files in `claude_prompting_guides/` and `docs-by-notebooklm/`, plus repository inventory via Glob/Grep.*

# visualization

Generate architecture diagrams, mindmaps, and audit status infographics using Mermaid.

## Usage

When this skill is invoked with "diagram", "visualize", or "architecture", generate the appropriate Mermaid source.

## Templates

### 1. Architecture Diagram

Generate to: `docs-by-notebooklm/generated/architecture.mmd`

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js :3000)"]
        UI[TipTap Editor]
        DnD[dnd-kit Sidebar]
        API_Client[API Client]
    end

    subgraph Backend["Backend (FastAPI :8000)"]
        Routes[API Routes]
        Services[Note Service]
        Upload[Upload Handler]
    end

    subgraph Database["PostgreSQL :5432"]
        Notes[(notes table)]
    end

    subgraph Storage["File Storage"]
        Uploads[/app/uploads/]
    end

    UI --> API_Client
    DnD --> API_Client
    API_Client -->|localhost:8000| Routes
    Routes --> Services
    Routes --> Upload
    Services --> Notes
    Upload --> Uploads

    style Frontend fill:#e1f5fe
    style Backend fill:#fff3e0
    style Database fill:#e8f5e9
    style Storage fill:#fce4ec
```

### 2. Drag-and-Drop Zones Diagram

Generate to: `docs-by-notebooklm/generated/dnd-zones.mmd`

```mermaid
graph LR
    subgraph DropZones["Vertical Drop Zones (35/30/35)"]
        Top["Top 35%<br/>INSERT BEFORE"]
        Middle["Middle 30%<br/>NEST AS CHILD"]
        Bottom["Bottom 35%<br/>INSERT AFTER"]
    end

    subgraph Horizontal["Horizontal Thresholds"]
        Indent[">+40px → Force NEST"]
        Outdent["<-40px → Move to Parent"]
    end

    style Top fill:#c8e6c9
    style Middle fill:#bbdefb
    style Bottom fill:#c8e6c9
    style Indent fill:#fff9c4
    style Outdent fill:#ffccbc
```

### 3. Data Flow Diagram

Generate to: `docs-by-notebooklm/generated/data-flow.mmd`

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Drag note to new position
    FE->>BE: POST /api/notes/reorder
    BE->>DB: UPDATE position = 999999
    BE->>DB: SELECT siblings ORDER BY position, created_at, id
    BE->>DB: UPDATE positions (0, 1, 2, ...)
    BE->>FE: 200 OK (normalized tree)
    FE->>U: UI updates
```

### 4. Audit Status Infographic

Generate to: `docs-by-notebooklm/generated/audit-status.mmd`

```mermaid
pie title Quality Gate Status
    "Passing" : 7
    "Failing" : 0

---
gantt
    title Verification Timeline
    dateFormat  YYYY-MM-DD
    section Backend
    ruff check     :done, 2024-01-01, 1d
    mypy           :done, 2024-01-01, 1d
    pytest         :done, 2024-01-01, 1d
    section Frontend
    lint           :done, 2024-01-01, 1d
    type-check     :done, 2024-01-01, 1d
    section E2E
    playwright     :done, 2024-01-01, 1d
```

## Output Locations

All generated diagrams go to: `docs-by-notebooklm/generated/`

| Diagram | Filename |
|---------|----------|
| Architecture | `architecture.mmd` |
| DnD Zones | `dnd-zones.mmd` |
| Data Flow | `data-flow.mmd` |
| Audit Status | `audit-status.mmd` |

## Rendering (if tools available)

```bash
# If mermaid-cli is installed
mmdc -i docs-by-notebooklm/generated/architecture.mmd -o docs-by-notebooklm/generated/architecture.svg

# If not installed, Mermaid sources can be rendered via:
# - GitHub markdown preview
# - https://mermaid.live
# - VS Code Mermaid extension
```

## When to Use
- Documenting architecture for new team members
- Creating presentations
- Audit reports
- README documentation

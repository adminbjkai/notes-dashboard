# Systems Architecture Specification

This document provides a formal technical topology of the **Notes-Dashboard** stack.

## Technical Topology

![Technical Architecture Specification](image:///Users/m17/.gemini/antigravity/brain/3f3fd48c-b999-4906-96c9-c760036d0197/notes_dashboard_architecture_final_1766639682140.png)

## Component Communication Flow

```mermaid

  space:1

  block:BackendLayer:1
    columns 3
    FastAPI["FastAPI (Python 3.12)"]
    Uvicorn["Uvicorn (ASGI)"]
    Service["NoteService (Logic)"]
    Pydantic["Pydantic (Validation)"]
    Normalization["Position Normalization"]
    CTE["Recursive CTE Protection"]
  end

  space:1

  block:DataLayer:1
    columns 3
    Postgres["PostgreSQL 16"]
    SQLAlchemy["SQLAlchemy 2.0 (ORM)"]
    Cascade["Cascading Deletes (DB level)"]
    Alembic["Alembic (Migrations)"]
  end

  space:1

  block:Infrastructure:1
    columns 1
    Docker["Docker Compose Orchestration"]
  end

  %% Relationships
  Browser -- "Interaction" --> NextJS
  NextJS -- "REST API" --> FastAPI
  FastAPI -- "SQL / Sessions" --> Postgres
  NextJS -. "State" .-> React
  FastAPI -. "Rules" .-> Service
  Service -. "Integrity" .-> Normalization
  Service -. "Cycle Prevention" .-> CTE
  
  style Client fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
  style FrontendLayer fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
  style BackendLayer fill:#1e293b,stroke:#8b5cf6,stroke-width:2px,color:#fff
  style DataLayer fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#fff
  style Infrastructure fill:#0f172a,stroke:#94a3b8,stroke-dasharray: 5 5,color:#fff
```

---

## Technical Highlights

### 🌳 Advanced Hierarchy Management
The application features a robust nested hierarchy system:
- **Recursive Tree Building**: The frontend (`buildNoteTree`) transforms flat database rows into a performant nested tree structure.
- **Recursive CTE Protection**: The backend uses PostgreSQL **Recursive Common Table Expressions** to check for circular references, preventing a node from ever becoming a descendant of itself.
- **Deterministic Ordering**: A triple-sort normalization algorithm (Position, Created_at, ID) ensures the sidebar remains deterministic across all devices.
- **Cascading Integrity**: Database-level `ON DELETE CASCADE` and SQLAlchemy-level `delete-orphan` cascades ensure that deleting a parent note cleanly removes its entire branch.

### 🎨 Frontend Layer (Next.js 15 + React 19)
- **Framework**: Built with **Next.js 15** using the **App Router** for optimized routing and server-side rendering.
- **Styling**: **Tailwind CSS** provides a responsive design system with a premium dark-mode aesthetic.
- **Rich Text**: **TipTap Editor** powers the notes creation, providing a flexible, extendable text editing experience.
- **Interactions**: **@dnd-kit** ensures smooth drag-and-drop capabilities for tree reordering.

### ⚙️ Backend API Layer (FastAPI)
- **Framework**: **FastAPI** (Python 3.12) provides a high-performance, asynchronous REST API with automatic OpenAPI documentation.
- **Concurrency**: **Uvicorn** (ASGI server) handles high-concurrency note updates and document syncing.
- **Validation**: **Pydantic V2** ensures runtime data safety and type-first development.

### 🗄️ Data Layer (PostgreSQL & SQLAlchemy)
- **Database**: **PostgreSQL 16** serves as the robust, transactional relational data store.
- **ORM**: **SQLAlchemy 2.0** (Typed) provides a pythonic, safe interface for complex hierarchical queries.
- **Migrations**: **Alembic** manages version-controlled database schema evolutions.

### 🐳 Infrastructure (Docker)
- **Containerization**: Every service (Frontend, Backend, DB) is isolated via **Docker**.
- **Orchestration**: **Docker Compose** manages the networking, shared volumes for uploads, and environment synchronization.

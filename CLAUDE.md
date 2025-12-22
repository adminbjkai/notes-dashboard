# Project Standards: Notes Dashboard
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL. Use _normalize_positions for all moves.
- **Frontend**: Next.js, Tailwind, dnd-kit. Use 25/50/25 zones for drag-and-drop.
- **Commands**: 
  - Backend: docker compose exec backend pytest
  - Frontend: docker compose exec frontend npm run lint
  - Full Reset: curl -X DELETE http://localhost:8000/api/notes/reset/all

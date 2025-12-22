# Hierarchy Logic

This document describes how the notes hierarchy system works in the Notes Dashboard application.

## Overview

Notes are organized in a tree structure where any note can have child notes (subpages). The hierarchy is managed through `parent_id` and `position` fields on each note.

## Data Model

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  parent_id: string | null;  // null = root-level note
  position: number;          // ordering among siblings
  created_at: string;
  updated_at: string;
}
```

## Tree Building

The `buildNoteTree()` function in `frontend/lib/api.ts` transforms a flat array of notes into a nested tree structure:

```typescript
interface NoteTreeNode {
  id: string;
  title: string;
  parent_id: string | null;
  position: number;
  children: NoteTreeNode[];
}
```

### Algorithm

1. Create a map of all notes by ID
2. Separate root notes (`parent_id === null`) from child notes
3. For each note, attach it to its parent's `children` array
4. Sort children by `position` at each level
5. Return the sorted root-level nodes

## Hierarchy Operations

### Creating a Subpage

When creating a subpage under an existing note:

1. Set `parent_id` to the parent note's ID
2. Set `position` to the parent's current child count (appends at end)
3. Auto-expand the parent in the sidebar to show the new child

**Location:** `page-tree.tsx:453-484` (`handleCreatePage` and `handleCreateSubmit`)

### Moving Notes (Drag and Drop)

Notes can be moved via drag and drop. Three drop positions determine the outcome:

| Drop Position | Result |
|---------------|--------|
| `"before"` | Insert as sibling above target |
| `"on"` | Nest as child of target |
| `"after"` | Insert as sibling below target |

**Location:** `page-tree.tsx:636-733` (`handleDragEnd`)

### Deleting Notes

When a note is deleted:

1. All descendant notes are also deleted (cascade)
2. User is warned if the note has children
3. If the deleted note was being viewed, redirect to home

**Location:** `page-tree.tsx:509-524` (`handleDelete`)

## Invalid Drop Targets

To prevent circular references, certain drop targets are invalid:

1. **Self**: A note cannot be dropped on itself
2. **Descendants**: A note cannot be dropped on any of its children/grandchildren

The `invalidTargets` set is computed whenever a drag starts:

```typescript
// page-tree.tsx:314-339
const invalidTargets = useMemo(() => {
  if (!activeId) return new Set<string>();

  const activeNode = findNode(tree, activeId);
  const targets = new Set<string>([activeNode.id]);

  // Recursively add all descendants
  const collectDescendants = (node: NoteTreeNode) => {
    for (const child of node.children) {
      targets.add(child.id);
      collectDescendants(child);
    }
  };
  collectDescendants(activeNode);

  return targets;
}, [activeId, tree]);
```

## Root Drop Zone

A special "root drop zone" allows moving notes to the top level:

- Activated when dragging to the far left edge of the sidebar (< 16px from left)
- Uses the sentinel ID `__ROOT_DROP_ZONE__`
- Sets `parent_id` to `null` and `position` to end of root array

**Location:** `page-tree.tsx:574-582` and `page-tree.tsx:654-673`

## Auto-Expansion

The sidebar automatically expands parent nodes in two scenarios:

1. **On page navigation**: Parents of the current page are expanded (`page-tree.tsx:394-413`)
2. **On hover during drag**: Collapsed nodes expand after 500ms hover (`page-tree.tsx:603-617`)

## Backend API

The hierarchy is persisted via these API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/notes` | Create note with optional `parent_id` |
| `PATCH /api/notes/:id` | Update `parent_id` and/or `position` |
| `PUT /api/notes/:id/reorder` | Atomic reorder operation |
| `DELETE /api/notes/:id` | Delete note and all descendants |

The backend (`note_service.py`) handles position normalization to maintain consistent ordering.

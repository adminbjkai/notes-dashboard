# Drag and Drop Interaction

This document describes the drag-and-drop implementation in the Notes Dashboard sidebar.

## Technology Stack

- **Library**: [dnd-kit](https://dndkit.com/) (React drag-and-drop toolkit)
- **Components Used**:
  - `DndContext` - Provides drag-and-drop context
  - `SortableContext` - Enables sortable lists
  - `useSortable` - Hook for sortable items
  - `DragOverlay` - Renders the dragged item preview
  - `PointerSensor` - Mouse/touch input handling

## 25/50/25 Vertical Drop Zone Strategy

The drop position is determined by where the pointer is within the target element's vertical bounds:

```
┌─────────────────────────────┐
│  Upper 25%  →  "before"     │  Insert above target
├─────────────────────────────┤
│                             │
│  Middle 50%  →  "on"        │  Nest as child of target
│                             │
├─────────────────────────────┤
│  Lower 25%  →  "after"      │  Insert below target
└─────────────────────────────┘
```

### Implementation

**Location:** `page-tree.tsx:359-370`

```typescript
type DropPosition = "before" | "after" | "on";

const getDropPosition = (
  overRect: { top: number; bottom: number; height: number } | null,
  pointerY: number | null
): DropPosition => {
  if (!overRect) return "on";
  const y = pointerY ?? overRect.top + overRect.height / 2;
  const upperBand = overRect.top + overRect.height * 0.25;
  const lowerBand = overRect.bottom - overRect.height * 0.25;
  if (y <= upperBand) return "before";
  if (y >= lowerBand) return "after";
  return "on";
};
```

### Thresholds

| Threshold | Calculation | Meaning |
|-----------|-------------|---------|
| Upper band | `top + height * 0.25` | 25% from top |
| Lower band | `bottom - height * 0.25` | 25% from bottom (i.e., 75% from top) |

### Visual Feedback

Drop position is indicated visually:

| Position | Visual Indicator |
|----------|------------------|
| `"before"` | Blue line at top of target (`page-tree.tsx:123-125`) |
| `"after"` | Blue line at bottom of target (`page-tree.tsx:126-128`) |
| `"on"` | Blue background highlight on target (`page-tree.tsx:117`) |
| Invalid | Red border and background (`page-tree.tsx:118-120`) |

## Drag Handle

Each tree item has a dedicated drag handle (grip icon) that initiates dragging:

**Location:** `page-tree.tsx:130-139`

```typescript
<button
  type="button"
  {...attributes}
  {...listeners}
  className="cursor-grab opacity-0 group-hover:opacity-100 ..."
  data-dnd-handle
>
  <GripVertical className="h-3 w-3 text-gray-400" />
</button>
```

- Only visible on hover
- Uses `useSortable` hook's `attributes` and `listeners`

## Activation Constraint

Dragging requires 8px of movement before activating to prevent accidental drags:

**Location:** `page-tree.tsx:385-391`

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })
);
```

## Event Propagation Prevention

All interactive elements in the sidebar prevent event propagation to avoid triggering drags accidentally.

### Menu Button

**Location:** `page-tree.tsx:181-189`

```typescript
<button
  onClick={(e) => {
    e.stopPropagation();  // Prevents drag initiation
    setMenuOpenId(menuOpenId === node.id ? null : node.id);
  }}
>
  <MoreHorizontal />
</button>
```

### Menu Container

**Location:** `page-tree.tsx:192-198`

```typescript
<div
  ref={menuRef}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();  // Prevents drag initiation
  }}
>
```

### Menu Actions

All menu action buttons include both `preventDefault()` and `stopPropagation()`:

| Action | Location |
|--------|----------|
| Add Subpage | `page-tree.tsx:201-206` |
| Rename | `page-tree.tsx:213-217` |
| Delete | `page-tree.tsx:224-228` |

Example pattern:

```typescript
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onActionHandler();
  setMenuOpenId(null);
}}
```

## Drag Lifecycle

### 1. Drag Start (`handleDragStart`)

**Location:** `page-tree.tsx:540-567`

- Sets `activeId` to the dragged note's ID
- Clears any existing drop target
- Captures initial pointer position for accurate tracking

### 2. Drag Over (`handleDragOver`)

**Location:** `page-tree.tsx:569-622`

- Calculates current pointer position
- Checks for root drop zone (far left edge)
- Validates drop target (not self or descendant)
- Computes drop position using 25/50/25 strategy
- Updates `dropTarget` state for visual feedback
- Triggers auto-expand on 500ms hover over collapsed nodes

### 3. Drag End (`handleDragEnd`)

**Location:** `page-tree.tsx:636-733`

- Clears drag state
- Determines final drop position
- Handles three cases:
  1. **Root drop**: Move to top level (`parent_id: null`)
  2. **Nest drop** (`"on"`): Set `parent_id` to target, position at end of children
  3. **Sibling drop** (`"before"`/`"after"`): Keep target's parent, adjust position
- Calls `reorderNote` and `updateNote` APIs
- Refreshes the router to reflect changes

### 4. Drag Cancel (`handleDragCancel`)

**Location:** `page-tree.tsx:624-634`

- Resets all drag state
- Clears hover-expand timeout
- Restores normal cursor

## Drag Overlay

A floating preview of the dragged item follows the cursor:

**Location:** `page-tree.tsx:818-824`

```typescript
<DragOverlay>
  {activeId ? (
    <div className="rounded bg-white dark:bg-gray-900 px-2 py-1 text-sm shadow-lg border">
      {pages.find((p) => p.id === activeId)?.title || "Page"}
    </div>
  ) : null}
</DragOverlay>
```

## Auto-Expand on Hover

When dragging over a collapsed node with children, it auto-expands after 500ms:

**Location:** `page-tree.tsx:603-617`

```typescript
if (overNode.children.length > 0 && !expandedIds.has(overNode.id)) {
  if (hoverExpandRef.current.id !== overNode.id) {
    if (hoverExpandRef.current.timeout) {
      clearTimeout(hoverExpandRef.current.timeout);
    }
    const timeout = setTimeout(() => {
      setExpandedIds((prev) => new Set([...prev, overNode.id]));
    }, 500);
    hoverExpandRef.current = { id: overNode.id, timeout };
  }
}
```

## Cursor States

| State | Cursor |
|-------|--------|
| Drag handle hover | `cursor-grab` |
| During drag | Default |
| Over invalid target | `not-allowed` |

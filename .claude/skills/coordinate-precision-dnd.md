# Coordinate Precision DnD Skill

## Purpose
Provides precise drag-and-drop coordinate calculations for the Notes Dashboard tree navigation system.

## 35/30/35 Vertical Zone Strategy

The vertical drop zones use the Confluence/Docmost standard proportions:

```
┌─────────────────────────────────────┐
│                                     │
│   TOP 35%  →  position: "before"    │  Reorder: Insert above target
│                                     │
├─────────────────────────────────────┤
│   MIDDLE 30%  →  position: "on"     │  Nest: Become child of target
├─────────────────────────────────────┤
│                                     │
│   BOTTOM 35%  →  position: "after"  │  Reorder: Insert below target
│                                     │
└─────────────────────────────────────┘
```

### Mathematical Formula

```typescript
const getDropPosition = (overRect, pointerY): DropPosition => {
  const upperBand = overRect.top + overRect.height * 0.35;
  const lowerBand = overRect.bottom - overRect.height * 0.35;

  if (pointerY <= upperBand) return "before";
  if (pointerY >= lowerBand) return "after";
  return "on";
};
```

### Zone Breakdown

| Zone | Range | Calculation | Purpose |
|------|-------|-------------|---------|
| Before | 0-35% | `top + height * 0.35` | Peer reordering (insert above) |
| On | 35-65% | Between upper and lower band | Nesting (make child) |
| After | 65-100% | `bottom - height * 0.35` | Peer reordering (insert below) |

## Horizontal Offset Intelligence (40px Threshold)

### Indent Detection (Drag Right)
- **Trigger**: `horizontalOffset > 40px`
- **Effect**: Forces `position: "on"` regardless of vertical zone
- **Use Case**: User wants to nest item without precise vertical targeting

### Outdent Detection (Drag Left)
- **Trigger**: `horizontalOffset < -40px`
- **Effect**: Targets grandparent level with `position: "after"`
- **Use Case**: User wants to move item up in hierarchy

### Implementation

```typescript
const INDENT_THRESHOLD = 40; // pixels

if (horizontalOffset > INDENT_THRESHOLD) {
  // Force nesting mode
  position = "on";
} else if (horizontalOffset < -INDENT_THRESHOLD && overNode?.parent_id) {
  // Outdent: target the parent's sibling position
  targetId = overNode.parent_id;
  position = "after";
}
```

## Visual Feedback System

| Drop Mode | Visual Indicator | CSS Class |
|-----------|------------------|-----------|
| Before | Blue line at top | `h-1 bg-blue-500` at top |
| After | Blue line at bottom | `h-1 bg-blue-500` at bottom |
| On (Nest) | Blue highlight + ring | `bg-blue-100/80 ring-2 ring-blue-400/50` |
| Outdent | Indigo highlight on parent | `bg-indigo-50/60 ring-1 ring-indigo-300/40` |
| Invalid | Red highlight | `border-red-400 bg-red-50/70` |

## Root Drop Zone

- **Location**: Far left edge of sidebar (< 16px from nav left edge)
- **Sentinel ID**: `__ROOT_DROP_ZONE__`
- **Effect**: Moves item to root level (`parent_id: null`)

## Auto-Expand Timer

- **Duration**: 500ms hover over collapsed node
- **Effect**: Expands node to reveal children as potential drop targets

## Backend Integration

All moves call `reorderNote()` API which triggers `_normalize_positions()`:
- Maintains 0-indexed sequential positions
- Prevents gaps in sibling ordering
- Handles both source and destination parent groups

## Circular Reference Prevention

The backend uses recursive CTE with depth limit (100) to prevent:
- Self-parenting (`parent_id === id`)
- Ancestor-descendant cycles
- Infinite recursion

## Usage in page-tree.tsx

Key locations:
- `getDropPosition()`: Line ~372-384
- Horizontal offset detection: Line ~619-637
- Drop handling: Line ~674-771

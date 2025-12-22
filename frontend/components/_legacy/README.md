# Legacy Components

These components are no longer used in the application but are retained for reference.

## Contents

- `notes/note-form.tsx` - Original form-based note editor (replaced by `pages/page-editor.tsx`)
- `notes/note-card.tsx` - Card display for notes (unused after moving to page-based UI)
- `markdown/markdown-renderer.tsx` - Server-side markdown rendering (replaced by TipTap editor)
- `markdown/markdown-components.tsx` - Custom markdown components (unused)
- `page-list.tsx` - Flat page list (replaced by `layout/page-tree.tsx` with hierarchy)

## Why Kept

These files serve as reference for:
- Original patterns before refactoring
- Potential restoration if features need to be reverted
- Understanding historical design decisions

## Safe to Delete

These files can be safely deleted if storage is a concern. They have no runtime impact.

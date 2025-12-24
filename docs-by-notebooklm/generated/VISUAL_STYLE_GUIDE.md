# Visual Style Guide

**Version:** 1.0.0
**Source:** Derived from CONSTITUTION.md, VERIFICATION_REPORT.md, SYSTEM_AUDIT_2025-12-24.md

---

## Grid System

| Property | Value | Usage |
|----------|-------|-------|
| Base unit | 8px | All spacing multiples |
| Column width | 280px | Sidebar, content cards |
| Gutter | 16px | Between grid elements |
| Max content width | 960px | Main content area |
| Margin (mobile) | 16px | Screen edges |
| Margin (desktop) | 24px | Screen edges |

### Layout Zones

```
┌─────────────────────────────────────────────────┐
│  Header (64px)                                  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Main Content                        │
│ (280px)  │  (flex: 1)                           │
│          │                                      │
│          │  ┌────────────────────────────────┐  │
│          │  │ Editor Area (max-width: 960px) │  │
│          │  └────────────────────────────────┘  │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

---

## Typography Hierarchy

| Level | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| H1 | Inter | 32px | 700 | 1.2 | Page titles |
| H2 | Inter | 24px | 600 | 1.3 | Section headers |
| H3 | Inter | 18px | 600 | 1.4 | Subsections |
| Body | Inter | 16px | 400 | 1.6 | Paragraph text |
| Small | Inter | 14px | 400 | 1.5 | Captions, meta |
| Code | JetBrains Mono | 14px | 400 | 1.5 | Code blocks |
| Label | Inter | 12px | 500 | 1.4 | UI labels, badges |

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

---

## Spacing Rules

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps, icon padding |
| `--space-sm` | 8px | Inline spacing, small gaps |
| `--space-md` | 16px | Standard component padding |
| `--space-lg` | 24px | Section spacing |
| `--space-xl` | 32px | Major section breaks |
| `--space-2xl` | 48px | Page-level divisions |

### Spacing Application

- **Component padding:** `--space-md` (16px)
- **Card padding:** `--space-lg` (24px)
- **Between siblings:** `--space-sm` (8px)
- **Between sections:** `--space-xl` (32px)

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Blue 500 | `#3B82F6` | 59, 130, 246 | Primary actions, links |
| Blue 600 | `#2563EB` | 37, 99, 235 | Hover states |
| Blue 100 | `#DBEAFE` | 219, 234, 254 | Light backgrounds |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | Passed tests, valid states |
| Warning | `#F59E0B` | Caution, pending |
| Error | `#EF4444` | Failed, invalid, blocked |
| Info | `#6366F1` | Informational highlights |

### Neutral Palette

| Name | Hex | Usage |
|------|-----|-------|
| Gray 900 | `#111827` | Primary text (dark mode bg) |
| Gray 700 | `#374151` | Secondary text |
| Gray 500 | `#6B7280` | Muted text, borders |
| Gray 300 | `#D1D5DB` | Dividers, light borders |
| Gray 100 | `#F3F4F6` | Backgrounds, hover |
| White | `#FFFFFF` | Cards, primary bg |

### DnD Zone Colors (Source: CONSTITUTION.md Section 2.1)

| Zone | Color | Hex | Description |
|------|-------|-----|-------------|
| Before (35%) | Blue | `#3B82F6` | Top insertion indicator |
| On (30%) | Gold | `#F59E0B` | Nesting highlight |
| After (35%) | Blue | `#3B82F6` | Bottom insertion indicator |
| Invalid | Red | `#EF4444` | Blocked drop target |
| Outdent | Indigo | `#6366F1` | Parent-level target |

---

## Iconography Style

### Icon System

- **Library:** Lucide React
- **Default size:** 16px (inline), 20px (buttons), 24px (headers)
- **Stroke width:** 2px
- **Corner radius:** Rounded caps

### Common Icons

| Action | Icon | Size |
|--------|------|------|
| Expand/Collapse | `ChevronRight` / `ChevronDown` | 16px |
| Drag handle | `GripVertical` | 12px |
| More options | `MoreHorizontal` | 16px |
| Add | `Plus` | 16px |
| Delete | `Trash2` | 16px |
| Edit | `Pencil` | 16px |
| Settings | `Settings` | 20px |

### Icon Guidelines

```
DO: Use consistent stroke width (2px)
DO: Maintain optical alignment with text
DO: Use semantic colors for state icons

DON'T: Mix filled and outlined styles
DON'T: Use icons smaller than 12px
DON'T: Add decorative icons without purpose
```

---

## Callout Cards

### Variants

#### Info Callout
```
┌─────────────────────────────────────┐
│ ℹ️  INFO                            │
│ ─────────────────────────────────── │
│ Informational content goes here.   │
│ Background: Blue 100 (#DBEAFE)     │
│ Border-left: Blue 500 (4px)        │
└─────────────────────────────────────┘
```

#### Warning Callout
```
┌─────────────────────────────────────┐
│ ⚠️  WARNING                         │
│ ─────────────────────────────────── │
│ Caution content goes here.         │
│ Background: Amber 100 (#FEF3C7)    │
│ Border-left: Amber 500 (4px)       │
└─────────────────────────────────────┘
```

#### Error Callout
```
┌─────────────────────────────────────┐
│ ❌  ERROR                           │
│ ─────────────────────────────────── │
│ Error content goes here.           │
│ Background: Red 100 (#FEE2E2)      │
│ Border-left: Red 500 (4px)         │
└─────────────────────────────────────┘
```

#### Success Callout
```
┌─────────────────────────────────────┐
│ ✅  SUCCESS                         │
│ ─────────────────────────────────── │
│ Success content goes here.         │
│ Background: Green 100 (#D1FAE5)    │
│ Border-left: Green 500 (4px)       │
└─────────────────────────────────────┘
```

### Card Styles

| Style | Padding | Border Radius | Shadow |
|-------|---------|---------------|--------|
| Flat | 16px | 8px | None |
| Elevated | 16px | 8px | `0 1px 3px rgba(0,0,0,0.1)` |
| Outlined | 16px | 8px | None, 1px border |

---

## Do / Don't Examples

### Position Values

```
✅ DO: Use 0-indexed positions [0, 1, 2, ...]
   Source: CONSTITUTION.md Section 1.1.2

❌ DON'T: Use 1-indexed positions [1, 2, 3, ...]
   This violates the zero-indexed invariant.
```

### Drop Zone Percentages

```
✅ DO: Use 35/30/35 vertical zones
   - Top 35%: "before" (sibling above)
   - Middle 30%: "on" (nest as child)
   - Bottom 35%: "after" (sibling below)
   Source: CONSTITUTION.md Section 2.1.1

❌ DON'T: Use 25/50/25 or other ratios
   This was the old incorrect implementation.
```

### Horizontal Offset Thresholds

```
✅ DO: Use ±40px for indent/outdent detection
   - >+40px: Force "on" position (indent)
   - <-40px: Move to parent level (outdent)
   Source: CONSTITUTION.md Section 2.1.2

❌ DON'T: Use different threshold values
   40px is calibrated for optimal UX.
```

### Normalization Calls

```
✅ DO: Call _normalize_positions() after every mutation
   - create() → normalize new parent
   - update() → normalize old + new parent
   - reorder() → normalize old + new parent
   - delete() → normalize former parent
   Source: CONSTITUTION.md Section 1.1.4

❌ DON'T: Skip normalization on any operation
   This creates position gaps and inconsistent ordering.
```

### Backend URL Handling

```
✅ DO: Transform relative upload URLs to absolute
   /uploads/image.png → http://localhost:8000/uploads/image.png
   Source: VERIFICATION_REPORT.md Section "Upload Flow Fix"

❌ DON'T: Use relative URLs for uploaded images
   Browser requests from frontend origin (3000), not backend (8000).
```

### Circular Reference Prevention

```
✅ DO: Check _is_descendant() before parent changes
   Source: CONSTITUTION.md Section 1.2.2

❌ DON'T: Allow a note to be moved under its own descendant
   This creates infinite loops in tree traversal.
```

---

## Diagram Style Guidelines

### Mermaid Diagrams

- **Theme:** Default or neutral
- **Node shapes:** Rounded rectangles for components, diamonds for decisions
- **Colors:** Use semantic colors from palette
- **Font:** Sans-serif, match body typography
- **Direction:** Top-to-bottom (TB) for flows, left-to-right (LR) for architectures

### Infographic Style (Tier 2)

- **Background:** White or light gray (#F9FAFB)
- **Sections:** Distinct colored bands with subtle gradients
- **Icons:** Flat, monochrome or duotone
- **Typography:** Bold headers, regular body
- **Layout:** Grid-aligned, consistent gutters
- **Accents:** Colored left borders, subtle shadows

---

*Style guide derived from system documentation and verified against CONSTITUTION.md invariants.*

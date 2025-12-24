# Visual Style Guide v2.0

**Infographic-First Design System for Notes Dashboard**

---

## Design Tokens

### Typography Scale

| Token | Size | Weight | Use Case |
|-------|------|--------|----------|
| `--type-hero` | 48px | 800 | Slide titles |
| `--type-h1` | 32px | 700 | Section headers |
| `--type-h2` | 24px | 600 | Card titles |
| `--type-h3` | 18px | 600 | Subheaders |
| `--type-body` | 16px | 400 | Body text |
| `--type-label` | 12px | 600 | Tags, badges |
| `--type-code` | 14px | 400 | Monospace |

**Font Stack:** `Inter, -apple-system, sans-serif`
**Code Font:** `JetBrains Mono, monospace`

### Spacing Scale (8px Base)

| Token | Value | Use |
|-------|-------|-----|
| `--sp-1` | 4px | Icon gaps |
| `--sp-2` | 8px | Tight padding |
| `--sp-3` | 12px | Badge padding |
| `--sp-4` | 16px | Card padding |
| `--sp-6` | 24px | Section gaps |
| `--sp-8` | 32px | Major divisions |
| `--sp-12` | 48px | Slide margins |

### Corner Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 4px | Badges, tags |
| `--radius-md` | 8px | Cards, buttons |
| `--radius-lg` | 12px | Containers |
| `--radius-xl` | 16px | Hero sections |

### Stroke Weights

| Token | Value | Use |
|-------|-------|-----|
| `--stroke-thin` | 1px | Subtle borders |
| `--stroke-default` | 2px | Standard borders, icons |
| `--stroke-thick` | 3px | Emphasis borders |
| `--stroke-heavy` | 4px | Section dividers |

---

## Color Palette

### Primary

| Name | Hex | RGB |
|------|-----|-----|
| Blue-500 | `#3B82F6` | 59, 130, 246 |
| Blue-600 | `#2563EB` | 37, 99, 235 |
| Blue-100 | `#DBEAFE` | 219, 234, 254 |

### Semantic

| State | Hex | Use |
|-------|-----|-----|
| Success | `#10B981` | Passing, valid |
| Warning | `#F59E0B` | Caution |
| Error | `#EF4444` | Failed, blocked |
| Info | `#6366F1` | Highlights |

### Neutrals

| Name | Hex | Use |
|------|-----|-----|
| Gray-900 | `#111827` | Primary text |
| Gray-600 | `#4B5563` | Secondary text |
| Gray-400 | `#9CA3AF` | Muted |
| Gray-200 | `#E5E7EB` | Borders |
| Gray-50 | `#F9FAFB` | Backgrounds |

---

## Infographic Patterns

### 1. Feature Card

```
┌──────────────────────────┐
│  [ICON]  Title           │  ← 24px padding
│  ─────────────────────── │  ← 2px gray border
│  • Bullet point one      │
│  • Bullet point two      │
│  • Bullet point three    │
└──────────────────────────┘
   ↑ radius-md (8px)
   ↑ shadow: 0 1px 3px rgba(0,0,0,0.08)
```

**Specs:**
- Padding: `--sp-6` (24px)
- Border: `--stroke-default` Gray-200
- Title: `--type-h2` (24px/600)
- Body: `--type-body` (16px/400)
- Icon: 24px, stroke-width 2px

### 2. Stack Block

```
┌─────────────────────────────────┐
│  LAYER LABEL                    │ ← type-label, uppercase
├─────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ Box │ │ Box │ │ Box │       │ ← inline tech badges
│  └─────┘ └─────┘ └─────┘       │
└─────────────────────────────────┘
```

**Specs:**
- Layer label: `--type-label`, letter-spacing 0.5px
- Box badges: 4px vertical padding, radius-sm
- Gap between boxes: `--sp-2`

### 3. Governance Callout

```
┌─────────────────────────────────┐
│  ⚠ INVARIANT                    │ ← Warning color bg
│  ─────────────────────────────  │
│  Positions must be zero-indexed │
│  [0, 1, 2, ...] not [1, 2, 3]   │
│                                 │
│  Source: CONSTITUTION.md §1.1.2 │ ← type-label, muted
└─────────────────────────────────┘
   ↑ 4px left border (warning color)
```

**Specs:**
- Border-left: `--stroke-heavy` (4px)
- Background: Warning-100 (`#FEF3C7`)
- Title: `--type-h3`, icon + text
- Citation: `--type-label`, Gray-500

### 4. Forbidden Zone Banner

```
┌─────────────────────────────────────────────┐
│  🚫  FORBIDDEN                              │ ← Error bg
│  ─────────────────────────────────────────  │
│  Never use /notes routes for page creation  │
│  Always use /api/notes instead              │
└─────────────────────────────────────────────┘
   ↑ 4px top border (error color)
   ↑ radius: 0 (sharp edges for urgency)
```

**Specs:**
- Border-top: `--stroke-heavy` (4px), Error color
- Background: Error-50 (`#FEF2F2`)
- No border-radius (intentional sharp look)

---

## Diagram Conventions

### Mermaid Node Styles

```mermaid
classDef frontend fill:#DBEAFE,stroke:#3B82F6,stroke-width:2px
classDef backend fill:#D1FAE5,stroke:#10B981,stroke-width:2px
classDef database fill:#E9D5FF,stroke:#8B5CF6,stroke-width:2px
classDef warning fill:#FEF3C7,stroke:#F59E0B,stroke-width:2px
classDef error fill:#FEE2E2,stroke:#EF4444,stroke-width:2px
```

### Node Text Rules

| Context | Max Chars | Example |
|---------|-----------|---------|
| Node label | 20 | `NoteService` |
| Subgraph | 25 | `Position Management` |
| Edge label | 15 | `PATCH /notes/:id` |

### Direction Preferences

| Diagram Type | Direction | Rationale |
|--------------|-----------|-----------|
| Architecture | TB | Shows layers |
| Sequence | TB | Time flows down |
| Flow/Process | LR | Reading direction |
| State Machine | LR | Transition clarity |

---

## Icon Guidelines

**Library:** Lucide React (lucide.dev)

| Size | Use | Stroke |
|------|-----|--------|
| 16px | Inline text | 2px |
| 20px | Buttons | 2px |
| 24px | Headers | 2px |
| 32px | Hero icons | 1.5px |

**Rules:**
- Consistent 2px stroke (1.5px at 32px+)
- Round line caps
- No filled variants mixed with stroked
- Semantic colors only (no decorative colors)

---

## One-Pager Template

Three-column slide layout for executive summaries:

```
┌──────────────────────────────────────────────────────────────────┐
│                         TITLE (48px hero)                        │
│                       Subtitle (18px muted)                       │
├────────────────────┬────────────────────┬────────────────────────┤
│   FEATURES         │   STACK            │   GOVERNANCE           │
│   ──────────       │   ─────            │   ──────────           │
│   • Feature 1      │   [Frontend]       │   ⚠ Invariant 1        │
│   • Feature 2      │   Next.js          │   ⚠ Invariant 2        │
│   • Feature 3      │   TipTap           │                        │
│                    │   dnd-kit          │   🚫 Forbidden         │
│                    │                    │   No /notes routes     │
│                    │   [Backend]        │                        │
│                    │   FastAPI          │   ✓ Quality Gates      │
│                    │   SQLAlchemy       │   ruff, mypy, pytest   │
└────────────────────┴────────────────────┴────────────────────────┘
```

**Specs:**
- Column widths: 33% each
- Column gap: `--sp-6` (24px)
- Section padding: `--sp-4` (16px)
- Vertical dividers: `--stroke-thin` Gray-200

---

## Quality Checklist

Before finalizing any infographic:

- [ ] Typography uses only defined scale
- [ ] Colors are from semantic palette
- [ ] Spacing follows 8px grid
- [ ] Stroke weights are consistent
- [ ] Icons are 2px Lucide style
- [ ] Node text under 20 chars
- [ ] Source citations included
- [ ] No decorative elements

---

*Style guide v2.0 | Source: CONSTITUTION.md, VERIFICATION_REPORT.md*

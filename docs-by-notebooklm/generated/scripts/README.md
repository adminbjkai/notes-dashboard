# Mermaid Export Scripts

Local-only scripts for exporting Mermaid diagrams to high-resolution PNGs.

---

## Prerequisites

Install mermaid-cli:

```bash
npm install -g @mermaid-js/mermaid-cli
```

Or use npx (no install required):

```bash
npx @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.png
```

---

## Usage

### Export All Diagrams

```bash
cd docs-by-notebooklm/generated
./scripts/export-mermaid.sh
```

Output is saved to `rendered/` (gitignored).

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--theme` | neutral | Mermaid theme: neutral, dark, forest, default |
| `--scale` | 2 | Output scale factor (2 = 2x resolution) |
| `--bg` | white | Background color |

### Examples

```bash
# Default export (neutral theme, 2x scale, white bg)
./scripts/export-mermaid.sh

# Dark theme for presentations
./scripts/export-mermaid.sh --theme dark --bg "#1e1e1e"

# High-res export (4x scale)
./scripts/export-mermaid.sh --scale 4

# Forest theme
./scripts/export-mermaid.sh --theme forest
```

---

## Output

Rendered PNGs are saved to:

```
generated/
└── rendered/
    ├── architecture_overview.png
    ├── invariants_and_guards.png
    ├── one_pager.png
    └── upload_pipeline.png
```

The `rendered/` directory is gitignored.

---

## Theme Variables

For advanced customization, create a `mermaid-config.json`:

```json
{
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#DBEAFE",
    "primaryBorderColor": "#3B82F6",
    "secondaryColor": "#D1FAE5",
    "tertiaryColor": "#FEF3C7",
    "fontFamily": "Inter, sans-serif",
    "fontSize": "14px"
  }
}
```

Then use:

```bash
mmdc -i diagram.mmd -o diagram.png -c mermaid-config.json
```

---

## Troubleshooting

### mmdc not found

```bash
npm install -g @mermaid-js/mermaid-cli
```

### Puppeteer errors

If you see Chromium/Puppeteer errors:

```bash
npx puppeteer browsers install chrome
```

### Font issues

For consistent fonts, install Inter:

- macOS: `brew install font-inter`
- Or download from https://fonts.google.com/specimen/Inter

---

*Script version: 1.0.0*

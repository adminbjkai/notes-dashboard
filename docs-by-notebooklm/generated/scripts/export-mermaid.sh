#!/bin/bash
# Export Mermaid diagrams to PNG
# Usage: ./scripts/export-mermaid.sh [--theme neutral|dark|forest] [--scale 2]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATED_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$GENERATED_DIR/rendered"

# Defaults
THEME="neutral"
SCALE="2"
BACKGROUND="white"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --theme)
            THEME="$2"
            shift 2
            ;;
        --scale)
            SCALE="$2"
            shift 2
            ;;
        --bg)
            BACKGROUND="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check for mermaid-cli
if ! command -v mmdc &> /dev/null; then
    echo "Error: mermaid-cli (mmdc) not found"
    echo ""
    echo "Install with:"
    echo "  npm install -g @mermaid-js/mermaid-cli"
    echo ""
    echo "Or use npx:"
    echo "  npx @mermaid-js/mermaid-cli mmdc ..."
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Count files
MMD_COUNT=$(find "$GENERATED_DIR" -maxdepth 1 -name "*.mmd" | wc -l | tr -d ' ')

if [[ "$MMD_COUNT" -eq 0 ]]; then
    echo "No .mmd files found in $GENERATED_DIR"
    exit 0
fi

echo "Exporting $MMD_COUNT Mermaid diagrams..."
echo "  Theme: $THEME"
echo "  Scale: ${SCALE}x"
echo "  Background: $BACKGROUND"
echo ""

# Export each .mmd file
for mmd_file in "$GENERATED_DIR"/*.mmd; do
    filename=$(basename "$mmd_file" .mmd)
    output_file="$OUTPUT_DIR/${filename}.png"

    echo "  $filename.mmd -> $filename.png"

    mmdc \
        --input "$mmd_file" \
        --output "$output_file" \
        --theme "$THEME" \
        --scale "$SCALE" \
        --backgroundColor "$BACKGROUND" \
        --quiet
done

echo ""
echo "Done! Output saved to: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"

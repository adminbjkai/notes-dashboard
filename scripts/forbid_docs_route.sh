#!/bin/bash
# Guard script to prevent /docs route reintroduction
# This route is forbidden per CONSTITUTION_DRAFT.md Article IV Section 4.1
#
# Usage: ./scripts/forbid_docs_route.sh
# Exit codes: 0 = OK (no /docs route), 1 = FAIL (/docs route found)

set -e

# Frontend paths
DOCS_ROUTE_PATH="frontend/app/docs"
DOCS_COMPONENTS_PATH="frontend/components/docs"

# Backend paths
DOCS_ROUTER_PATH="backend/app/routers/docs.py"
DOCS_SERVICE_PATH="backend/app/services/docs_service.py"

check_forbidden_dir() {
    local path="$1"
    if [ -d "$path" ]; then
        echo "ERROR: Forbidden directory found: $path"
        echo "The /docs route is forbidden per system constitution."
        echo "See CONSTITUTION_DRAFT.md Article IV Section 4.1"
        return 1
    fi
    return 0
}

check_forbidden_file() {
    local path="$1"
    if [ -f "$path" ]; then
        echo "ERROR: Forbidden file found: $path"
        echo "The /docs route is forbidden per system constitution."
        echo "See CONSTITUTION_DRAFT.md Article IV Section 4.1"
        return 1
    fi
    return 0
}

echo "Checking for forbidden /docs routes..."

FAILED=0

# Check frontend directories
if ! check_forbidden_dir "$DOCS_ROUTE_PATH"; then
    FAILED=1
fi

if ! check_forbidden_dir "$DOCS_COMPONENTS_PATH"; then
    FAILED=1
fi

# Check backend files
if ! check_forbidden_file "$DOCS_ROUTER_PATH"; then
    FAILED=1
fi

if ! check_forbidden_file "$DOCS_SERVICE_PATH"; then
    FAILED=1
fi

if [ $FAILED -eq 1 ]; then
    echo ""
    echo "FAIL: Forbidden /docs route detected"
    exit 1
fi

echo "OK: No forbidden /docs routes found"
exit 0

#!/bin/bash

###
# Run All Validations Script
# Executes comprehensive Firebase asset validation
# Usage: ./scripts/run-all-validations.sh
###

set -e  # Exit on error

echo "======================================"
echo "  Firebase Asset Validation Suite"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if firebase-admin is installed
if ! npm list firebase-admin &> /dev/null; then
    echo -e "${YELLOW}⚠️  firebase-admin not installed${NC}"
    echo "   Installing dependencies..."
    npm install firebase-admin
fi

# Run validation
echo ""
echo "🔍 Running Firebase asset validation..."
echo ""

if node scripts/validate-firebase-assets.js; then
    echo ""
    echo -e "${GREEN}✅ All validations passed!${NC}"
    echo ""
    exit 0
else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}❌ Validation failed with ${EXIT_CODE} errors${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review FIREBASE_VALIDATION_REPORT.json for details"
    echo "  2. Run: node scripts/fix-failed-assets.js (automated fixes)"
    echo "  3. Or spin off agents to fix issues"
    echo ""
    exit $EXIT_CODE
fi

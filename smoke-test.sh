#!/bin/bash

###############################################################################
# smoke-test.sh - Quick smoke tests after deployment
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SITE_URL="${1:-https://your-site.web.app}"
TIMEOUT=10

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Smoke Tests - Eyes of Azrael${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${BLUE}Testing: ${SITE_URL}${NC}\n"

# Track failures
FAILURES=0

###############################################################################
# Helper Functions
###############################################################################

check_url() {
    local url=$1
    local name=$2

    echo -n "Testing $name... "

    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    elif command -v wget &> /dev/null; then
        HTTP_CODE=$(wget --spider -S --timeout=$TIMEOUT "$url" 2>&1 | grep "HTTP/" | awk '{print $2}' | tail -1 || echo "000")
    else
        echo -e "${YELLOW}SKIP (no curl/wget)${NC}"
        return
    fi

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ PASS (${HTTP_CODE})${NC}"
    else
        echo -e "${RED}✗ FAIL (${HTTP_CODE})${NC}"
        FAILURES=$((FAILURES + 1))
    fi
}

check_content() {
    local url=$1
    local search_text=$2
    local name=$3

    echo -n "Testing $name... "

    if command -v curl &> /dev/null; then
        CONTENT=$(curl -s --max-time $TIMEOUT "$url" 2>/dev/null || echo "")
    elif command -v wget &> /dev/null; then
        CONTENT=$(wget -q -O - --timeout=$TIMEOUT "$url" 2>/dev/null || echo "")
    else
        echo -e "${YELLOW}SKIP (no curl/wget)${NC}"
        return
    fi

    if echo "$CONTENT" | grep -q "$search_text"; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${RED}✗ FAIL (text not found)${NC}"
        FAILURES=$((FAILURES + 1))
    fi
}

###############################################################################
# Test 1: Homepage
###############################################################################

echo -e "${YELLOW}[1/10] Testing homepage...${NC}"
check_url "$SITE_URL" "Homepage"
check_content "$SITE_URL" "Eyes of Azrael" "Homepage title"
echo ""

###############################################################################
# Test 2: Core Pages
###############################################################################

echo -e "${YELLOW}[2/10] Testing core pages...${NC}"
check_url "$SITE_URL/about.html" "About page"
check_url "$SITE_URL/dashboard.html" "Dashboard"
check_url "$SITE_URL/compare.html" "Compare page"
echo ""

###############################################################################
# Test 3: Mythology Sections
###############################################################################

echo -e "${YELLOW}[3/10] Testing mythology sections...${NC}"
check_url "$SITE_URL/mythos/greek/index.html" "Greek mythology"
check_url "$SITE_URL/mythos/norse/index.html" "Norse mythology"
check_url "$SITE_URL/mythos/egyptian/index.html" "Egyptian mythology"
echo ""

###############################################################################
# Test 4: Deity Pages
###############################################################################

echo -e "${YELLOW}[4/10] Testing deity pages...${NC}"
check_url "$SITE_URL/mythos/greek/deities/zeus.html" "Zeus page"
check_url "$SITE_URL/mythos/norse/deities/odin.html" "Odin page"
check_url "$SITE_URL/mythos/egyptian/deities/ra.html" "Ra page"
echo ""

###############################################################################
# Test 5: Archetypes
###############################################################################

echo -e "${YELLOW}[5/10] Testing archetype pages...${NC}"
check_url "$SITE_URL/archetypes/index.html" "Archetypes index"
check_url "$SITE_URL/archetypes/sky-father/index.html" "Sky Father archetype"
echo ""

###############################################################################
# Test 6: Static Assets
###############################################################################

echo -e "${YELLOW}[6/10] Testing static assets...${NC}"
check_url "$SITE_URL/css/global.css" "Global CSS"
check_url "$SITE_URL/js/main.js" "Main JavaScript"
echo ""

###############################################################################
# Test 7: Search Functionality
###############################################################################

echo -e "${YELLOW}[7/10] Testing search...${NC}"
check_url "$SITE_URL/search-advanced.html" "Advanced search page"
echo ""

###############################################################################
# Test 8: HTTPS and Security Headers
###############################################################################

echo -e "${YELLOW}[8/10] Testing HTTPS and security...${NC}"

if [[ $SITE_URL == https://* ]]; then
    echo -e "HTTPS: ${GREEN}✓ ENABLED${NC}"
else
    echo -e "HTTPS: ${RED}✗ NOT ENABLED${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Check security headers
if command -v curl &> /dev/null; then
    HEADERS=$(curl -s -I --max-time $TIMEOUT "$SITE_URL" 2>/dev/null || echo "")

    echo -n "Content-Security-Policy: "
    if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
        echo -e "${GREEN}✓ PRESENT${NC}"
    else
        echo -e "${YELLOW}⚠ MISSING${NC}"
    fi

    echo -n "X-Frame-Options: "
    if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
        echo -e "${GREEN}✓ PRESENT${NC}"
    else
        echo -e "${YELLOW}⚠ MISSING${NC}"
    fi
fi

echo ""

###############################################################################
# Test 9: Firebase Assets
###############################################################################

echo -e "${YELLOW}[9/10] Testing Firebase integration...${NC}"

# Check if Firebase SDK loads
check_content "$SITE_URL" "firebase" "Firebase SDK"

echo ""

###############################################################################
# Test 10: Performance Check
###############################################################################

echo -e "${YELLOW}[10/10] Performance check...${NC}"

if command -v curl &> /dev/null; then
    START_TIME=$(date +%s%N)
    curl -s -o /dev/null --max-time $TIMEOUT "$SITE_URL" 2>/dev/null
    END_TIME=$(date +%s%N)

    LOAD_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

    echo -n "Page load time: ${LOAD_TIME}ms "

    if [ $LOAD_TIME -lt 3000 ]; then
        echo -e "${GREEN}✓ GOOD${NC}"
    elif [ $LOAD_TIME -lt 5000 ]; then
        echo -e "${YELLOW}⚠ ACCEPTABLE${NC}"
    else
        echo -e "${RED}✗ SLOW${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}Skipped (no curl available)${NC}"
fi

echo ""

###############################################################################
# Summary
###############################################################################

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Smoke Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All smoke tests passed!${NC}"
    echo -e "${GREEN}Site appears to be working correctly${NC}\n"
    exit 0
else
    echo -e "${RED}✗ $FAILURES test(s) failed${NC}"
    echo -e "${RED}Please investigate and fix issues${NC}\n"
    exit 1
fi

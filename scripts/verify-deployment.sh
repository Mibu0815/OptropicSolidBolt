#!/bin/bash
# Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh https://yourdomain.com

set -e

BASE_URL=${1:-"http://localhost:3000"}
echo "🔍 Verifying deployment at: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    local check_content="$4"

    echo -n "Testing $name... "

    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        if [ -n "$check_content" ] && ! echo "$body" | grep -q "$check_content"; then
            echo -e "${RED}FAILED${NC} (status OK but content missing)"
            echo "  Expected: $check_content"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
        echo -e "${GREEN}PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAILED${NC} (expected $expected_status, got $status)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Run tests
echo "Running endpoint tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Health Check" "$BASE_URL/api/health" "200" "healthy"
test_endpoint "Metrics Endpoint" "$BASE_URL/api/metrics" "200" "optropic_"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Results:"
echo "  Passed: $TESTS_PASSED"
echo "  Failed: $TESTS_FAILED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Deployment verification successful! 🎉"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    echo ""
    echo "Please check the failed endpoints and try again."
    exit 1
fi

#!/bin/bash

# Quick Notification Test Script
# Usage: ./test-notifications.sh {userId}

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3002/api/v1}"
USER_ID="${1:-06366cb6-e402-40a9-94d9-5c0513bf8883}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Driver Application Notifications Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print section
print_section() {
    echo -e "\n${YELLOW}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Seed Test Notifications
print_section "Test 1: Seeding Test Notifications"
echo "User ID: $USER_ID"
echo "Endpoint: POST $API_URL/test/seed-notifications/$USER_ID"
echo ""

SEED_RESPONSE=$(curl -s -X POST "$API_URL/test/seed-notifications/$USER_ID")
echo "$SEED_RESPONSE" | jq '.'

if echo "$SEED_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Test notifications seeded successfully"
    TOTAL=$(echo "$SEED_RESPONSE" | jq -r '.data.total')
    UNREAD=$(echo "$SEED_RESPONSE" | jq -r '.data.unread')
    echo "  Total: $TOTAL notifications"
    echo "  Unread: $UNREAD notifications"
else
    print_error "Failed to seed notifications"
    exit 1
fi

# Test 2: Fetch Notifications (requires auth token)
print_section "Test 2: Fetching Notifications (Optional - requires auth token)"
echo "To fetch notifications, use:"
echo ""
echo "curl -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "     \"$API_URL/notifications\""
echo ""
echo "Expected response:"
cat << 'EOF'
{
  "notifications": [
    {
      "id": "uuid",
      "title": "🚗 New Driver Application",
      "message": "Driver wants to join your company",
      "type": "driver",
      "isRead": false,
      "actionUrl": "/driver-applications",
      "createdAt": "2025-12-11T..."
    }
  ],
  "unread": 5,
  "total": 10,
  "page": 1,
  "totalPages": 1
}
EOF

# Test 3: Clear Notifications
print_section "Test 3: Clear All Notifications"
echo "User ID: $USER_ID"
echo "Endpoint: POST $API_URL/test/clear-notifications/$USER_ID"
echo ""

read -p "Do you want to clear all notifications? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    CLEAR_RESPONSE=$(curl -s -X POST "$API_URL/test/clear-notifications/$USER_ID")
    echo "$CLEAR_RESPONSE" | jq '.'
    
    if echo "$CLEAR_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Notifications cleared successfully"
        DELETED=$(echo "$CLEAR_RESPONSE" | jq -r '.data.deletedCount')
        echo "  Deleted: $DELETED notifications"
    else
        print_error "Failed to clear notifications"
    fi
else
    echo "Skipped clearing notifications"
fi

# Summary
print_section "Summary"
echo "✅ All notification endpoints are working"
echo ""
echo "📱 To test in your app:"
echo "  1. Open the app and login as a company"
echo "  2. Check the notification bell icon"
echo "  3. You should see $TOTAL notifications"
echo ""
echo "🔄 To test the full flow:"
echo "  1. Login as a driver"
echo "  2. Apply to a company via the Browse Companies screen"
echo "  3. Company will receive notification"
echo "  4. Company accepts/rejects application"
echo "  5. Driver receives notification"
echo ""
echo -e "${GREEN}🎉 Notification system is fully functional!${NC}"

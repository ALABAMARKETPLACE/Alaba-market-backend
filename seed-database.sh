#!/bin/bash

# ========================================
# Quick Seed Database Script
# ========================================
# This script automatically seeds your database with test data
# Usage: ./seed-database.sh

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}===  Database Seeding Script     ===${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}ERROR: psql is not installed${NC}"
    echo "Please install PostgreSQL client tools first"
    exit 1
fi

# Get database credentials from user or environment
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-alaba_marketplace}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo -e "${YELLOW}Database Connection Details:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Allow user to override
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Function to run SQL file
run_seed_file() {
    local file=$1
    local description=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}ERROR: File not found: $file${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Running: $description${NC}"
    echo "  File: $file"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"; then
        echo -e "${GREEN}✓ $description completed successfully${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ Error running $description${NC}"
        return 1
    fi
}

# Change to script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Select seeding option:${NC}"
echo "  1) Seed Everything (recommended) - Orders + Notifications"
echo "  2) Seed Orders Only"
echo "  3) Seed Notifications Only"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "${YELLOW}Seeding everything...${NC}"
        run_seed_file "seed-all.sql" "Complete Database Seeding"
        ;;
    2)
        echo -e "${YELLOW}Seeding orders...${NC}"
        run_seed_file "seed-orders.sql" "Order Seeding"
        ;;
    3)
        echo -e "${YELLOW}Seeding notifications...${NC}"
        run_seed_file "seed-notifications-extended.sql" "Notification Seeding"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✓ Database seeding complete!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Verify the data in your database"
echo "  2. Start your application"
echo "  3. Test all interactions with the seeded data"
echo ""
echo "For more information, see SEEDING_GUIDE.md"
echo ""

#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Set dummy AWS credentials for DynamoDB Local (it doesn't validate them)
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy

echo -e "${GREEN}=== Todo App Local Development ===${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    docker compose down 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."

    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}Error: Node.js >= 18 required (found v$NODE_VERSION)${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Docker"

    if ! docker info &> /dev/null; then
        echo -e "${RED}Error: Docker daemon is not running${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Docker daemon running"

    if ! command -v aws &> /dev/null; then
        echo -e "${RED}Error: AWS CLI is not installed${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} AWS CLI"

    echo ""
}

# Install dependencies if needed
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
        echo ""
    fi
}

# Start DynamoDB Local
start_database() {
    echo "Starting DynamoDB Local..."
    docker compose up -d dynamodb-local

    # Wait for DynamoDB to be ready
    echo "Waiting for DynamoDB to be ready..."
    for i in {1..30}; do
        if aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1 &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} DynamoDB is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}Error: DynamoDB failed to start${NC}"
            exit 1
        fi
        sleep 1
    done
    echo ""
}

# Setup database tables
setup_database() {
    echo "Setting up database tables..."

    # Check if table already exists
    if aws dynamodb describe-table --table-name todos --endpoint-url http://localhost:8000 --region us-east-1 &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Table 'todos' already exists"
    else
        aws dynamodb create-table \
            --endpoint-url http://localhost:8000 \
            --region us-east-1 \
            --table-name todos \
            --attribute-definitions \
                AttributeName=userId,AttributeType=S \
                AttributeName=id,AttributeType=S \
            --key-schema \
                AttributeName=userId,KeyType=HASH \
                AttributeName=id,KeyType=RANGE \
            --billing-mode PAY_PER_REQUEST \
            --no-cli-pager > /dev/null
        echo -e "  ${GREEN}✓${NC} Table 'todos' created"
    fi
    echo ""
}

# Start development servers
start_servers() {
    echo -e "${GREEN}Starting development servers...${NC}"
    echo "  Backend:  http://localhost:3001"
    echo "  Frontend: http://localhost:5173"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""

    npm run dev
}

# Main
check_prerequisites
install_dependencies
start_database
setup_database
start_servers

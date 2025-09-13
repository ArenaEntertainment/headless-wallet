#!/bin/bash

# Wallet Mock Demos Setup Script
# This script sets up all demo applications with dependencies and configurations

set -e

echo "🚀 Setting up Wallet Mock Demos..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "npm check passed: $(npm -v)"

# Install root dependencies
print_status "Installing root dependencies..."
npm install
print_success "Root dependencies installed"

# Install dependencies for each demo
DEMOS=("react" "vue" "vanilla" "playwright" "security")

for demo in "${DEMOS[@]}"; do
    if [ -d "$demo" ]; then
        print_status "Installing dependencies for $demo demo..."
        cd "$demo"

        # Install dependencies
        npm install

        # Special setup for Playwright
        if [ "$demo" = "playwright" ]; then
            print_status "Installing Playwright browsers..."
            npx playwright install
        fi

        cd ..
        print_success "$demo demo setup complete"
    else
        print_warning "$demo directory not found, skipping..."
    fi
done

# Create .env files if they don't exist
for demo in "${DEMOS[@]}"; do
    if [ -d "$demo" ] && [ ! -f "$demo/.env" ]; then
        print_status "Creating .env file for $demo demo..."
        cat > "$demo/.env" << EOF
# Development environment
NODE_ENV=development
VITE_NODE_ENV=development

# Demo configuration
DEMO_NAME=$demo
DEMO_VERSION=0.1.0

# Wallet configuration
WALLET_ENVIRONMENT=development
WALLET_DEBUG=true
EOF
        print_success ".env file created for $demo demo"
    fi
done

# Create a start script
print_status "Creating start scripts..."
cat > start-all-demos.sh << 'EOF'
#!/bin/bash

# Start all demos in parallel
echo "🚀 Starting all Wallet Mock demos..."

# Function to start a demo
start_demo() {
    local demo=$1
    local port=$2

    echo "Starting $demo demo on port $port..."
    cd "$demo"
    npm run dev &
    cd ..
}

# Start demos
start_demo "react" "3000"
start_demo "vue" "3001"
start_demo "vanilla" "3002"
start_demo "security" "3003"

echo "All demos started!"
echo "Visit the following URLs:"
echo "  React Demo:     http://localhost:3000"
echo "  Vue Demo:       http://localhost:3001"
echo "  Vanilla Demo:   http://localhost:3002"
echo "  Security Demo:  http://localhost:3003"
echo ""
echo "Press Ctrl+C to stop all demos"

# Wait for all background processes
wait
EOF

chmod +x start-all-demos.sh
print_success "Start script created: start-all-demos.sh"

# Create test script
cat > run-all-tests.sh << 'EOF'
#!/bin/bash

# Run tests for all demos
echo "🧪 Running tests for all demos..."

# Run Playwright tests
if [ -d "playwright" ]; then
    echo "Running Playwright E2E tests..."
    cd playwright
    npm run test
    cd ..
fi

# Run security tests
if [ -d "security" ]; then
    echo "Running security tests..."
    cd security
    npm run test
    cd ..
fi

echo "All tests completed!"
EOF

chmod +x run-all-tests.sh
print_success "Test script created: run-all-tests.sh"

# Final success message
print_success "🎉 All demos have been set up successfully!"
echo ""
echo "Next steps:"
echo "1. Run './start-all-demos.sh' to start all demos"
echo "2. Run './run-all-tests.sh' to run tests"
echo "3. Visit individual demo URLs to explore features"
echo ""
echo "Demo URLs:"
echo "  React Demo:     http://localhost:3000"
echo "  Vue Demo:       http://localhost:3001"
echo "  Vanilla Demo:   http://localhost:3002"
echo "  Security Demo:  http://localhost:3003"
echo ""
echo "Happy coding! 🚀"
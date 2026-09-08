#!/bin/bash
# Template MFE - Start All Microfrontends
# Usage: ./start.sh

echo "========================================"
echo "  Template MFE - Starting All Services"
echo "========================================"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "ERROR: pnpm is not installed. Install it with: npm install -g pnpm"
    exit 1
fi

# Install deps if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
    echo ""
fi

echo "Starting shell (port 5000) and child MFE (port 5006)..."
echo ""
echo "  Shell:  http://localhost:5000"
echo "  Child:  http://localhost:5006"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

pnpm dev

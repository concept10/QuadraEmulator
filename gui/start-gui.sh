#!/bin/bash
# SPDX-FileCopyrightText: 2025 concept10
# SPDX-License-Identifier: MIT
# GitHub: https://github.com/concept10/qemu-aux-emulation

# Start the QEMU A/UX GUI Management Interface

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GUI_DIR="$SCRIPT_DIR"

echo "Starting QEMU A/UX GUI Management Interface..."

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js 18+ to run the GUI interface."
    exit 1
fi

# Check if npm is installed
if ! command -v npm >/dev/null 2>&1; then
    echo "Error: npm is not installed."
    echo "Please install npm to manage dependencies."
    exit 1
fi

# Navigate to GUI directory
cd "$GUI_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting GUI server on port 5000..."
echo "Access the interface at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"

npm start
#!/bin/bash

# Build script for Render deployment
# This handles the Rollup native dependency issue

echo "Starting build process..."

# Remove problematic files
echo "Cleaning up..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with force flag
echo "Installing dependencies..."
npm install --force

# Rebuild native dependencies
echo "Rebuilding native dependencies..."
npm rebuild

# Run the build
echo "Building application..."
npm run build

echo "Build completed successfully!"
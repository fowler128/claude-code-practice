#!/bin/bash

# BizDeedz Filing Tracker - Setup Script
# Run this script to generate the Xcode project and open it

set -e

echo "=========================================="
echo "  BizDeedz Filing Tracker Setup"
echo "=========================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "ERROR: This script must be run on macOS to build iOS apps."
    echo ""
    echo "To develop on macOS:"
    echo "  1. Copy this BizDeedz folder to your Mac"
    echo "  2. Run ./setup.sh"
    exit 1
fi

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check for XcodeGen
if ! command -v xcodegen &> /dev/null; then
    echo "Installing XcodeGen..."
    brew install xcodegen
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "ERROR: Xcode is not installed."
    echo "Please install Xcode from the App Store first."
    exit 1
fi

echo ""
echo "Step 1: Generating Xcode project..."
echo ""

cd "$(dirname "$0")"
xcodegen generate

echo ""
echo "Step 2: Opening Xcode project..."
echo ""

open BizDeedz.xcodeproj

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. FIREBASE SETUP (Required):"
echo "   - Go to https://console.firebase.google.com"
echo "   - Create a new project named 'BizDeedz'"
echo "   - Add an iOS app with bundle ID: com.bizdeedz.filingtracker"
echo "   - Download GoogleService-Info.plist"
echo "   - Drag it into Xcode (into the Resources folder)"
echo ""
echo "2. SIGNING:"
echo "   - In Xcode, select the BizDeedz target"
echo "   - Go to Signing & Capabilities"
echo "   - Select your Team"
echo ""
echo "3. BUILD & RUN:"
echo "   - Select a simulator (iPhone 15 Pro recommended)"
echo "   - Press Cmd+R to build and run"
echo ""
echo "=========================================="
echo ""

#!/bin/bash
# =============================================================================
# BrandBay Desktop - Signed macOS Build Script
# =============================================================================
# This script builds a code-signed and notarized macOS app using a clean
# temporary keychain to avoid trust chain issues with the login keychain.
#
# Prerequisites:
#   - .env.local file with APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID,
#     CSC_LINK (path to .p12), CSC_KEY_PASSWORD, and GH_TOKEN
#
# Usage:
#   ./build-signed.sh              # Build signed DMG + ZIP
#   ./build-signed.sh --publish    # Build, sign, notarize, and publish to GitHub
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from .env.local
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local file not found. Copy .env.template to .env.local and fill in your credentials."
  exit 1
fi

# Source .env.local (handle lines with comments and empty lines)
set -a
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  # Remove surrounding quotes from value
  value="${value%\"}"
  value="${value#\"}"
  export "$key=$value"
done < <(grep -v '^\s*#' .env.local | grep -v '^\s*$')
set +a

# Validate required environment variables
REQUIRED_VARS=("APPLE_ID" "APPLE_APP_SPECIFIC_PASSWORD" "APPLE_TEAM_ID" "CSC_LINK" "CSC_KEY_PASSWORD" "GH_TOKEN")
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: $var is not set in .env.local"
    exit 1
  fi
done

# Validate P12 file exists
if [ ! -f "$CSC_LINK" ]; then
  echo "ERROR: Certificate file not found at $CSC_LINK"
  exit 1
fi

echo "============================================="
echo "BrandBay Desktop - Signed Build"
echo "============================================="

# --- Temporary Keychain Setup ---
# Using a clean temporary keychain avoids trust chain issues caused by
# custom trust overrides in the login/system keychains.
KEYCHAIN_NAME="brandbay-build.keychain"
KEYCHAIN_PATH="$HOME/Library/Keychains/$KEYCHAIN_NAME"
KEYCHAIN_PASSWORD="brandbay-build-$(date +%s)"

cleanup() {
  echo ""
  echo "--- Cleaning up temporary keychain ---"
  security delete-keychain "$KEYCHAIN_PATH" 2>/dev/null || true
  # Restore the default keychain list
  security list-keychains -s ~/Library/Keychains/login.keychain-db /Library/Keychains/System.keychain
  echo "Cleanup complete."
}
trap cleanup EXIT

echo ""
echo "--- Setting up temporary build keychain ---"

# Remove any leftover keychain from a previous failed build
security delete-keychain "$KEYCHAIN_PATH" 2>/dev/null || true

# Create a fresh temporary keychain
security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"

# Import the P12 certificate into the temporary keychain
security import "$CSC_LINK" \
  -k "$KEYCHAIN_PATH" \
  -P "$CSC_KEY_PASSWORD" \
  -T /usr/bin/codesign \
  -T /usr/bin/security

# Allow codesign to access the keychain without prompting
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"

# Disable keychain auto-lock
security set-keychain-settings "$KEYCHAIN_PATH"

# Unlock the keychain
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"

# Add the temporary keychain to the search list (BEFORE login keychain)
security list-keychains -s "$KEYCHAIN_PATH" ~/Library/Keychains/login.keychain-db /Library/Keychains/System.keychain

# Verify the certificate is available
echo ""
echo "--- Verifying code signing identity ---"
security find-identity -v -p codesigning "$KEYCHAIN_PATH"

# --- Build ---
echo ""
echo "--- Building BrandBay Desktop ---"

# Tell electron-builder to use our temporary keychain
export CSC_KEYCHAIN="$KEYCHAIN_PATH"

# Determine publish flag
PUBLISH_FLAG=""
if [ "${1:-}" = "--publish" ]; then
  PUBLISH_FLAG="-p always"
  echo "Publishing to GitHub Releases enabled."
fi

# Run electron-builder
npx electron-builder --mac $PUBLISH_FLAG

echo ""
echo "============================================="
echo "Build complete!"
echo "============================================="
echo ""
echo "Output files are in the dist/ directory."
ls -lh dist/*.dmg dist/*.zip 2>/dev/null || echo "(no DMG/ZIP files found)"

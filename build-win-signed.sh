#!/bin/bash
# =============================================================================
# BrandBay Desktop - Signed Windows Build Script
# =============================================================================
# This script builds a code-signed Windows installer using Azure Trusted Signing.
# It can be run from macOS (cross-compilation) or from Windows.
#
# Prerequisites:
#   - .env.local file with AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET,
#     and GH_TOKEN
#   - Azure Trusted Signing account set up and identity verified
#   - AZURE_ENDPOINT, AZURE_CODE_SIGNING_ACCOUNT, AZURE_CERT_PROFILE in .env.local
#
# Usage:
#   ./build-win-signed.sh              # Build signed Windows installer
#   ./build-win-signed.sh --publish    # Build, sign, and publish to GitHub
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

# Validate required environment variables for Windows signing
REQUIRED_VARS=("AZURE_TENANT_ID" "AZURE_CLIENT_ID" "AZURE_CLIENT_SECRET" "AZURE_ENDPOINT" "AZURE_CODE_SIGNING_ACCOUNT" "AZURE_CERT_PROFILE" "WIN_PUBLISHER_NAME" "GH_TOKEN")
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: $var is not set in .env.local"
    exit 1
  fi
done

echo "============================================="
echo "BrandBay Desktop - Signed Windows Build"
echo "============================================="
echo ""
echo "Azure Tenant ID:      ${AZURE_TENANT_ID:0:8}..."
echo "Azure Client ID:      ${AZURE_CLIENT_ID:0:8}..."
echo "Signing Account:      $AZURE_CODE_SIGNING_ACCOUNT"
echo "Certificate Profile:  $AZURE_CERT_PROFILE"
echo ""

# Determine publish flag
PUBLISH_FLAG=""
if [ "${1:-}" = "--publish" ]; then
  PUBLISH_FLAG="-p always"
  echo "Publishing to GitHub Releases enabled."
fi

echo "--- Building BrandBay Desktop for Windows ---"
echo ""

# Use the JS build script which merges Azure signing options
# with the existing package.json config via electron-builder's API
PUBLISH_ARG=""
if [ -n "$PUBLISH_FLAG" ]; then
  PUBLISH_ARG="--publish"
fi

node build-win.js $PUBLISH_ARG

echo ""
echo "============================================="
echo "Build complete!"
echo "============================================="
echo ""
echo "Output files are in the dist/ directory."
ls -lh dist/*Setup*.exe 2>/dev/null || echo "(no installer files found)"

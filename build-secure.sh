#!/bin/bash

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading credentials from .env.local"
  export $(grep -v '^#' .env.local | xargs)
else
  echo "No .env.local file found. Please create one based on .env.template"
  echo "Or provide credentials as environment variables"
fi

# Check if environment variables are set
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ] || [ -z "$APPLE_TEAM_ID" ] || [ -z "$APPLE_IDENTITY" ]; then
  echo "Please set the following environment variables:"
  echo "APPLE_ID - Your Apple ID email"
  echo "APPLE_APP_SPECIFIC_PASSWORD - App-specific password for your Apple ID"
  echo "APPLE_TEAM_ID - Your Apple Developer Team ID"
  echo "APPLE_IDENTITY - Your Apple Developer signing identity"
  
  # Prompt for values if not set
  if [ -z "$APPLE_ID" ]; then
    read -p "Enter your Apple ID email: " APPLE_ID
    export APPLE_ID
  fi
  
  if [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ]; then
    read -s -p "Enter your app-specific password: " APPLE_APP_SPECIFIC_PASSWORD
    echo
    export APPLE_APP_SPECIFIC_PASSWORD
  fi
  
  if [ -z "$APPLE_TEAM_ID" ]; then
    read -p "Enter your Apple Developer Team ID: " APPLE_TEAM_ID
    export APPLE_TEAM_ID
  fi
  
  if [ -z "$APPLE_IDENTITY" ]; then
    read -p "Enter your Apple Developer signing identity: " APPLE_IDENTITY
    export APPLE_IDENTITY
  fi
fi

# Check if we should publish to GitHub
PUBLISH_TO_GITHUB=false
if [ ! -z "$GH_TOKEN" ]; then
  PUBLISH_TO_GITHUB=true
  echo "GitHub token found, will publish to GitHub"
else
  echo "No GitHub token provided (GH_TOKEN), building locally only"
fi

# Build the app
if [ "$PUBLISH_TO_GITHUB" = true ]; then
  echo "Building and publishing to GitHub..."
  npm run dist -- -p always
else
  echo "Building locally only..."
  npm run dist
fi

echo "Build process completed!"

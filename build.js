const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Determine platform
const platform = process.argv[2] || process.platform;
const validPlatforms = ['mac', 'win', 'linux', 'all'];

if (!validPlatforms.includes(platform)) {
  console.error(`Invalid platform: ${platform}. Valid options are: ${validPlatforms.join(', ')}`);
  process.exit(1);
}

console.log(`Building for platform: ${platform}`);

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Build command
let buildCommand = 'electron-builder';

if (platform !== 'all') {
  buildCommand += ` --${platform}`;
}

// Execute build
try {
  console.log(`Executing: ${buildCommand}`);
  execSync(buildCommand, { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

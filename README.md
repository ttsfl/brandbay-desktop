# BrandBay Desktop

A desktop application wrapper for [BrandBay](https://app.brandbay.io/) built with Electron.

## Installation Instructions

### macOS

1. Download the latest version from [GitHub Releases](https://github.com/ttsfl/brandbay-desktop/releases)
2. Mount the DMG file by double-clicking it
3. Drag the BrandBay app to your Applications folder
4. **Important**: When first opening the app, you may see a security warning saying "BrandBay is damaged and can't be opened"

   **Method 1: Using Finder**
   - Instead of double-clicking, right-click (or Control+click) on the app in your Applications folder
   - Select "Open" from the context menu
   - Click "Open" in the security dialog that appears
   - This only needs to be done the first time you open the app

   **Method 2: Using Terminal**
   - Open Terminal (Applications > Utilities > Terminal)
   - Run the following command:
     ```
     xattr -cr /Applications/BrandBay.app
     ```
   - Try opening the app normally after running this command

### Windows

1. Download the latest version from [GitHub Releases](https://github.com/ttsfl/brandbay-desktop/releases)
2. Run the installer (BrandBay-Setup-x.x.x.exe)
3. Follow the on-screen instructions to complete installation

## Features

- Cross-platform desktop application (macOS, Windows)
- Auto-updates when new versions are available
- Native desktop experience for the BrandBay web application

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/brandbay-desktop.git
   cd brandbay-desktop
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application in development mode:
   ```
   npm start
   ```

## Building

### For all platforms:
```
npm run dist
```

### For specific platforms:
```
# macOS
npm run dist -- --mac

# Windows
npm run dist -- --win

# Linux
npm run dist -- --linux
```

## Auto-Update Configuration

This application uses `electron-updater` to provide automatic updates. The update configuration is set in `package.json` under the `build.publish` section and is configured to use GitHub releases.

### Publishing New Versions

1. Update the version number in `package.json`
2. Run the following command with your GitHub token:
   ```
   GH_TOKEN=your_token npm run dist -- -p always
   ```
3. This will build the app and publish the new version to GitHub releases

## Distribution

### macOS

Provide users with one of these files:
- `BrandBay-[version]-arm64.dmg`: Standard macOS installer (recommended)
- `BrandBay-[version]-arm64-mac.zip`: Alternative ZIP package

Since the app is unsigned, users will need to:
1. Right-click (or Control-click) on the app
2. Select "Open" from the context menu
3. Click "Open" in the security warning dialog

### Windows

Provide users with:
- `BrandBay-Setup-[version].exe`: Windows installer

Users might see a SmartScreen warning and will need to click "More info" and then "Run anyway".

To configure auto-updates for your own deployment:

1. Create a GitHub repository for the application
2. Update the `repository.url`, `build.publish.owner`, and `build.publish.repo` fields in `package.json`
3. Generate a GitHub access token with appropriate permissions
4. Set the `GH_TOKEN` environment variable when building the application

## License

MIT

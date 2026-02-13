# BrandBay Desktop

A desktop application wrapper for [BrandBay](https://app.brandbay.io/) built with Electron.

## Features

- **Browser wrapper** for app.brandbay.io — dedicated desktop window, no extra browser tabs
- **Auto-updates** via GitHub Releases using `electron-updater`
- **Code signed & notarized** for macOS (Developer ID: Overturn LLC)
- **Tray icon** with quick access menu and manual update check
- **Offline support** with automatic retry
- **Context menu** with copy/paste, navigation, and reload

## Installation

### macOS

1. Download the latest `.dmg` from [GitHub Releases](https://github.com/TTSFL/brandbay-desktop/releases)
2. Open the DMG and drag BrandBay to Applications
3. Launch normally — the app is signed and notarized, no security warnings

### Windows

1. Download `BrandBay-Setup-x.x.x.exe` from [GitHub Releases](https://github.com/TTSFL/brandbay-desktop/releases)
2. Run the installer and follow the prompts

## Development

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- For macOS signing: Apple Developer ID certificate (`.p12` file)

### Setup

```bash
git clone https://github.com/TTSFL/brandbay-desktop.git
cd brandbay-desktop
npm install
```

### Run in development mode

```bash
npm start
```

### Environment Configuration

Copy `.env.template` to `.env.local` and fill in your credentials:

```bash
cp .env.template .env.local
```

Required variables for macOS signed builds:
- `APPLE_ID` — Your Apple ID email
- `APPLE_APP_SPECIFIC_PASSWORD` — App-specific password from appleid.apple.com
- `APPLE_TEAM_ID` — Your Apple Developer Team ID
- `CSC_LINK` — Absolute path to your `.p12` certificate file
- `CSC_KEY_PASSWORD` — Password for the `.p12` file
- `GH_TOKEN` — GitHub personal access token (for publishing releases)

## Building

### macOS (signed + notarized)

```bash
npm run build:mac
```

This uses `build-signed.sh` which:
1. Creates a clean temporary keychain
2. Imports your `.p12` certificate
3. Builds with `electron-builder`
4. Notarizes via Apple's notary service (via `afterSign` hook)
5. Cleans up the temporary keychain

### macOS (signed + notarized + publish to GitHub)

```bash
npm run build:mac:publish
```

### Windows

```bash
npm run build:win
```

### Publishing a New Version

1. Bump the version in `package.json`
2. Run `npm run build:mac:publish`
3. The signed, notarized build is automatically uploaded to GitHub Releases
4. Existing users receive the update automatically on next launch

## Tech Stack

- **Electron** 38.x (supported LTS)
- **electron-builder** 26.x (packaging + signing)
- **electron-updater** 6.x (auto-updates via GitHub Releases)
- **@electron/notarize** 3.x (Apple notarization)
- **electron-log** 5.x (structured logging)

## License

MIT

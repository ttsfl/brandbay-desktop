# BrandBay Desktop

A desktop application wrapper for [BrandBay](https://app.brandbay.io/) built with Electron.

## Features

- **Browser wrapper** for app.brandbay.io — dedicated desktop window, no extra browser tabs
- **Auto-updates** via GitHub Releases using `electron-updater`
- **Code signed & notarized** for macOS
- **Code signed** for Windows via Azure Trusted Signing (no SmartScreen warnings)
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
- For Windows signing: Azure Trusted Signing account (see setup below)

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

Required variables for Windows signed builds:
- `AZURE_TENANT_ID` — Azure Directory (tenant) ID
- `AZURE_CLIENT_ID` — Azure App Registration client ID
- `AZURE_CLIENT_SECRET` — Azure App Registration client secret
- `AZURE_ENDPOINT` — Trusted Signing endpoint URL (e.g. `https://eus.codesigning.azure.net`)
- `AZURE_CODE_SIGNING_ACCOUNT` — Your Trusted Signing account name
- `AZURE_CERT_PROFILE` — Your certificate profile name

Required for publishing:
- `GH_TOKEN` — GitHub personal access token

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

### Windows (signed via Azure Trusted Signing)

```bash
npm run build:win
```

This uses `build-win-signed.sh` which loads Azure credentials from `.env.local` and signs via Azure Trusted Signing. Can be run from macOS (cross-compilation).

### Windows (signed + publish to GitHub)

```bash
npm run build:win:publish
```

### Publishing a New Version

1. Bump the version in `package.json`
2. Build and publish for each platform:
   ```bash
   npm run build:mac:publish
   npm run build:win:publish
   ```
3. Publish the draft release on GitHub
4. Existing users receive the update automatically on next launch

## Tech Stack

- **Electron** 38.x (supported LTS)
- **electron-builder** 26.x (packaging + signing)
- **electron-updater** 6.x (auto-updates via GitHub Releases)
- **@electron/notarize** 3.x (Apple notarization)
- **electron-log** 5.x (structured logging)

## License

MIT

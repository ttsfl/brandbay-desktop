const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Creates a tray icon with context menu
 * @param {BrowserWindow} mainWindow - The main application window
 * @returns {Tray} - The created tray instance
 */
function createTray(mainWindow) {
  // Get the appropriate tray icon and resize it if needed
  let trayIconPath;
  let trayIconImage;
  
  try {
    // First try to use the dedicated tray icon
    trayIconPath = path.join(__dirname, 'assets/BrandBayTrayIcon.png');
    
    // If the tray icon doesn't exist, fall back to platform-specific icons
    if (!fs.existsSync(trayIconPath)) {
      if (process.platform === 'darwin') {
        trayIconPath = path.join(__dirname, 'assets/BrandBayMacOSAppIcon1024.png');
      } else if (process.platform === 'win32') {
        trayIconPath = path.join(__dirname, 'assets/BrandBayWindowsIcon256.ico');
      } else {
        trayIconPath = path.join(__dirname, 'assets/icon.png');
      }
    }
    
    // Create a native image from the icon path
    trayIconImage = nativeImage.createFromPath(trayIconPath);
    
    // Resize the icon for the tray
    // macOS menu bar icons should be 16x16 or 18x18 pixels
    if (process.platform === 'darwin') {
      trayIconImage = trayIconImage.resize({ width: 16, height: 16 });
    } else if (process.platform === 'win32') {
      // Windows tray icons should be 16x16 pixels
      trayIconImage = trayIconImage.resize({ width: 16, height: 16 });
    }
  } catch (error) {
    console.error('Error setting tray icon:', error);
    // Fallback to null, Electron will use a default icon
    trayIconImage = null;
  }
  
  const tray = new Tray(trayIconImage);
  tray.setToolTip('BrandBay');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open BrandBay',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Check for Updates',
      click: () => {
        const { autoUpdater } = require('electron-updater');
        autoUpdater.checkForUpdatesAndNotify();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Double-click on tray icon shows the app
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  return tray;
}

module.exports = { createTray };

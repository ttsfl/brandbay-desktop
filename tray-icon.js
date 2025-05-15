const { Tray, Menu, app } = require('electron');
const path = require('path');

/**
 * Creates a tray icon with context menu
 * @param {BrowserWindow} mainWindow - The main application window
 * @returns {Tray} - The created tray instance
 */
function createTray(mainWindow) {
  // Set platform-specific tray icon
  let trayIcon;
  try {
    // Select the appropriate icon based on platform
    if (process.platform === 'darwin') {
      trayIcon = path.join(__dirname, 'assets/BrandBayMacOSAppIcon1024.png');
    } else if (process.platform === 'win32') {
      trayIcon = path.join(__dirname, 'assets/BrandBayWindowsIcon256.ico');
    } else {
      trayIcon = path.join(__dirname, 'assets/icon.png');
    }
  } catch (error) {
    console.error('Error setting tray icon:', error);
    // Fallback to null, Electron will use a default icon
    trayIcon = null;
  }
  
  const tray = new Tray(trayIcon);
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

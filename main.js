const { app, BrowserWindow, shell, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { createTray } = require('./tray-icon');
const { createContextMenu } = require('./context-menu');

// Configure logging
log.transports.file.level = 'info';
log.info('App starting...');

/**
 * Loads the BrandBay web app with offline support
 * @param {BrowserWindow} window - The window to load the app into
 */
function loadBrandBayApp(window) {
  // Check if we have internet connection
  require('dns').lookup('app.brandbay.io', (err) => {
    if (err && err.code === 'ENOTFOUND') {
      log.info('No internet connection, loading offline page');
      window.loadFile('offline.html');
    } else {
      log.info('Loading BrandBay web app');
      window.loadURL('https://app.brandbay.io/').catch(error => {
        log.error('Failed to load BrandBay web app:', error);
        window.loadFile('offline.html');
      });
    }
  });
}

// Keep a global reference of the window objects to prevent garbage collection
let mainWindow;
let splashWindow;
let tray;

function createSplashWindow() {
  // Create the splash window
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: false,
    frame: false,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Load the splash screen HTML
  splashWindow.loadFile('splash.html');

  // Emitted when the window is closed
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createWindow() {
  // Set platform-specific icon
  let iconPath;
  if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, 'assets/BrandBayMacOSAppIcon1024.png');
  } else if (process.platform === 'win32') {
    iconPath = path.join(__dirname, 'assets/BrandBayWindowsIcon256.ico');
  } else {
    iconPath = path.join(__dirname, 'assets/icon.png');
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'BrandBay',
    show: false, // Hide until ready to show
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: iconPath
  });

  // Load the BrandBay web app
  loadBrandBayApp(mainWindow);

  // Show window when ready to show
  mainWindow.once('ready-to-show', () => {
    // Close splash and show main window
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
  });
  
  // Add context menu to the window
  createContextMenu(mainWindow);

  // Open external links in the default browser instead of a new Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createSplashWindow();
  
  // Create main window after a short delay to show splash screen
  setTimeout(() => {
    createWindow();
    
    // Create tray icon
    tray = createTray(mainWindow);
    
    // Check for updates
    autoUpdater.checkForUpdatesAndNotify();
  }, 1500);
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Auto updater events
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available.', info);
  // Notify user about available update
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      const notification = new Notification('Update Available', {
        body: 'A new version of BrandBay is available and will be downloaded in the background.'
      });
    `).catch(err => log.error('Error showing update notification', err));
  }
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.', info);
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater. ', err);
  // Notify user about update error
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      const notification = new Notification('Update Error', {
        body: 'There was an error while checking for updates. Please try again later.'
      });
    `).catch(err => log.error('Error showing error notification', err));
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Download speed: ${progressObj.bytesPerSecond}`;
  log_message = `${log_message} - Downloaded ${progressObj.percent}%`;
  log_message = `${log_message} (${progressObj.transferred}/${progressObj.total})`;
  log.info(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded', info);
  
  // Notify user that update is ready
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      const notification = new Notification('Update Ready', {
        body: 'A new version of BrandBay has been downloaded. It will be installed when you restart the application.'
      });
    `).catch(err => log.error('Error showing update-ready notification', err));
  }
  
  // Install the update on app quit
  autoUpdater.quitAndInstall();
});

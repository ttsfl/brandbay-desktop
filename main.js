const { app, BrowserWindow, shell, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { createTray } = require('./tray-icon');
const { createContextMenu } = require('./context-menu');

// Configure logging
log.transports.file.level = 'debug'; // Set to debug for more detailed logs
log.info('App starting...');

// Log important app paths
log.info('App paths:');
log.info(`  App path: ${app.getAppPath()}`);
log.info(`  User data path: ${app.getPath('userData')}`);
log.info(`  Executable path: ${app.getPath('exe')}`);
log.info(`  Is packaged: ${app.isPackaged}`);


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
    
    // Check for updates silently (isManualUpdateCheck is already false by default)
    log.info('Performing automatic update check at startup');
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

// Track whether update check was triggered manually by user
// Make it accessible via global so other modules can set it
global.isManualUpdateCheck = false;
let isManualUpdateCheck = false;

// Set up a watch on the global variable
Object.defineProperty(global, 'isManualUpdateCheck', {
  get: () => isManualUpdateCheck,
  set: (value) => {
    isManualUpdateCheck = value;
    log.info(`Manual update check flag set to: ${value}`);
  }
});

// Auto updater events
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
  // Log the current version and update URL
  log.info(`Current version: ${app.getVersion()}`);
  log.info(`Update feed URL: ${autoUpdater.getFeedURL() || 'Using default GitHub URL'}`);
  log.info(`Manual check: ${isManualUpdateCheck}`);
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
  log.info(`Update version: ${info.version}`);
  log.info(`Release date: ${info.releaseDate}`);
  
  // Notify user about available update
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      const notification = new Notification('Update Available', {
        body: 'A new version of BrandBay (${info.version}) is available and will be downloaded in the background.'
      });
    `).catch(err => log.error('Error showing update notification', err));
    
    // Also show a dialog for better visibility
    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version of BrandBay (${info.version}) is available.`,
      detail: 'The update will be downloaded in the background and installed when ready.',
      buttons: ['OK']
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available:', info);
  
  // Only show dialog if this was a manual check
  if (mainWindow && isManualUpdateCheck) {
    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'No Updates Available',
      message: 'You are already running the latest version.',
      detail: `Current version: ${app.getVersion()}`,
      buttons: ['OK']
    });
  }
  
  // Reset the flag
  isManualUpdateCheck = false;
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater:', err);
  log.error('Error details:', err.stack || err.toString());
  
  // Only show notification for manual checks or critical errors
  if (mainWindow && isManualUpdateCheck) {
    // Show notification
    mainWindow.webContents.executeJavaScript(`
      const notification = new Notification('Update Error', {
        body: 'There was an error while checking for updates. Please try again later.'
      });
    `).catch(err => log.error('Error showing error notification', err));
    
    // Also show a dialog for better visibility
    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Error',
      message: 'Failed to check for updates.',
      detail: `Error: ${err.message || err}\n\nPlease check your internet connection and try again later.`,
      buttons: ['OK']
    });
  }
  
  // Reset the flag
  isManualUpdateCheck = false;
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Download speed: ${progressObj.bytesPerSecond}`;
  log_message = `${log_message} - Downloaded ${progressObj.percent}%`;
  log_message = `${log_message} (${progressObj.transferred}/${progressObj.total})`;
  log.info(log_message);
  
  // Update the main window with progress (optional)
  if (mainWindow && progressObj.percent % 10 === 0) { // Update every 10%
    mainWindow.setProgressBar(progressObj.percent / 100);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info);
  log.info(`Update version: ${info.version}`);
  log.info(`Release date: ${info.releaseDate}`);
  
  // Reset progress bar
  if (mainWindow) {
    mainWindow.setProgressBar(-1);
  }
  
  // Notify user that update is ready
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      const notification = new Notification('Update Ready', {
        body: 'A new version of BrandBay has been downloaded. It will be installed when you restart the application.'
      });
    `).catch(err => log.error('Error showing update-ready notification', err));
    
    // Show a dialog asking if the user wants to restart now
    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `BrandBay ${info.version} has been downloaded.`,
      detail: 'The update will be installed when you restart the application. Would you like to restart now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        // User clicked 'Restart Now'
        autoUpdater.quitAndInstall();
      }
    });
  }
});

const { Menu, MenuItem } = require('electron');

/**
 * Creates and attaches a context menu to the given window
 * @param {BrowserWindow} window - The window to attach the context menu to
 */
function createContextMenu(window) {
  window.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // Add text editing options
    if (params.isEditable) {
      menu.append(new MenuItem({ label: 'Cut', role: 'cut' }));
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      menu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
      menu.append(new MenuItem({ type: 'separator' }));
    } else if (params.selectionText) {
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Add navigation options
    menu.append(new MenuItem({ label: 'Back', click: () => window.webContents.goBack(), enabled: window.webContents.canGoBack() }));
    menu.append(new MenuItem({ label: 'Forward', click: () => window.webContents.goForward(), enabled: window.webContents.canGoForward() }));
    menu.append(new MenuItem({ label: 'Reload', click: () => window.webContents.reload() }));
    
    // Show the context menu
    menu.popup();
  });
}

module.exports = { createContextMenu };

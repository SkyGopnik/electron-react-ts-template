const { app, BrowserWindow, ipcMain } = require("electron");
const updater = require("electron-updater");
const isDev = require("electron-is-dev");
const path = require("path");
const log = require('electron-log');
const shell = require('electron').shell;

const autoUpdater = updater.autoUpdater;

ipcMain.on('open-link', async (event, arg) => {
  await shell.openExternal(arg);
});

// Conditionally include the dev tools installer to load React Dev Tools
let installExtension, REACT_DEVELOPER_TOOLS;

autoUpdater.autoDownload = true;

autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://google.com"
});

log.info('url');

autoUpdater.on('checking-for-update', function () {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', function (info) {
  sendStatusToWindow('Update available.');
  sendStatusToWindow(JSON.stringify(info));
});

autoUpdater.on('update-not-available', function (info) {
  sendStatusToWindow('Update not available.');
  sendStatusToWindow(JSON.stringify(info));
});

autoUpdater.on('error', function (err) {
  sendStatusToWindow('Error in auto-updater.');
});

autoUpdater.on('download-progress', function (progressObj) {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + parseInt(progressObj.percent) + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
});

autoUpdater.on('update-downloaded', function (info) {
  sendStatusToWindow('Update downloaded; will install in 1 seconds');
});

autoUpdater.on('update-downloaded', function (info) {
  setTimeout(function () {
    autoUpdater.quitAndInstall();
  }, 1000);
});

function sendStatusToWindow(message) {
  log.info(message);
  console.log(message);
}

if (isDev) {
  const devTools = require("electron-devtools-installer");
  installExtension = devTools.default;
  REACT_DEVELOPER_TOOLS = devTools.REACT_DEVELOPER_TOOLS;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1050,
    height: 650,
    title: 'Test App',
    fullscreenable: false,
    center: true,
    resizable: false,
    darkTheme: true,
    // frame: process.platform !== "win32",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isDev,
      preload: path.join(__dirname, "preload.js"),
      renderer: path.join(__dirname, "renderer.js"),
      experimentalFeatures: false
    }
  });

  // Load from localhost if in development
  // Otherwise load index.tsx.html file
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  // Open DevTools if in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
}

// Create a new browser window by invoking the createWindow
// function once the Electron application is initialized.
// Install REACT_DEVELOPER_TOOLS as well if isDev
app.whenReady().then(() => {
  if (isDev) {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((error) => console.log(`An error occurred: , ${error}`));
  }

  createWindow();
});

// Add a new listener that tries to quit the application when
// it no longer has any open windows. This listener is a no-op
// on macOS due to the operating system's window management behavior.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Add a new listener that creates a new browser window only if
// when the application has no visible windows after being activated.
// For example, after launching the application for the first time,
// or re-launching the already running application.
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// The code above has been adapted from a starter example in the Electron docs:
// https://www.electronjs.org/docs/tutorial/quick-start#create-the-main-script-file

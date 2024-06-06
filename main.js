const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const utils = require('./utils');
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });


  // const addBtn = document.querySelector('#addBtn');
  // console.log(addBtn, 'addBtn');
  // mainWindow.webContents.openDevTools();
  // mainWindow.webContents.openDevTools({mode:'detach'})
  // mainWindow.webContents.openDevTools({mode:'undocked'})
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('select-dirs', async (event, args) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (!result.canceled) {
    event.sender.send('selected-dirs', result.filePaths, args);
  }
});


function copyFiles(sourcePath, targetPath) {
  execSync('git pull', {
    stdio: 'inherit',
    cwd: targetPath
  });

  // 检查源路径是否存在
  if (!fs.existsSync(sourcePath)) {
    console.log('源路径不存在');
    return;
  }

  // 检查目标路径是否存在，如果不存在则创建
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath);
  }

  // 读取源路径中的文件和文件夹
  const files = fs.readdirSync(sourcePath);

  // 遍历文件和文件夹
  files.forEach((item) => {
    const sourceItemPath = path.join(sourcePath, item);
    const targetItemPath = path.join(targetPath, item);

    // 检查当前项是否为文件夹
    if (fs.statSync(sourceItemPath).isDirectory()) {
      // 如果是文件夹，则递归调用copyFiles函数进行复制
      copyFiles(sourceItemPath, targetItemPath);
    } else {
      // 如果是文件，则直接复制
      fs.copyFileSync(sourceItemPath, targetItemPath);
    }
  });
}

ipcMain.on('copy-files', (event, sourceDir, targetDir, commitMsg) => {
  try {
    copyFiles(sourceDir, targetDir);
    try {
      utils.handlePush(targetDir, commitMsg);
      event.sender.send('copy-complete');
    } catch (error) {
      event.sender.send('copy-error', error.message);
      console.log('error: ', error.message);
    }
  } catch (error) {
    event.sender.send('copy-error', error.message);
  }
});

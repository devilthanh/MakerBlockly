const {app, BrowserWindow, Menu, ipcMain} = require('electron');
const home = require("os").homedir();
const path = require("path");
const url = require("url");
const http = require('http');
const fileManager = require('fs');
const ChildProcess = require('child_process');
const {autoUpdater} = require("electron-updater");

// electron-packager . --electron-version=8.2.0 --asar --overwrite --extra-resource="resources/arduino-cli.exe"
// electron-packager . --overwrite --asar --extra-resource="resource1.exe" --extra-resource="resource2.dll" --platform=win32 --arch=ia32 --icon=./frontend/dist/assets/icon.ico --prune=true --out=./build --version-string.ProductName='Hot Pan de sal'

uploadSketch = function(board, port, path){								
	var uploadCmd = ChildProcess.spawn('cd resources && arduino-cli core update-index && arduino-cli core install arduino:avr && arduino-cli compile -v --upload --port ' + port + ' --fqbn ' + board + ' \"' + path + '\"', {
		shell: true
	});
	
	uploadCmd.stdout.on('data', (data) => {
		mainWindow.webContents.send('output', 'stdout:' + data.toString());
	});

	uploadCmd.stderr.on('data', (data) => {
		mainWindow.webContents.send('output', 'stderr:' + data.toString());
	});
	
	uploadCmd.on('close', (code) => {
		mainWindow.webContents.send('output', 'Done');
	});
}

getSerialPorts = function(){	
	var str = "";
	var uploadCmd = ChildProcess.spawn('cd resources && arduino-cli board list', {
		shell: true
	});
	
	uploadCmd.stdout.on('data', (data) => {
		str += data.toString();
		console.log(str);
	});
	
	uploadCmd.stderr.on('data', (data) => {
		console.log(str);
	});
	
	uploadCmd.on('close', (code) => {
		mainWindow.webContents.send('getSerialPorts', str);
	});
}

let mainWindow;
// const gotTheLock = app.requestSingleInstanceLock();

// if (!gotTheLock) {
	// app.quit();
// }else {
	// app.on('second-instance', (event, commandLine, workingDirectory) => {
		// if (mainWindow) {
			// if (mainWindow.isMinimized()) mainWindow.restore();
			// mainWindow.focus();
		// }
	// })

	app.on('ready',createWindow);

	app.on('window-all-closed', ()=>{
		if (process.platform !== 'darwin') {
			app.quit();
		}
	});

	app.on('active', ()=>{
		if(mainWindow===null){
			createWindow();
		}
	});
	
	ipcMain.on('code', (event, code) => {
		var fileDir = home + '/Documents/MakerBlockly/upload_sketch';
		fileManager.mkdirSync(fileDir, {recursive: true});
		fileManager.writeFile(fileDir + '/upload_sketch.ino', code, { recursive: true }, function (err) {
			if (err) throw err;
		}); 
		uploadSketch('arduino:avr:uno', 'COM4', fileDir);
	});
	
	ipcMain.on('getSerialPorts', (event, code) => {
		getSerialPorts();
	});
	
	autoUpdater.on('checking-for-update', () => {
		mainWindow.webContents.send('output', 'stdout:' + 'Checking for update...\n');
	});

	autoUpdater.on('update-available', (info) => {
		mainWindow.webContents.send('output', 'stdout:' + 'Update available.\n');
	});

	autoUpdater.on('update-not-available', (info) => {
		mainWindow.webContents.send('output', 'stdout:' + 'Update not available.\n');
	});

	autoUpdater.on('error', (err) => {
		mainWindow.webContents.send('output', 'stderr:' + 'Error in auto-updater. ' + err + '\n');
	});

	autoUpdater.on('download-progress', (progressObj) => {
		// let log_message = "Download speed: " + progressObj.bytesPerSecond
		// log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
		// log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
		// dispatch(log_message)

		mainWindow.webContents.send('output', 'stdout:' + 'downloading: ' + Math.round(progressObj.percent*10)/10 + '%.\n');
	});

	autoUpdater.on('update-downloaded', (info) => {
		mainWindow.webContents.send('output', 'Update downloaded.\n');
	})
// }

function createWindow(){
	app.allowRendererProcessReuse = true;
	mainWindow = new BrowserWindow({show: false, webPreferences: {nodeIntegration: true}});

	//Menu.setApplicationMenu(null);
	
	//mainWindow.webContents.on("devtools-opened", () => { mainWindow.webContents.closeDevTools(); });
	mainWindow.on('closed', ()=>{
		mainWindow = null;
	})
	
	// splash = new BrowserWindow({width: 810, height: 610, transparent: false, frame : false});
	// splash.setAlwaysOnTop(true, 'screen');
	// splash.show();
	// splash.loadURL('http://localhost:8000/');
	mainWindow.loadFile(__dirname + '/blockly/makerblockly/index.html');

	mainWindow.webContents.on('did-finish-load', function() {
		// splash.destroy();
		mainWindow.webContents.send('version', app.getVersion());
		mainWindow.maximize();
		mainWindow.show();
		autoUpdater.checkForUpdatesAndNotify();
	});
	
}
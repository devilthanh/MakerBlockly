const {app, BrowserWindow, Menu} = require('electron');
const home = require("os").homedir();
const path = require("path");
const url = require("url");
const http = require('http');
const fileManager = require('fs');
const ChildProcess = require('child_process');

// electron-packager . --electron-version=8.2.0 --asar --overwrite --extra-resource="resources/arduino-cli.exe"
// electron-packager . --overwrite --asar --extra-resource="resource1.exe" --extra-resource="resource2.dll" --platform=win32 --arch=ia32 --icon=./frontend/dist/assets/icon.ico --prune=true --out=./build --version-string.ProductName='Hot Pan de sal'

const contentTypeMap = [];
contentTypeMap[".appcache"] = "text/cache-manifest";
contentTypeMap[".css"] = "text/css";
contentTypeMap[".gif"] = "image/gif";
contentTypeMap[".html"] = "text/html";
contentTypeMap[".js"] = "application/javascript";
contentTypeMap[".json"] = "application/json";
contentTypeMap[".jpg"] = "image/jpeg";
contentTypeMap[".jpeg"] = "image/jpeg";
contentTypeMap[".wav"] = "audio/wav";
contentTypeMap[".mp3"] = "audio/mp3";
contentTypeMap[".mp4"] = "video/mp4";
contentTypeMap[".pdf"] = "application/pdf";
contentTypeMap[".png"] = "image/webp";
contentTypeMap[".ico"] = "image/webp";
contentTypeMap[".svg"] = "image/svg+xml";
contentTypeMap[".xlsm"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
contentTypeMap[".xml"] = "application/xml";
contentTypeMap[".zip"] = "application/zip";
contentTypeMap[".md"] = "text/plain";
contentTypeMap[".txt"] = "text/plain";
contentTypeMap[".php"] = "text/plain";
contentTypeMap[".manifest"] = "text/cache-manifest";
contentTypeMap[".cur"] = "image/webp";
contentTypeMap[".java"] = "text/plain";
// Server

var pendingRespond = null;
var outputManager = [];

uploadSketch = function(board, port, path){								
	var uploadCmd = ChildProcess.spawn('cd resources && arduino-cli core install arduino:avr && arduino-cli core update-index && arduino-cli compile -v --upload --port ' + port + ' --optimize-for-debug --fqbn ' + board + ' \"' + path + '\"', {
		shell: true
	});
	
	uploadCmd.stdout.on('data', (data) => {
		outputManager.push('stdout:' + data.toString());
	});

	uploadCmd.stderr.on('data', (data) => {
		outputManager.push('stderr:' + data.toString());
	});
	
	uploadCmd.on('close', (code) => {
		outputManager.push('Done');
	});
}

sendRespond = function(res, statusCode, message){
	res.writeHead(statusCode, {
		'Content-Type': "text/plain",
		'Content-Length': Buffer.byteLength(message)
	}).end(message);	
}

const server = http.createServer((req, res) => {
	var uri = req.url;

	if(req.method == "GET" || req.method == "HEAD"){
		if(uri === "/"){
			uri = "/blockly/makerblockly/index.html";
		}else if(uri === "/favicon.ico"){
			uri = "/blockly/makerblockly/favicon.ico";
		}else{
			uri = "/blockly" + uri;
		}
		
		var filePath = path.join(__dirname, uri);
		var stat = fileManager.statSync(filePath);
		var type = contentTypeMap[path.extname(uri)];

		res.writeHead(200, {
			'Content-Type': type,
			'Content-Length': stat.size
		});

		var fileStream = fileManager.createReadStream(filePath);
		fileStream.pipe(res);	
	}
	
	req.on('data', data => {
		if(req.method == "POST"){
			if(uri === "/output"){   
				if(pendingRespond == null){
					pendingRespond = res;
				}else{
					sendRespond(he, 404, "Pending");
				}
			}else if(uri === "/code"){
				if(pendingRespond != null){
					sendRespond(pendingRespond, 200, "Done");
					pendingRespond = null;
				}
				
				var fileDir = home + '/Documents/Maker Blockly/upload_sketch';
				fileManager.mkdirSync(fileDir, {recursive: true});
				fileManager.writeFile(fileDir + '/upload_sketch.ino', data.toString(), { recursive: true }, function (err) {
					if (err) throw err;
				}); 
				sendRespond(res, 200, "accepted");
				
				outputManager = [];
				uploadSketch('arduino:avr:uno', 'COM4', home + '/Documents/Maker Blockly/upload_sketch');		
			}
		}
	})
}).listen(8000);

// Client

let mainWindow;
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
	app.quit()
}else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore()
			mainWindow.focus()
		}
	})

	app.on('ready',createWindow);

	app.on('window-all-closed', ()=>{
		server.close()
		app.quit()
	});

	app.on('active', ()=>{
		if(mainWindow===null){
			createWindow()
		}
	});

	outputLoop = function(){
		if(pendingRespond != null && outputManager.length > 0){
			sendRespond(pendingRespond, 200, outputManager[0]);
			outputManager.shift();
			pendingRespond = null;
		}
	}

	setInterval(outputLoop, 10);
}

function createWindow(){
	app.allowRendererProcessReuse = true;
	mainWindow = new BrowserWindow({show: false});

	//Menu.setApplicationMenu(null);
	
	//mainWindow.webContents.on("devtools-opened", () => { mainWindow.webContents.closeDevTools(); });
	mainWindow.on('closed', ()=>{
		mainWindow = null;
	})
	
	// splash = new BrowserWindow({width: 810, height: 610, transparent: false, frame : false});
	// splash.setAlwaysOnTop(true, 'screen');
	// splash.show();
	// splash.loadURL('http://localhost:8000/');
	mainWindow.loadURL('http://localhost:8000/');

	mainWindow.webContents.on('did-finish-load', function() {
		// splash.destroy();
		mainWindow.maximize();
		mainWindow.show();
	});
}
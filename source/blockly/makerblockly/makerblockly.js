goog.provide('MakerBlockly');
goog.require('Blockly.Utils');

MakerBlockly = {};
MakerBlockly.maxHeight = 300;
MakerBlockly.Workspaces = ['blocks', 'arduino', 'xml'];
MakerBlockly.selectedWorkspace = 'blocks';
MakerBlockly.promptFunction = null;
MakerBlockly.confirmFunction = null;

MakerBlockly.init = function() {
	var container = document.getElementById('content_area');
	var onresize = function(e) {
		var bound = MakerBlockly.getElementBound(container);
		
		for (var i = 0; i < MakerBlockly.Workspaces.length; i++) {
			var element = document.getElementById('content_' + MakerBlockly.Workspaces[i]);
			element.style.top = bound.y + 'px';
			element.style.left = bound.x + 'px';
			element.style.height = bound.height + 'px';
			element.style.height = (2 * bound.height - element.offsetHeight) + 'px';
			element.style.width = bound.width + 'px';
			element.style.width = (2 * bound.width - element.offsetWidth) + 'px';
		}
		
		if (Blockly.mainWorkspace.toolbox_.width) {
			document.getElementById('tab_blocks').style.minWidth = Blockly.mainWorkspace.toolbox_.width - 38 + 'px';
		}
	};	
	
	window.addEventListener('resize', onresize, false);
	var toolbox = document.getElementById('toolbox');
	Blockly.inject(document.getElementById('content_blocks'),{	
											grid: false,
											comments: true,
											collapse: true,
											disable: true,
											maxBlocks: Infinity,
											media: './media/',
											toolbox: toolbox,
											trashcan: true,
											zoom: {
												controls: true,
												wheel: true,
												startScale: 1.0,
												maxScale: 2,
												minScale: 0.2,
												scaleSpeed: 1.2
											}
										});
	
	MakerBlockly.autoSaveAndRestore();
	onresize(false);
	
	var ide_output_panel = document.getElementById('ide_output_panel');
	ide_output_panel.addEventListener('click', function(event) {
		if (ide_output_panel !== event.target) return;
		var content = this.nextElementSibling;
		if (content.style.height ){
			content.style.height  = null;
			content.style.padding = '0 20px';
		} else {
			content.style.height  = MakerBlockly.maxHeight;
			content.style.padding = '10 20px';
		} 
	});
}

MakerBlockly.onWorkspaceChange = function(workspace) {
	if(document.getElementById('tab_xml').className == 'tabon') {
		var xmlTextarea = document.getElementById('content_xml');
		var xmlText = xmlTextarea.value;
		var xmlDom = null;
		try {
			xmlDom = Blockly.Xml.textToDom(xmlText);
		} catch (e) {
			MakerBlockly.addOutput('<span style="color:tomato">Failed to convert, discarded changes</span>\n');
			return;
		}
		
		if (xmlDom) {
			Blockly.mainWorkspace.clear();
			Blockly.Xml.domToWorkspace(xmlDom, Blockly.mainWorkspace);
		}
	}

	if (document.getElementById('tab_blocks').className == 'tabon') {
		Blockly.mainWorkspace.setVisible(false);
	}
	
	for (var i = 0; i < MakerBlockly.Workspaces.length; i++) {
		document.getElementById('tab_' + MakerBlockly.Workspaces[i]).className = 'taboff';
		document.getElementById('content_' + MakerBlockly.Workspaces[i]).style.visibility = 'hidden';
	}

	MakerBlockly.selectedWorkspace = workspace;
	document.getElementById('tab_' + workspace).className = 'tabon';
	document.getElementById('content_' + workspace).style.visibility = 'visible';
	MakerBlockly.renderContent();
	if (workspace == 'blocks') {
		Blockly.mainWorkspace.setVisible(true);
	}		
}

MakerBlockly.renderContent = function() {
	var content = document.getElementById('content_' + MakerBlockly.selectedWorkspace);
	
	if (content.id == 'content_blocks') {
		Blockly.mainWorkspace.render();
	} else if (content.id == 'content_xml') {
		var content_xml = document.getElementById('content_xml');
		var xmlDom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
		var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
		content_xml.value = xmlText;
		content_xml.focus();
	} else if (content.id == 'content_arduino') {
		var content_arduino = document.getElementById('content_arduino');
		content_arduino.value = Blockly.Arduino.workspaceToCode(Blockly.mainWorkspace);
		content_arduino.focus();
	}
}

MakerBlockly.getElementBound = function(element) {
	var x = 0;
	var y = 0;
	var height = element.offsetHeight;
	var width = element.offsetWidth;
	
	do {
		x += element.offsetLeft;
		y += element.offsetTop;
		element = element.offsetParent;
	} while (element);
	
	return {
		x: x,
		y: y,
		height: height,
		width: width
	};
}

MakerBlockly.bindEvent = function(element, event, func) {
	if(element.addEventListener){
		element.addEventListener(event, func, false);
	}else if (element.attachEvent) {
		element.attachEvent('on' + event, func);
	}
}

MakerBlockly.backupBlocks = function() {
	if ('localStorage' in window) {
		var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
		window.localStorage.setItem('arduino', Blockly.Xml.domToText(xml));
	}
}

MakerBlockly.restoreBlocks = function() {
	if('localStorage' in window && window.localStorage.arduino) {
		var xml = Blockly.Xml.textToDom(window.localStorage.arduino);
		Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);
	}
}

MakerBlockly.saveCode = function() {
	fileName = 'makerblockly_project.ino';
	if(fileName){
		var blob = new Blob([Blockly.Arduino.workspaceToCode(Blockly.mainWorkspace)], {type: 'text/plain;charset=utf-8'});
		var url = window.URL.createObjectURL(blob);
		var saveCodeBlob = document.createElement("a");
		document.body.appendChild(saveCodeBlob);
        saveCodeBlob.href = url;
        saveCodeBlob.download = fileName;
        saveCodeBlob.click();
        window.URL.revokeObjectURL(url);
		saveCodeBlob.remove();
	}
}

MakerBlockly.saveXML = function() {
	fileName = 'makerblockly_project.mbp';
	var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
	var data = Blockly.Xml.domToText(xml);
	if(fileName){
		// dialog.showSaveDialog({defaultPath: '/Users/username/Documents/my-file.txt'}, function(fileName) {
			
		// });
		var blob = new Blob([data], {type: 'text/plain;charset=utf-8'});
		var url = window.URL.createObjectURL(blob);
		var saveXMLBlob = document.createElement("a");
		document.body.appendChild(saveXMLBlob);
        saveXMLBlob.href = url;
        saveXMLBlob.download = fileName;
        saveXMLBlob.click();
        window.URL.revokeObjectURL(url);
		saveXMLBlob.remove();
	}
}

MakerBlockly.loadXML = function(event) {
	var files = event.target.files;
	if (files.length != 1) {
		return;
	}

	var reader = new FileReader();
	reader.onloadend = function(event) {
		var target = event.target;
		if (target.readyState == 2) {
			try {
				var xml = Blockly.Xml.textToDom(target.result);
			}catch(e){
				MakerBlockly.addOutput('<span style="color:tomato">Failed to load project (wrong project format).</span>\n');
				return;
			}
			var count = Blockly.mainWorkspace.getAllBlocks().length;
			if(count) {
				MakerBlockly.confirm('Replace existing blocks?</br>"Cancel" will merge.', function(ans){
					if(ans){
						Blockly.mainWorkspace.clear();
						Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);
						MakerBlockly.addOutput('<span style="color:white">Loaded project successfully (not merged).</span>\n');
					}else{
						Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);
						MakerBlockly.addOutput('<span style="color:white">Loaded project successfully (merged).</span>\n');
					}
				});
			}else {
				Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);
				MakerBlockly.addOutput('<span style="color:white">Loaded project successfully.</span>\n');
			}
		}
		document.getElementById('load').value = '';
	};
	reader.readAsText(files[0]);
}

MakerBlockly.autoSaveAndRestore = function() {
	window.setTimeout(MakerBlockly.restoreBlocks, 0);
	MakerBlockly.bindEvent(window, 'unload', MakerBlockly.backupBlocks);
	MakerBlockly.onWorkspaceChange(MakerBlockly.selectedWorkspace);

	var loadElement = document.getElementById('load');
		loadElement.addEventListener('change', MakerBlockly.loadXML, false);
	document.getElementById('fakeload').onclick = function() {
		loadElement.click();
	};
}

MakerBlockly.addOutput = function(line){
	var ide_output_content = document.getElementById('ide_output_content');
	ide_output_content.innerHTML = ide_output_content.innerHTML + line;
	
	const isScrolledToBottom = ide_output_content.scrollHeight - ide_output_content.clientHeight <= ide_output_content.scrollTop + 1

	if (!isScrolledToBottom) {
	  ide_output_content.scrollTop = ide_output_content.scrollHeight - ide_output_content.clientHeight
	}
	
	ide_output_content.style.height = MakerBlockly.maxHeight;	
	ide_output_content.style.padding = '10 20px';
}

MakerBlockly.createOutputRequest = function(spinner) {
	var target = document.getElementById('content_arduino');
    var url = 'http://localhost:8000/output';
    var method = 'POST';
    var request = new XMLHttpRequest();
	
    request.onreadystatechange = function(){

		if (request.readyState != 4) { 
			return; 
		}
		
		if(request.responseText != 'Done' && request.status == 200){
			var output = request.responseText.substring(request.responseText.indexOf(':') + 1);
			var stt = request.responseText.substring(0, request.responseText.indexOf(':'));
			var colorCode;
			if(stt == 'stdout'){
				colorCode = 'white';
			}else{
				colorCode = 'tomato';
			}
			
			MakerBlockly.addOutput('<span style="color:' + colorCode + '">' + output + '</span>')
			MakerBlockly.createOutputRequest(spinner);
		}else{
			spinner.stop();
		}
	};

    request.open(method, url, true);
	request.setRequestHeader('Content-Type', 'text/plain;charset=ISO-8859-1');
	request.send('outputRequest');
}

MakerBlockly.postCode = function(code) {
    var target = document.getElementById('content_arduino');
    var spinner = new Spinner().spin(target);

    var url = 'http://localhost:8000/code';
    var method = 'POST';
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
		if (request.readyState != 4) { 
			return; 
		}
						
		if(request.responseText == 'accepted' ){
			MakerBlockly.createOutputRequest(spinner);
		}
	};;

    request.open(method, url, true);
    request.setRequestHeader('Content-Type'	, 'text/plain;charset=ISO-8859-1');
    request.send(code);	     
}

MakerBlockly.upload = function() {
	var ide_output_content = document.getElementById('ide_output_content');
	ide_output_content.innerHTML = '';
	ide_output_content.style.height = MakerBlockly.maxHeight;	
	ide_output_content.style.padding = '10 20px';
    MakerBlockly.postCode(Blockly.Arduino.workspaceToCode(Blockly.getMainWorkspace()));
}

MakerBlockly.reset = function() {
	var count = Blockly.mainWorkspace.getAllBlocks().length;
	MakerBlockly.confirm('Do you want to delete all</br><font size="100%">' + count + '</font></br>blocks?', function(ans) {
		if(ans){		
			Blockly.mainWorkspace.clear();
			MakerBlockly.renderContent();
			MakerBlockly.addOutput('<span style="color:white">Cleared ' + count + ' blocks successfully.</span>\n');
		}
	});
}

MakerBlockly.confirm = function(title, callback) {
	document.getElementById('confirm_area').style.display = 'block';
	document.getElementById('confirm_label').innerHTML = title;
	MakerBlockly.confirmFunction = callback;
}

MakerBlockly.confirmSubmit = function() {
	document.getElementById('confirm_area').style.display = 'none';
    "function" == typeof MakerBlockly.confirmFunction ? MakerBlockly.confirmFunction(true) : console.log("Blocky confirm callback needs to be a callable function.");
}

MakerBlockly.confirmCancel = function() {
	document.getElementById('confirm_area').style.display = 'none';
	"function" == typeof MakerBlockly.confirmFunction ? MakerBlockly.confirmFunction(false) : console.log("Blocky confirm callback needs to be a callable function.");
}

MakerBlockly.prompt = function(title, defaultText, callback) {
	document.getElementById('prompt_area').style.display = 'block';
	document.getElementById('prompt_label').innerHTML = title;
	document.getElementById('prompt_input').value = defaultText;
	document.getElementById('prompt_input').focus();
	document.getElementById('prompt_input').select();
	MakerBlockly.promptFunction = callback;
}

MakerBlockly.promptSubmit = function() {
	document.getElementById('prompt_area').style.display = 'none';
    "function" == typeof MakerBlockly.promptFunction ? MakerBlockly.promptFunction(document.getElementById('prompt_input').value) : console.log("Blocky prompt callback needs to be a callable function.");
}

MakerBlockly.promptCancel = function() {
	document.getElementById('prompt_area').style.display = 'none';
}

MakerBlockly.promptKeys = function(event) {
	if(event.keyCode == 13) {
		MakerBlockly.promptSubmit();
	}else if(event.keyCode == 27) {
		MakerBlockly.promptCancel();
	}
}

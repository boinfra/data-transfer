// Cross browser support
var isChromium = window.chrome,
	chrome,
	winNav = window.navigator,
	vendorName = winNav.vendor,
	isOpera = winNav.userAgent.indexOf("OPR") > -1,
	isIEedge = winNav.userAgent.indexOf("Edge") > -1,
	isIOSChrome = winNav.userAgent.match("CriOS"),
	message = document.getElementById("dropMessage");

if (isIOSChrome) {
	message.innerHTML = "Drag n'drop your files or folders here";
	chrome = true;
} else if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isIEedge == false) {
	message.innerHTML = "Drag n'drop your files or folders here";
	chrome = true;
} else {
	message.innerHTML = "Drag n'drop your files here";
	chrome = false;
}

// Drop
var files = { names: [], contents: [], count: 0 };

function allowDrop(ev) {
	ev.preventDefault();
}

function drop(ev) {
	ev.preventDefault();
	var droppedFiles = chrome ? ev.dataTransfer.items : ev.dataTransfer.files;
	if (chrome) {
		for (var i = 0; i < droppedFiles.length; i++) {
			var entry = droppedFiles[i].webkitGetAsEntry();
			if (entry.isFile) {
				console.debug("file");
			}
			else if (entry.isDirectory) {
				console.debug("directory");
			}
		}
	}
	else {
		for (var i = 0; i < droppedFiles.length; i++) {
			var file = droppedFiles[i];
			files.names[i] = file.name;
			var reader = new FileReader();
			reader.readAsText(file);
			reader.onload = function (e) {
				files.contents[files.count] = e.target.result;
				console.debug(files.names[files.count]);
				console.debug(files.contents[files.count]);
				files.count++;
			};
		}
	}
}
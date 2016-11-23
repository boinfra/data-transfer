// Cross browser support
var isChromium = window.chrome,
	chrome, // Indicates if browser is chrome or compatible (chrome iOS, opera)
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
var files = [];
var filesCount = 0;

function allowDrop(ev) {
	ev.preventDefault();
}

function drop(ev) {
	ev.preventDefault();
	var droppedFiles = chrome ? ev.dataTransfer.items : ev.dataTransfer.files;
	if (chrome) {
		for (var i = 0; i < droppedFiles.length; i++) {
			var droppedFile = droppedFiles[i];
			var entry = droppedFile.webkitGetAsEntry();
			if (entry.isFile) {
				readFile(entry);
			}
			else if (entry.isDirectory) {
				console.debug(entry.name);
				scanFiles(entry, droppedFile);
			}
		}
	}
	else {
		for (var i = 0; i < droppedFiles.length; i++) {
			readFile(droppedFiles[i]);
		}
	}
}

var readFile = chrome ?
	function (entry) {
		files.push({ name: entry.name });
		entry.file(function (file) {
			var reader = new FileReader();
			reader.readAsText(file);
			reader.onload = function (e) {
				files[filesCount].content = e.target.result;
				console.debug(files[filesCount].name);
				console.debug(files[filesCount].content);
				filesCount++;
			};
		});
	} : function (file) {
		files.push({ name: file.name });
		var reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function (e) {
			files[filesCount].content = e.target.result;
			console.debug(files[filesCount].name);
			console.debug(files[filesCount].content);
			filesCount++;
		};
	};

function scanFiles(item, droppedFile) {
	let directoryReader = item.createReader();

	directoryReader.readEntries(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isDirectory) {
				console.debug(entry.fullPath);
				scanFiles(entry, droppedFile);
			}
			else if (entry.isFile) {
				readFile(entry);
			};
		});
	});
}	
var readFile;
var transfersScope = null;
var scanDirectory;
var chrome;

angular.module("data-transfer")

	.controller("DropController", function () {
		// Cross browser support
		var isChromium = window.chrome,
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

		readFile = chrome ?
			function (entry) {
				files.push({ name: entry.name });
				entry.file(function (file) {
					var reader = new FileReader();
					reader.readAsText(file);
					reader.onload = function (e) {
						files[filesCount].content = e.target.result;
						var size = file.size;
						var divCount = 0;
						while (size > 1024) {
							size = Number((size / 1024).toFixed(3));
							divCount++;
						}
						var newTrans = {
							name: file.name,
							content: e.target.result,
							size: size + (divCount == 2 ? " MB" : divCount == 1 ? " KB" : " B"),
							transferType: "Upload",
							status: "Queued"
						};
						transfersScope.pushTransfer(newTrans);
						filesCount++;
					};
				});
			} : function (file) {
				files.push({ name: file.name });
				var reader = new FileReader();
				reader.readAsText(file);
				reader.onload = function (e) {
					files[filesCount].content = e.target.result;
					var size = file.size;
					var divCount = 0;
					while (size > 1024) {
						size = Number((size / 1024).toFixed(3));
						divCount++;
					}
					var newTrans = {
						name: file.name,
						content: e.target.result,
						size: size + (divCount == 2 ? " MB" : divCount == 1 ? " KB" : " B"),
						transferType: "Upload",
						status: "Queued"
					};
					transfersScope.pushTransfer(newTrans);
					filesCount++;
				};
			};

		scanDirectory = function (item, droppedFile) {
			let directoryReader = item.createReader();

			directoryReader.readEntries(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isDirectory) {
						scanDirectory(entry, droppedFile);
					}
					else if (entry.isFile) {
						readFile(entry);
					};
				});
			});
		}
	});

function allowDrop(ev) {
	ev.preventDefault();
	if (transfersScope == null) {
		transfersScope = angular.element($("#fileTransfersView")).scope();
	}
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
				scanDirectory(entry, droppedFile);
			}
		}
	}
	else {
		for (var i = 0; i < droppedFiles.length; i++) {
			readFile(droppedFiles[i]);
		}
	}
}
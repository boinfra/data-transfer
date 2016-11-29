var readFile;
var transfersScope = null;
var scanDirectory;

angular.module("data-transfer")

	.controller("DropController", function () {
		var chrome = isChrome();
		console.debug(chrome);

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
							name: entry.fullPath,
							content: e.target.result,
							size: file.size,
							displaySize: size + (divCount == 2 ? " MB" : divCount == 1 ? " KB" : " B"),
							transferType: "Upload",
							status: "Queued",
							hash: CryptoJS.MD5(entry.fullPath + e.target.result)
						};
						var fileAlreadyDropped = false;
						for (var i = 0; i < transfersScope.transfers.length; i++) {
							if (transfersScope.transfers[i].hash.toString() == newTrans.hash.toString()) {
								fileAlreadyDropped = true;
								alert('The following file has already been dropped: "' + file.name + '"');
								i = transfersScope.transfers.length;
							}
						}
						if (!fileAlreadyDropped) {
							transfersScope.pushTransfer(newTrans);
							filesCount++;
						}
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
						size: file.size,
						displaySize: size + (divCount == 2 ? " MB" : divCount == 1 ? " KB" : " B"),
						transferType: "Upload",
						status: "Queued",
						hash: CryptoJS.MD5(file.name + e.target.result)
					};
					var fileAlreadyDropped = false;
					for (var i = 0; i < transfersScope.transfers.length; i++) {
						if (transfersScope.transfers[i].hash.toString() == newTrans.hash.toString()) {
							fileAlreadyDropped = true;
							alert('The following file has already been dropped: "' + file.name + '"');
							i = transfersScope.transfers.length;
						}
					}
					if (!fileAlreadyDropped) {
						transfersScope.pushTransfer(newTrans);
						filesCount++;
					}
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
angular.module('data-transfer')

	.controller('dropController', ['$scope', 'browserDetectionService', 'transfersService', function ($scope, browserDetectionService, transfersService) {
		var chrome = browserDetectionService.isChrome();
		console.debug('Browser has webkit: ' + browserDetectionService.getBrowserInfo().hasWebkit + ' version: ' + browserDetectionService.getBrowserInfo().webkitVersion);
		console.debug('Browser is ' + browserDetectionService.getBrowserInfo().name + ' version: ' + browserDetectionService.getBrowserInfo().version);
		var files = [];
		// Display the message in the drop zone
		if (chrome) {
			document.getElementById("dropMessage").innerHTML = "Drag n'drop your files or folders here";
		}
		else {
			document.getElementById("dropMessage").innerHTML = "Drag n'drop your files here";
		}

		var dropZone = document.getElementById("dropZone");

		// onDragover event of the dropZone
		dropZone.ondragover = function (ev) {
			ev.preventDefault(); // Prevent dropped file to be openned in the browser
		};

		function pushFile(file) {
			var alreadyDropped = false;
			for (var i = 0; i < transfersService.getFiles().length; i++) {
				if (transfersService.getFiles()[i].name === file.name) {
					alreadyDropped = true;
					alert('File alreadyDropped: ' + file.name);
					i = transfersService.getFiles().length;
				}
			}
			if (!alreadyDropped) {
				transfersService.pushFile(file);
			}
		}

		// onDrop event of the dropZone
		dropZone.ondrop = function (ev) {
			ev.preventDefault(); // Prevent dropped file to be openned in the browser
			var droppedFiles = chrome ? ev.dataTransfer.items : ev.dataTransfer.files; // Dropped files array affected depending on the browser
			for (var i = 0; i < droppedFiles.length; i++) {
				if (chrome) {
					var entry = droppedFiles[i].webkitGetAsEntry();
					if (entry.isDirectory) {
						$scope.scanDirectory(entry);
					}
					else if (entry.isFile) {
						files.push(entry);
						entry.file(pushFile);
					}
				}
				else {
					files.push(droppedFiles[i]);
					transfersService.pushFile(droppedFiles[i]);
				}
			}
		};

		// Function that scans the directory recursively, until it contains only files
		$scope.scanDirectory = function (item) {
			var directoryReader = item.createReader(); // A directory reader is needed to scan the directory

			directoryReader.readEntries(function (entries) { // Read all entries of the directory (can be file or directory)
				entries.forEach(function (entry) { // Go through all entries
					if (entry.isDirectory) { // If it's a directory
						$scope.scanDirectory(entry); // Scan it (recursion)
					}
					else if (entry.isFile) { // If it's a file
						files.push(entry); // Read it as text
						entry.file(pushFile);
					}
				});
			});
		};
	}]);
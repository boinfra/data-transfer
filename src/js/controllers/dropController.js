angular.module('data-transfer')

	.controller('dropController', ['$scope', 'browserDetectionService', 'transfersService', function ($scope, browserDetectionService, transfersService) {
		var browserInfo = browserDetectionService.getBrowserInfo();
		var webkit = browserInfo.hasWebkit;
		var files = [];
		var hashes = [];
		// Display the message in the drop zone
		if (webkit) {
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
			var droppedFile = {
				lastModified: file.lastModified,
				lastModifiedDate: file.lastModifiedDate,
				name: file.name,
				size: file.size,
				type: file.type
			};
			var alreadyDropped = false;
			var hash = CryptoJS.MD5(JSON.stringify(droppedFile));
			for (var i = 0; i < hashes.length; i++) {
				alreadyDropped = (JSON.stringify(hashes[i]) === JSON.stringify(hash));
				if (alreadyDropped) {
					i = hashes.length;
					alert('File already dropped: ' + file.name);
				}
			}
			if (!alreadyDropped) {
				hashes.push(hash);
				files.push(file);
				transfersService.pushFile(file);
			}
		}

		// onDrop event of the dropZone
		dropZone.ondrop = function (ev) {
			ev.preventDefault(); // Prevent dropped file to be openned in the browser
			var droppedFiles = webkit ? ev.dataTransfer.items : ev.dataTransfer.files; // Dropped files array affected depending on the browser
			for (var i = 0; i < droppedFiles.length; i++) {
				if (webkit) {
					var entry = droppedFiles[i].webkitGetAsEntry();
					if (entry.isDirectory) {
						$scope.scanDirectory(entry);
					}
					else if (entry.isFile) {
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
						entry.file(pushFile);
					}
				});
			});
		};
	}]);
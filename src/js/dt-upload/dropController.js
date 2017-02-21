var dtUpload = dtUpload || angular.module('dt-upload', []);

dtUpload.controller('dropController', ['browserDetectionService', 'transfersService', 'configService', function (browserDetectionService, transfersService, configService) {
	// Detect currently used browser and display message depending on the browser
	/** Information about the browser */
	var browserInfo = browserDetectionService.getBrowserInfo();
	/** Indicates if the browser supports webkit */
	var webkit = browserInfo.hasWebkit;
	if (webkit) {
		document.getElementById("dropMessage").innerHTML = "Drag n'drop your files or folders here";
	}
	else {
		document.getElementById("dropMessage").innerHTML = "Drag n'drop your files here";
	}

	/** Array that contains hashes of all files. Used to know if a file has already been dropped. */
	var hashes = [];
	/** Drop zone in the page (element) */
	var dropZone = document.getElementById('dropZone');

	// Event triggered when the user drags a file on the drop zone
	dropZone.ondragover = function (e) {
		e.preventDefault();
	};

	// Event triggeres when the user drops a file or directory in the drop zone
	dropZone.ondrop = function (e) {
		e.preventDefault(); // Prevent dropped file to be openned in the browser
		var droppedFiles = webkit ? e.dataTransfer.items : e.dataTransfer.files; // Dropped files array affected depending on the browser
		for (var i = 0; i < droppedFiles.length; i++) {
			if (webkit) {
				var entry = droppedFiles[i].webkitGetAsEntry();
				if (entry.isDirectory) {
					scanDirectory(entry);
				}
				else if (entry.isFile) {
					entry.file(checkFileDuplicate);
				}
			}
			else {
				checkFileDuplicate(droppedFiles[i]);
			}
		}
	};

	$(window).on('removed', function (e) {
		var index = hashes.indexOf(hashes.filter(function (h) {
			return h.filename === e.filename;
		})[0]);
		if (index > -1) {
			hashes.splice(index, 1);
		}
	});

	/**
	 * Adds a new file to the list in transfersService, after checking if this file has already been dropped
	 * @param {File} file file to check and add
	 */
	function checkFileDuplicate(file) {
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
			alreadyDropped = (JSON.stringify(hashes[i].hash) === JSON.stringify(hash));
			if (alreadyDropped) {
				i = hashes.length;
				alert('File already dropped: ' + file.name);
			}
		}
		if (!alreadyDropped) {
			hashes.push({ hash: hash, filename: file.name });
			var dropped = $.Event('dropped');
			dropped.file = file;
			dropped.status = configService.getAutoStart() ? 'Pending' : 'Queued';
			$(window).trigger(dropped);
			if (configService.getAutoStart()) {
				transfersService.uploadFile(file);
			}
		}
	}

	/**
	 * Scans a dropped directory (only in browsers that support webkit)
	 * @param {object} directory directory to scan
	 */
	function scanDirectory(directory) {
		var directoryReader = directory.createReader(); // A directory reader is needed to scan the directory
		directoryReader.readEntries(function (entries) { // Read all entries of the directory (can be file or directory)
			entries.forEach(function (entry) { // Go through all entries
				if (entry.isDirectory) { // If it's a directory
					scanDirectory(entry); // Scan it (recursion)
				}
				else if (entry.isFile) { // If it's a file
					entry.file(checkFileDuplicate);
				}
			});
		});
	}
}]);
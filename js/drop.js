var readFile; // Function that reads a file
var transfersScope = null; // Scope of the transfersController
var scanDirectory; // Function that scans a directory
var chrome;

// Main module of the framework
angular.module("data-transfer")
	// Controller that assumes drop functionnality (linked mainly to the drop zone)
	.controller("DropController", function () {
		chrome = isChrome(); // Indicates if the user is on Chrome (or Opera) All time Chrome is mentioned in this code, it also concerns Opera

		// readFile function definition		
		readFile = chrome ? // If the user is on chrome
			// Function if user uses Chrome	
			function (entry) {
				// Read entry as file
				entry.file(function (file) {
					var reader = new FileReader(); // Reader needed to read file content
					reader.readAsText(file); // Read the file as text
					// Event that occurs when the reader has finished reading the file
					reader.onload = function (e) {
						var size = file.size; // Size of the file
						var divCount = 0; // Counter that counts the number of times the size is divided. It helps to know if the size is in Bytes, KiloBytes or MegaBytes
						while (size > 1024) { // While the size is greater than 1024 (1KB), it can be divided to have a notation with MB or KB
							size = Number((size / 1024).toFixed(3)); // Division
							divCount++; // Increment the division counter
						}
						// Create a new transfer object
						var newTrans = {
							name: entry.fullPath, // Name is the full path
							content: e.target.result, // Content is the result of the reader (read as text)
							size: file.size, // Size of the file in Bytes
							displaySize: size + (divCount == 2 ? " MB" : divCount == 1 ? " KB" : " B"), // Size displayed with a unit (B, KB, MB)
							transferType: "Upload", // Transfer type (can be Upload or Download)
							status: "Queued", // Status (Queued at the beginning, changes during upload and at the end of upload)
							hash: CryptoJS.MD5(entry.fullPath + e.target.result) // Hash of the file (used to compare files together)
						};
						var fileAlreadyDropped = false; // Indicates if a file has already been dropped
						for (var i = 0; i < transfersScope.transfers.length; i++) { // Going through all files (already dropped)
							if (transfersScope.transfers[i].hash.toString() == newTrans.hash.toString()) { // If the file hash is the same as the hash of the file that has already been dropped
								fileAlreadyDropped = true; // This file has already been dropped, so don't transfer it
								alert('The following file has already been dropped: "' + file.name + '"'); // Pop-up a message which tells the user he's trying to upload a file that has already been dropped
								i = transfersScope.transfers.length; // Out of the loop
							}
						}
						if (!fileAlreadyDropped) { // If the file isn't dropped yet
							transfersScope.pushTransfer(newTrans); // Push it into transfers list
						}
					};
				});
			} :
			// Function if the user uses another browser
			function (file) {
				var reader = new FileReader(); // Reader needed to read file content
				reader.readAsText(file); // Read the file as text
				// Event that occurs when the reader has finished reading the file
				reader.onload = function (e) {
					var size = file.size; // Size of the file
					var divCount = 0; // Counter that counts the number of times the size is divided. It helps to know if the size is in Bytes, KiloBytes or MegaBytes
					while (size > 1024) { // While the size is greater than 1024 (1KB), it can be divided to have a notation with MB or KB
						size = Number((size / 1024).toFixed(3)); // Division
						divCount++; // Increment the division counter
					}
					// Create a new transfer object
					var newTrans = {
						name: file.name, // Name of the file
						content: e.target.result, // Content is the result of the reader (read as text)
						size: file.size, // Size of the file in Bytes
						displaySize: size + (divCount == 2 ? " MB" : divCount == 1 ? " KB" : " B"), // Size displayed with a unit (B, KB, MB)
						transferType: "Upload", // Transfer type (can be Upload or Download)
						status: "Queued", // Status (Queued at the beginning, changes during upload and at the end of upload)
						hash: CryptoJS.MD5(file.name + e.target.result) // Hash of the file (used to compare files together)
					};
					var fileAlreadyDropped = false; // Indicates if a file has already been dropped
					for (var i = 0; i < transfersScope.transfers.length; i++) { // Going through all files (already dropped)
						if (transfersScope.transfers[i].hash.toString() == newTrans.hash.toString()) { // If the file hash is the same as the hash of the file that has already been dropped
							fileAlreadyDropped = true; // This file has already been dropped, so don't transfer it
							alert('The following file has already been dropped: "' + file.name + '"'); // Pop-up a message which tells the user he's trying to upload a file that has already been dropped
							i = transfersScope.transfers.length; // Out of the loop
						}
					}
					if (!fileAlreadyDropped) { // If the file isn't dropped yet
						transfersScope.pushTransfer(newTrans); // Push it into transfers list
					}
				};
			};

		// Function that scans the directory recursively, until it contains only files
		scanDirectory = function (item) {
			let directoryReader = item.createReader(); // A directory reader is needed to scan the directory

			directoryReader.readEntries(function (entries) { // Read all entries of the directory (can be file or directory)
				entries.forEach(function (entry) { // Go through all entries
					if (entry.isDirectory) { // If it's a directory
						scanDirectory(entry); // Scan it (recursion)
					}
					else if (entry.isFile) { // If it's a file
						readFile(entry); // Read it as text
					};
				});
			});
		}
	});

// OnDragover event
function allowDrop(ev) {
	ev.preventDefault(); // Prevent dropped file from being opened in the browser
	if (transfersScope == null) { // If transfersScope is null (transfersScope is the $scope of the transfersController)
		transfersScope = angular.element($("#fileTransfersView")).scope(); // Initialise scope
	}
}

// onDrop event
function drop(ev) {
	ev.preventDefault(); // Prevent dropped file from being opened in the browser
	var droppedFiles = chrome ? ev.dataTransfer.items : ev.dataTransfer.files; // Dropped files array affected depending on the browser
	if (chrome) { 
		for (var i = 0; i < droppedFiles.length; i++) {
			var droppedFile = droppedFiles[i];
			var entry = droppedFile.webkitGetAsEntry(); // Get dropped item as an entry (which can be either a file or a directory)
			if (entry.isFile) { // If it's a file
				readFile(entry); // Read it as text
			}
			else if (entry.isDirectory) { // If it's a directory
				scanDirectory(entry); // Scan it
			}
		}
	}
	else {
		// If user doesn't use Chrome, just read all files as text
		for (var i = 0; i < droppedFiles.length; i++) {
			readFile(droppedFiles[i]);
		}
	}
}
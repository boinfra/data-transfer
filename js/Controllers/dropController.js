angular.module('data-transfer')

.controller('dropController', ['$scope', '$rootScope', 'browserDetectionService', function($scope, $rootScope, browserDetectionService){
	var isChrome = browserDetectionService.isChrome();
	if(isChrome){
		document.getElementById("dropMessage").innerHTML = "Drag n'drop your files or folders here";
	}
	else{
		document.getElementById("dropMessage").innerHTML = "Drag n'drop your files here";
	}

	var dropZone = document.getElementById("dropZone");

	dropZone.ondragover = function(ev){
		ev.preventDefault();
	};

	dropZone.ondrop = function(ev){
		ev.preventDefault();
		var droppedFiles = isChrome ? ev.dataTransfer.items : ev.dataTransfer.files; // Dropped files array affected depending on the browser
		if (isChrome) {
			for (var entryCnt = 0; entryCnt < droppedFiles.length; entryCnt++) {
				var droppedFile = droppedFiles[entryCnt];
				var entry = droppedFile.webkitGetAsEntry(); // Get dropped item as an entry (which can be either a file or a directory)
				if (entry.isFile) { // If it's a file
					$scope.readFile(entry); // Read it as text
				}
				else if (entry.isDirectory) { // If it's a directory
					scanDirectory(entry); // Scan it
				}
			}
		}
		else {
			// If user doesn't use Chrome, just read all files as text
			for (var filesCnt = 0; filesCnt < droppedFiles.length; filesCnt++) {
				$scope.readFile(droppedFiles[filesCnt]);
			}
		}
	};

	$scope.readFile = function(file){
		if(isChrome) {
			// Read entry as file
			var entry = file;
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
						hash: CryptoJS.MD5(entry.name + e.target.result) // Hash of the file (used to compare files together)
					};
					var fileAlreadyDropped = false; // Indicates if a file has already been dropped
					for (var i = 0; i < $rootScope.transfers.length | fileAlreadyDropped; i++) { // Going through all files (already dropped)
						fileAlreadyDropped = $rootScope.transfers[i].hash.toString() == newTrans.hash.toString();
						if(fileAlreadyDropped)
							alert('The following file has already been dropped: "' + file.name + '"'); // Pop-up a message which tells the user he's trying to upload a file that has already been dropped
					}
					if (!fileAlreadyDropped) { // If the file isn't already dropped
						$rootScope.transfers.push(newTrans); // Pushing into array
						console.debug($rootScope.transfers);
						$("#fileTransfersView").scope().changePage(1);
						/*$scope.$apply(function () { // Applying changes
							$scope.changePage(currentPage); // Change displayed transfers (by changing page)
						});*/
					}
				};
			});
		}
		else {
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
				/*var fileAlreadyDropped = false; // Indicates if a file has already been dropped
				for (var i = 0; i < transfersScope.transfers.length; i++) { // Going through all files (already dropped)
					if (transfersScope.transfers[i].hash.toString() == newTrans.hash.toString()) { // If the file hash is the same as the hash of the file that has already been dropped
						fileAlreadyDropped = true; // This file has already been dropped, so don't transfer it
						alert('The following file has already been dropped: "' + file.name + '"'); // Pop-up a message which tells the user he's trying to upload a file that has already been dropped
						i = transfersScope.transfers.length; // Out of the loop
					}
				}
				if (!fileAlreadyDropped) { // If the file isn't dropped yet
					transfersScope.pushTransfer(newTrans); // Push it into transfers list
				}*/
			};
		}
	};
}]);
angular.module('data-transfer', ['ngResource', 'ui.bootstrap']); // Creation of the main module of the framework
;
angular.module('data-transfer')

	.factory('browserDetectionService', function () {
		return {
			isChrome: function () {
				var chrome,
					// Code copied from internet (http://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome)	
					isChromium = window.chrome,
					winNav = window.navigator,
					vendorName = winNav.vendor,
					isOpera = winNav.userAgent.indexOf("OPR") > -1,
					isIEedge = winNav.userAgent.indexOf("Edge") > -1,
					isIOSChrome = winNav.userAgent.match("CriOS"),
					message = document.getElementById("dropMessage");

				if (isIOSChrome) {
					chrome = true;
				} else if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isIEedge === false) {
					chrome = true;
				} else {
					chrome = false;
				}

				return chrome;
			}
		};
	});
;
angular.module('data-transfer')

	.factory('configService', function () {
		var settings; // Object that stores all settings
		// Ajax request to settings.json file. Get settings in json format
		$.ajax({
			url: '/dataTransfer/src/js/settings.json',
			async: false,
			dataType: 'json',
			success: function (response) {
				settings = response;
			}
		});

		return {
			// Function that returns if the dropped file should upload automatically (boolean)
			getAutoStart: function () {
				return settings.autoStart;
			},
			// Function that returns the number of time a failed upload should retry automatically (number)
			getAutoRetriesQty: function () {
				return settings.autoRetriesQty;
			},
			// Function that returns the number of transfers that can run at the same time (number)
			getConcurentTransfersQty: function () {
				return settings.concurentTransfersQty;
			},
			// Function that returns URL of the API endpoint (string)
			getApiEndpointURL: function () {
				return settings.apiEndpointURL;
			},
			// Function that returns the number of transfers that are displayed on the same page in the view (number)
			getDisplayedTransfersQty: function () {
				return settings.displayedTransfersQty;
			}
		};
	});
;
angular.module('data-transfer')

	.factory('mockService', ['$timeout', function ($timeout) {
		var transfers = []; // Array of transfers
		return {
			// Function that uploads a file
			uploadFile: function (file) {
				transfers.push(file); // Add the file to the transfers array
				var prog = file.prog; // Progress 
				var time;
				if (file.time !== undefined) {
					time = file.time; // Elapsed time of the upload 
				}
				else {
					time = 0;
				}
				var complete = false; // Indicates if the upload is complete
				var timeout; // Duration of the upload (changes depending to the name of the file)
				var finishedSent = false; // Indicates if finished event has been sent. Allows to send it only once.
				var status; // Status which is set depending to the name of the file

				// Events
				var progress = $.Event('progress'); // Sent every 100ms to update progress
				var finished = $.Event('complete'); // Sent when upload is complete (when time = timeout)

				// Interval that executes a function each 100 ms
				var interval = setInterval(function () {
					var index = transfers.lastIndexOf(file); // Get the index of the file in transfers array
					if (index !== -1) { // If file exists in array
						if (file.status === 'Failed') { // If the up has failed (retry)
							file.status = 'Pending'; // Status is now pending
						}
						if (transfers[index].status === 'Queued') { // If the upload has not been started yet
							time = 0; // Set time to 0
						}
						if (transfers[index].status === 'Pending') { // If the upload is pending (running)
							time += 100; // 100 ms seconds has passed sinces last interval
						}
						prog = (time / timeout) * 100; // Progress in percent
						progress.prog = prog; // Affect this progress to the event
						progress.file = file; // Affect the file to the event
						progress.elapsedTime = time / 1000 + ' s'; // Elapsed time (in seconds)
						progress.time = time;
						complete = time > timeout; // Check if upload is complete
						progress.remainingTime = (timeout - time) / 1000 + ' s'; // Remaining time is timeout - time (in seconds)
						progress.state = transfers[index].status; // State of the progress event is the status of the running transfer
						if (!complete) { // If transfer is not complete
							$(window).trigger(progress); // Trigger the progress event
						}
						// If upload is complete
						else if (!finishedSent) { // And finished event hadn't been sent 
							finished.state = status; // Set state of the finished event
							finished.file = file; // Set the file that is concerned by this event
							index = transfers.indexOf(file); // Index of the file in the transfers array
							transfers.splice(index, 1); // Remove file from transfers array
							finishedSent = true; // Finished event has been sent
							clearInterval(interval); // Clear this interval
							$(window).trigger(finished); // Trigger the finished event
						}
					}
				}, 100);

				// Check if the name of the file contains 'success'
				if (file.name.indexOf('success') !== -1) {
					timeout = 2000; // Set timeout to 2 seconds
					status = 'Succeeded'; // Status is Succeeded
				}
				// Check if the name of the file contains 'error'
				else if (file.name.indexOf('error') !== -1) {
					timeout = 3000; // Set timeout to 3 seconds
					status = 'Failed'; // Status is Failed
				}
				// If the name of the file contains neither 'succes' or 'error'
				else {
					timeout = 5000; // Set timeout to 5 seconds
					status = 'Failed'; // Status is Failed
				}
			},
			// Function that suspends the upload
			pause: function (trans) {
				var index = transfers.indexOf(trans); // Get the index of the file in the transfers array
				transfers[index].status = 'Paused'; // Set status to Paused
			},
			// Function that resumes the upload
			resume: function (trans) {
				var index = transfers.indexOf(trans); // Get the index of the file in the transfers array
				if (index !== -1) {
					transfers[index].status = 'Pending'; // Set status to Pending
				}
				else {
					trans.status = 'Pending';
					this.uploadFile(trans);
				}
			},
			// Function that stops the upload
			stop: function (trans) {
				var index = transfers.indexOf(trans); // Get the index of the file in the transfers array
				if (index !== -1) {
					transfers[index].status = 'Queued'; // Set status to Queued
				}
				else {
					trans.status = 'Queued';
					trans.time = 0;
					trans.prog = 0;
					trans.elapsedTime = '';
					trans.remainingTime = '';
				}
			}
		};
	}]);
;
angular.module('data-transfer')

	.factory('serviceFactory', ['uploadService', 'mockService', function (uploadService, mockService) {

		return {
			// Function that returns either mockService or uploadService, depending on the value of service argument
			getService: function (service) {
				var returnedService = {}; // Service that will be returned
				switch (service) {
					case 'mock': // If the parameter is 'mock'
						returnedService = mockService; // Return mockService
						break;
					case 'upload': // If the parameter is 'upload'
						returnedService = uploadService; // Return uploadService
						break;
					default: // In each other case
						returnedService = mockService; // Return mockService
						break;
				}

				return returnedService;
			}
		};
	}]);
;
angular.module('data-transfer')

	.factory('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {
		var service = serviceFactory.getService('upload'); // Service used to upload files ('mock' or 'upload')
		var transfers = []; // Array that contains all transfers
		var transfersVM = []; // Transfers ViewModels
		var runningTransfers = []; // Array that contains all transfers that are running
		var concurentTransfers = configService.getConcurentTransfersQty(); // Get the number of transfers that can run at the same time
		var transfersCompleted = 0; // Number of completed transfers

		// Function that starts a transfer
		function run(file) {
			var index = transfers.indexOf(file);
			var transVM = transfersVM[index];
			transVM.status = 'Pending';
			transVM.prog = 100;
			service.uploadFile(file); // Upload the file in the service
		}

		// Event triggered when the user enters the page
		// Loads transfers to run
		/*$(document).ready(function () {
			transfers = JSON.parse(localStorage.getItem('transfers'));
			for (var i = 0; i < transfers.length; i++) {
				if (transfers[i].status == 'Paused') {
					runningTransfers.push(transfers[i]);
					if (configService.getAutoStart()) {
						run(transfers[i]);
					}
				}
			}
			var loaded = $.Event('loaded');
			$(window).trigger(loaded);
		});
*/
		// Progress event sent by the service (mock or upload)
		$(window).on('progress', function (e) {
			// Search the corresponding transfer in transfers array
			for (var i = 0; i < transfersVM.length; i++) {
				var currentTransfer = transfersVM[i];
				if (currentTransfer === e.file) { // If corresponding
					currentTransfer.status = e.state; // Set transfer status
					currentTransfer.prog = e.prog; // Set transfer progress (to display the progressBar)
					currentTransfer.time = e.time;
					i = transfersVM.length; // Out of the loop
				}
			}
		});

		// Event triggered when the user exits the page
		// Save currently running transfers or queued transfers
		window.onbeforeunload = function (e) {
			var transfersToSave = [];
			for (var i = 0; i < transfers.length; i++) {
				if (transfers[i].status !== 'Succeeded') {
					if (transfers[i].status == 'Pending') {
						transfers[i].status = 'Paused';
					}
					transfersToSave.push(transfers[i]);
				}
			}

			// localStorage.setItem('transfers', JSON.stringify(transfersToSave));
			//localStorage.setItem('transfers', '[]');
		};

		// Event triggered by the service when an upload is finished
		$(window).on('complete', function (e) {
			var index = transfers.indexOf(e.file); // Get the index of the file in the transfers array
			var trans = transfers[index]; // Get the file in the transfers (trans is shorter than transfers[index])
			var transVM = transfersVM[index];
			if (e.state == 'Failed') { // If upload has failed
				if (transVM.autoRetries < configService.getAutoRetriesQty()) { // Check if the limit of autoRetries hasn't been reached
					transVM.autoRetries++; // Incerment autoRetries counter of this file
					transVM.status = 'Queued'; // Status is Queued, so the service knows it should restart the upload of this file from the beginning
					transVM.prog = 0;
					transVM.time = 0;
					run(trans); // Run the transfer
				}
				else { // If the limit of autoRetries has been reached
					transVM.status = e.state;
					runningTransfers.splice(index, 1); // Remove failed transfer from running transfers array
					if (configService.getAutoStart()) {
						// Look for the next queued transfer in the transfers array
						for (var transfersCount = 0; transfersCount < transfers.length; transfersCount++) {
							if (transfers[transfersCount].status === 'Queued') {
								run(transfers[transfersCount]); // Run this transfer
								transfersCount = transfers.length; // Out of the loop
							}
						}
					}
				}
			}
			else if (e.state == 'Succeeded') { // If upload has succeeded
				transVM.status = e.state;
				var offset = concurentTransfers - 1; // Offset for the index to get the next transfer
				transfersCompleted++; // Incerment the counter of completed transfers
				if (transfersCompleted < transfers.length - offset) { // If there is still queued transfers
					runningTransfers.splice(index, 1); // Remove succeeded transfer from running transfers array
					if (configService.getAutoStart()) { // If upload should start automatically
						runningTransfers.push(transfers[transfersCompleted + offset]); // Add next queued transfer to running transfers array
						run(transfers[transfersCompleted + offset]); // Run this transfer
					}
				}
			}
		});

		// Object returned by transfersService 
		return {
			// Function that adds a transfer to the transfers array
			pushTransfer: function (trans, file) {
				trans.autoRetries = 0; // The transfer hasn't been retried yet
				trans.prog = 0;
				transfers.push(file); // Add transfer
				transfersVM.push(trans);
				if (configService.getAutoStart()) { // If it should start automatically
					if (runningTransfers.length < concurentTransfers) { // If the limit of concurent transfers is not reached
						runningTransfers.push(file); // Add the transfer to the running transfers array
						// TODO: Run with 'file' object instead of trans
						run(file); // Run the transfer
					}
				}
			},
			// Function that returns all transfers (array)
			getTransfers: function () {
				return transfersVM;
			},
			// Start upload
			start: function (trans) {
				var index = transfersVM.indexOf(trans);
				var file = transfers[index];
				if (!configService.getAutoStart()) { // If transfer should not start automatically
					if (runningTransfers.length < concurentTransfers && trans.status === 'Queued') { // If transfer is queued and concurent transfers limit is not reached
						runningTransfers.push(trans); // Add transfer to transfers array
						run(file); // Run transfer
					}
					else if (runningTransfers.length <= concurentTransfers && trans.status === 'Paused') { // If transfer is paused and concurent transfers limit is exceeded
						service.resume(file); // Resume transfer
					}
				}
				else { // If transfer should run automatically
					if (trans.status === 'Queued' || trans.status === 'Failed') { // If transfer is queued or failed
						trans.prog = 0;
						trans.time = 0;
						run(file); // Run transfer
					}
					else if (trans.status === 'Paused') { // If transfer is paused
						service.resume(file); // Resume transfer
					}
				}
			},
			// Function that supsends transfer
			pause: function (trans) {
				service.pause(trans);
			},
			// Function that stops transfer
			stop: function (trans) {
				var index = runningTransfers.indexOf(trans); // Get the index in running transfers
				if (trans.status === 'Pending') {
					runningTransfers.splice(index, 1); // Remove transfer from running transfers array
				}
				service.stop(trans); // Stop transfer
			}
		};
	}]); 
;
angular.module('data-transfer')

	.factory('uploadService', ['$resource', '$http', 'configService', function ($resource, $http, configService) {
		var acceptedExtensions = ['*'];
		var url = configService.getApiEndpointURL();
		return {
			uploadFile: function (file) {

				var uploadFormData = new FormData();
				uploadFormData.append('file', file);
				$http.defaults.headers.common.Authorization = 'Basic ZGVtb0B2aXJ0dWFsc2tlbGV0b24uY2g6ZGVtbw==';

				$http.post(url, uploadFormData, {
					transformRequest: angular.identity,
					headers: { 'Content-Type': undefined }
				})
				.success(function (response) {
					var finished = $.Event('complete'); // Sent when upload is complete (when time = timeout)
					finished.file = file;
					finished.state = 'Succeeded';
					$(window).trigger(finished); // Trigger the finished event
				})
				.error(function (response) {
					var finished = $.Event('complete'); // Sent when upload is complete (when time = timeout)
					finished.file = file;
					finished.state = 'Failed';
					$(window).trigger(finished); // Trigger the finished event
				});
			},
			pause: function(){},
			stop: function(){}
		};
	}]);
;
angular.module('data-transfer')

	.controller('dropController', ['$scope', 'browserDetectionService', 'transfersService', function ($scope, browserDetectionService, transfersService) {
		var isChrome = browserDetectionService.isChrome(); // Check if user uses Chromr or another compatible browser
		// Display the message in the drop zone
		if (isChrome) { 
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

		// onDrop event of the dropZone
		dropZone.ondrop = function (ev) {
			ev.preventDefault(); // Prevent dropped file to be openned in the browser
			var droppedFiles = isChrome ? ev.dataTransfer.items : ev.dataTransfer.files; // Dropped files array affected depending on the browser
			if (isChrome) {
				for (var entryCnt = 0; entryCnt < droppedFiles.length; entryCnt++) {
					var droppedFile = droppedFiles[entryCnt];
					var entry = droppedFile.webkitGetAsEntry(); // Get dropped item as an entry (which can be either a file or a directory)
					if (entry.isFile) { // If it's a file
						$scope.readFile(entry); // Read it as text
					}
					else if (entry.isDirectory) { // If it's a directory
						$scope.scanDirectory(entry); // Scan it
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

		// Function that scans the directory recursively, until it contains only files
		$scope.scanDirectory = function (item) {
			var directoryReader = item.createReader(); // A directory reader is needed to scan the directory

			directoryReader.readEntries(function (entries) { // Read all entries of the directory (can be file or directory)
				entries.forEach(function (entry) { // Go through all entries
					if (entry.isDirectory) { // If it's a directory
						$scope.scanDirectory(entry); // Scan it (recursion)
					}
					else if (entry.isFile) { // If it's a file
						$scope.readFile(entry); // Read it as text
					}
				});
			});
		};

		$scope.readFile = function (file) {
			if (isChrome) {
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
						for (var i = 0; i < transfersService.getTransfers().length; i++) { // Going through all files (already dropped)
							fileAlreadyDropped = transfersService.getTransfers()[i].hash.toString() == newTrans.hash.toString();
							if (fileAlreadyDropped) {
								alert('The following file has already been dropped: "' + file.name + '"'); // Pop-up a message which tells the user he's trying to upload a file that has already been dropped
								i = transfersService.getTransfers().length;
							}
						}
						if (!fileAlreadyDropped) { // If the file isn't already dropped
							transfersService.pushTransfer(newTrans, file); // Pushing into array
							$scope.$apply(function () { // Applying changes
								$("#fileTransfersView").scope().changePage(0); // Change displayed transfers (by changing page)
								$("#fileTransfersView").scope().definePagination(); // Define and display the pagination
							});
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
					var fileAlreadyDropped = false; // Indicates if a file has already been dropped
					for (var i = 0; i < transfersService.getTransfers().length; i++) { // Going through all files (already dropped)
						fileAlreadyDropped = transfersService.getTransfers()[i].hash.toString() == newTrans.hash.toString();
						if (fileAlreadyDropped) {
							alert('The following file has already been dropped: "' + file.name + '"'); // Pop-up a message which tells the user he's trying to upload a file that has already been dropped
							i = transfersService.getTransfers().length;
						}
					}
					if (!fileAlreadyDropped) { // If the file isn't already dropped
						transfersService.pushTransfer(newTrans, file); // Pushing into array
						$scope.$apply(function () { // Applying changes
							$("#fileTransfersView").scope().changePage(0); // Change displayed transfers (by changing page)
							$("#fileTransfersView").scope().definePagination(); // Define and display the pagination
						});
					}
				};
			}
		};
	}]);
;
angular.module('data-transfer')

	.controller('viewController', ['$scope', 'configService', 'transfersService', function ($scope, configService, transfersService) {
		$scope.displayedTransfers = []; // Transfers that are displayed in the view (size milited in the settings and content changes each times user changes page in the view)
		$scope.page = ''; // Name of the page (in the application)
		$scope.pageCount = 0; // Number of pages in the view 
		$scope.currentPage = 1; // Current page in the view

		// $(window).on('loaded', function () {
		var transfers = transfersService.getTransfers(); // All transfers (from transfersService)
		// $scope.definePagination();
		// $scope.changePage(1);
		// 	$scope.$apply();
		// });

		// Progress event sent by the service (mock or upload)
		$(window).on('progress', function (e) {
			// Search the corresponding transfer in transfers array
			for (var i = 0; i < transfers.length; i++) {
				var currentTransfer = transfers[i];
				if (currentTransfer === e.file) { // If corresponding
					currentTransfer.status = e.state; // Set transfer status
					currentTransfer.prog = e.prog; // Set transfer progress (to display the progressBar)
					currentTransfer.time = e.time;
					currentTransfer.elapsedTime = e.elapsedTime; // Set elapsed time
					currentTransfer.remainingTime = e.remainingTime; // Set remaining time
					$scope.$apply(); // Apply changes to the scope. This is used to refresh the view
					i = transfers.length; // Out of the loop
				}
			}
		});

		// Complete event sent by the service (mock or upload)
		$(window).on('complete', function (e) {
			// Search the corresponding transfer in transfers array
			for (var i = 0; i < transfers.length; i++) {
				var currentTransfer = transfers[i];
				if (currentTransfer === e.file) { // If corresponding
					currentTransfer.status = e.state; // Set transfer status
					if (e.state === 'Failed') { // If the upload has failed
						currentTransfer.prog = 0; // Set progress to 0%
					}
					$scope.$apply(); // Apply changes to the scope. This is used to refresh the view
					i = transfers.length; // Out of the loop
				}
			}
		});

		// Function that starts the upload (Sent by clicking on the start button)
		$scope.start = function (trans) {
			transfersService.start(trans);
		};

		// Function that suspends the upload (Sent by clicking on the pause button)
		$scope.pause = function (trans) {
			transfersService.pause(trans);
		};

		// Function that stops the upload (Sent by clicking on the stop button)
		$scope.stop = function (trans) {
			transfersService.stop(trans);
		};

		// Function that changes the page of the table (by changing displayed transfers)
		// num: number of the page to display
		$scope.changePage = function (num) {
			if (num !== 0)
				currentPage = num; // Change currentPage
			$scope.displayedTransfers = []; // Flushing displayed transfers array
			var displayedQty = configService.getDisplayedTransfersQty();
			transfers = transfersService.getTransfers();
			// Loop that adds the correct number of transfers into the displayedTransfers array
			for (var i = 0, trans = (currentPage - 1) * 5; i < displayedQty; i++ , trans++) {
				if (transfers[trans] !== undefined) { // If the current transfer exist
					if ($scope.page != 'upload' || transfers[trans].transferType == 'Upload') { // Check conditions to display current transfer (page different than "upload" or transfer type is "Upload")
						$scope.displayedTransfers.push(transfers[trans]); // Affect the current displayedTransfer
					}
					else { // If transfer shouldn't be displayed
						i--; // Decrement i. It has for effect to stay at the same index in the display array
					}
				}
				else // If the transfer doesn't exisit
					i = displayedQty; // Go out of the loop
			}
		};

		$scope.definePagination = function () {
			var displayedQty = configService.getDisplayedTransfersQty();
			$scope.pageCount = (transfersService.getTransfers().length / displayedQty) + 1; // Calculate number of pages from number of transfers to display
			// init bootpag
			$('#page-selection').bootpag({
				total: $scope.pageCount,
				maxVisible: displayedQty,
				firstLastUse: true,
				first: '←',
				last: '→',
			})
				// When the user navigates in the pagination
				.on("page", function (event, num) {
					$scope.changePage(num); // Change the current page
					$scope.$apply(); // Apply changes to be displayed on the view
				});
			if ($scope.page != 'upload') // If the page is not "upload"
				$scope.defineBodyPadding(); // Define bottom padding of the body
		};

		// Function that defines the bottom padding of the body. The goal is to always have the body above the transfers view in home page
		$scope.defineBodyPadding = function () {
			var body = $("body"); // Get the body with jQuery		
			body.css("padding-bottom", fileTransfersView.css("height")); // Bottom padding is equals to transfers view height
		};

		var fileTransfersView = $("#fileTransfersView"); // Get the view with jQuery
		var imgChevronCollapse = $("#imgChevronCollapse"); // Get icon with jQuery
		$scope.definePagination();
		$scope.changePage(1);

		// Detects when the user click on the chevron icon of the transfers view
		imgChevronCollapse.on('click', function () {
			// Change the class to display an up or a down chevron (up when view is collapsed)
			if (imgChevronCollapse.hasClass("fa-chevron-down")) {
				imgChevronCollapse.removeClass("fa-chevron-down");
				imgChevronCollapse.addClass("fa-chevron-up");
			}
			else if (imgChevronCollapse.hasClass("fa-chevron-up")) {
				imgChevronCollapse.removeClass("fa-chevron-up");
				imgChevronCollapse.addClass("fa-chevron-down");
			}
		});

		// When the view is collapsed
		fileTransfersView.on("hidden.bs.collapse", function () {
			if ($scope.page != 'upload')
				$scope.defineBodyPadding();
		});

		// When the view is shown
		fileTransfersView.on("shown.bs.collapse", function () {
			if ($scope.page != 'upload')
				$scope.defineBodyPadding();
		});

		// Event that is emitted when the ng-repeat directive (which displays all transfers that must be displayed) has finish to display all transfers			
		$scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
			if ($scope.page != 'upload') // If the page isn't "upload"
				$scope.defineBodyPadding(); // Define the padding of the body
		});
	}])
	// Directive that fires an event when ng-repeat is finished
	// (found on the internet: http://stackoverflow.com/questions/15207788/calling-a-function-when-ng-repeat-has-finished)
	.directive('onFinishRender', function ($timeout) {
		return {
			restrict: 'A',
			link: function (scope, element, attr) {
				if (scope.$last === true) {
					$timeout(function () {
						scope.$emit(attr.onFinishRender);
					});
				}
			}
		};
	});
angular.module('data-transfer', ['ngResource']); // Creation of the main module of the framework
;
angular.module('data-transfer')

	.factory('browserDetectionService', function(){
		return {
			isChrome: function(){
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
		// var settings;
		// $.getJSON('../settings.json', function (json) {
		// 	settings = json;
		// });
		var settings = {
			"autoStart": "true",
			"autoRetriesQty": 3,
			"concurentTransfersQty": 1,
			"apiEndpointURL": "http://localhost:8080/api/upload",
			"displayedTransfersQty": 5
		};

		return {
			getAutoStart: function () {
				return settings.autoStart;
			},
			getAutoRetriesQty: function () {
				return settings.autoRetriesQty;
			},
			getConcurentTransfersQty: function () {
				return settings.concurentTransfersQty;
			},
			getApiEndpointURL: function () {
				return settings.apiEndpointURL;
			},
			getDisplayedTransfersQty: function () {
				return settings.displayedTransfersQty;
			}
		};
	});
;
angular.module('data-transfer')

	.factory('mockService', ['$timeout', function ($timeout) {
		var acceptedExtensions = ['*'];
		var pauseFiles = [];
		return {
			uploadFile: function (file, index) {
				if (pauseFiles.length > index) {
					pauseFiles[index] = false;
				}
				else {
					pauseFiles.push(false);
				}
				var prog = 0;
				var time = 0;
				var complete = false;
				var returnValue;
				var timeout;
				var finishedSent = false;
				var message;

				var progress = $.Event('progress');
				var finished = $.Event('complete');

				function intervalTrigger() {
					setInterval(function () {
						if (pauseFiles[index] === undefined) {
							progress.state = 'Queued';
							time = 0;
							progress.prog = 0;
							progress.file = file;
							progress.elapsedTime = time / 1000 + ' s';
							progress.remainingTime = (timeout - time) / 1000 + ' s';
						}
						else {
							if (!pauseFiles[index]) {
								time += 100;
								prog = (time / timeout) * 100;
								progress.prog = prog;
								progress.state = 'Pending';
								progress.file = file;
								progress.elapsedTime = time / 1000 + ' s';
								complete = time > timeout;
								progress.remainingTime = (timeout - time) / 1000 + ' s';
							}
							else
								progress.state = 'Paused';
						}
						if (!complete) {
							$(window).trigger(progress);
						}
						else if (!finishedSent) {
							finished.state = message == 'success' ? 'Succeeded' : 'Failed';
							finished.file = file;
							$(window).trigger(finished);
							finishedSent = true;
						}
					}, 100);
				}
				var interval = intervalTrigger();

				if (file.name.indexOf('success') !== -1) {
					timeout = 2000;
					message = 'success';
				}
				else if (file.name.indexOf('error') !== -1) {
					timeout = 3000;
					message = 'error';
				}
				else {
					timeout = 5000;
					message = 'error';
				}
			},
			pause: function (index) {
				pauseFiles[index] = true;
			},
			resume: function (index) {
				pauseFiles[index] = false;
			},
			stop: function (index) {
				pauseFiles[index] = undefined;
			}
		};
	}]);
;
angular.module('data-transfer')

.factory('serviceFactory', ['uploadService', 'mockService', function(uploadService, mockService){
	
	return {
		getService: function(service){
			var returnedService = {};
			switch (service) {
				case 'mock':
					returnedService = mockService;
					break;
				case 'upload':
					returnedService = uploadService;
					break;
				default:
					returnedService = mockService;
					break;
			}

			return returnedService;
		}
	};
}]);
;
angular.module('data-transfer')

	.factory('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {
		var service = serviceFactory.getService('mock');
		var transfers = [];

		function run(trans, index) {
			trans.status = 'Pending';
			service.uploadFile(trans, index);
		}

		return {
			pushTransfer: function (trans, index) {
				trans.id = index;
				transfers.push(trans);
				if (configService.getAutoStart()) {
					run(trans, index);
				}
			},
			getTransfers: function () {
				return transfers;
			},
			start: function (index) {
				var trans = transfers[index];
				if (trans.status == 'Queued')
					run(trans, index);
				else if (trans.status == 'Paused')
					service.resume(index);
			},
			pause: function (index) {
				service.pause(index);
			},
			stop: function(index) {
				service.stop(index);
			}
		};
	}]);
;
angular.module('data-transfer')

	.factory('uploadService', function () {
		var acceptedExtensions = ['*'];
		return {
			uploadFile: function (file) {
				console.debug("Upload file");
				console.debug(file);
			}
		};
	});
;
angular.module('data-transfer')

	.controller('dropController', ['$scope', 'browserDetectionService', 'transfersService', function ($scope, browserDetectionService, transfersService) {
		var isChrome = browserDetectionService.isChrome();
		if (isChrome) {
			document.getElementById("dropMessage").innerHTML = "Drag n'drop your files or folders here";
		}
		else {
			document.getElementById("dropMessage").innerHTML = "Drag n'drop your files here";
		}

		var dropZone = document.getElementById("dropZone");

		dropZone.ondragover = function (ev) {
			ev.preventDefault();
		};

		dropZone.ondrop = function (ev) {
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
							transfersService.pushTransfer(newTrans, transfersService.getTransfers().length); // Pushing into array
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
						transfersService.pushTransfer(newTrans); // Pushing into array
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
		$scope.displayedTransfers = [];
		$scope.page = '';
		$scope.pageCount = 0;
		$scope.currentPage = 1;
		var transfers = transfersService.getTransfers();

		$(window).on('progress', function (e) {
			for (var i = 0; i < transfers.length; i++) {
				var currentTransfer = transfers[i];
				if (currentTransfer === e.file) {
					currentTransfer.status = e.state;
					currentTransfer.prog = e.prog;
					currentTransfer.elapsedTime = e.elapsedTime;
					currentTransfer.remainingTime = e.remainingTime;
					$scope.$apply();
					i = transfers.length;
				}
			}
		});

		$(window).on('complete', function (e) {
			for (var i = 0; i < transfers.length; i++) {
				var currentTransfer = transfers[i];
				if (currentTransfer === e.file) {
					currentTransfer.status = e.state;
					$scope.$apply();
					i = transfers.length;
				}
			}
		});

		$scope.start = function (index) {
			transfersService.start(index);
		};

		$scope.pause = function (index) {
			transfersService.pause(index);
		};

		$scope.stop = function (index) {
			transfersService.stop(index);
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
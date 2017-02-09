/*! data-transfer 09.02.2017 */
angular.module('data-transfer', ['ui.bootstrap', 'ngResource', 'templates-dataTransfer']); // Creation of the main module of the framework
;
angular.module('data-transfer')

	.factory('browserDetectionService', function () {
		return {
			getBrowserInfo: function () {
				// Code found at http://www.javascripter.net/faq/browsern.htm
				var nVer = navigator.appVersion;
				var nAgt = navigator.userAgent;
				var browserName = navigator.appName;
				var fullVersion = '' + parseFloat(navigator.appVersion);
				var majorVersion = parseInt(navigator.appVersion, 10);
				var nameOffset, verOffset, ix;

				// In Opera 15+, the true version is after "OPR/" 
				if ((verOffset = nAgt.indexOf("OPR/")) != -1) {
					browserName = "Opera";
					fullVersion = nAgt.substring(verOffset + 4);
				}
				// In older Opera, the true version is after "Opera" or after "Version"
				else if ((verOffset = nAgt.indexOf("Opera")) != -1) {
					browserName = "Opera";
					fullVersion = nAgt.substring(verOffset + 6);
					if ((verOffset = nAgt.indexOf("Version")) != -1)
						fullVersion = nAgt.substring(verOffset + 8);
				}
				// In MSIE, the true version is after "MSIE" in userAgent
				else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
					browserName = "Microsoft Internet Explorer";
					fullVersion = nAgt.substring(verOffset + 5);
				}
				// In Chrome, the true version is after "Chrome" 
				else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
					browserName = "Chrome";
					fullVersion = nAgt.substring(verOffset + 7);
				}
				// In Safari, the true version is after "Safari" or after "Version" 
				else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
					browserName = "Safari";
					fullVersion = nAgt.substring(verOffset + 7);
					if ((verOffset = nAgt.indexOf("Version")) != -1)
						fullVersion = nAgt.substring(verOffset + 8);
				}
				// In Firefox, the true version is after "Firefox" 
				else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
					browserName = "Firefox";
					fullVersion = nAgt.substring(verOffset + 8);
				}
				// In most other browsers, "name/version" is at the end of userAgent 
				else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
					(verOffset = nAgt.lastIndexOf('/'))) {
					browserName = nAgt.substring(nameOffset, verOffset);
					fullVersion = nAgt.substring(verOffset + 1);
					if (browserName.toLowerCase() == browserName.toUpperCase()) {
						browserName = navigator.appName;
					}
				}
				// trim the fullVersion string at semicolon/space if present
				if ((ix = fullVersion.indexOf(";")) != -1)
					fullVersion = fullVersion.substring(0, ix);
				if ((ix = fullVersion.indexOf(" ")) != -1)
					fullVersion = fullVersion.substring(0, ix);

				majorVersion = parseInt('' + fullVersion, 10);
				if (isNaN(majorVersion)) {
					fullVersion = '' + parseFloat(navigator.appVersion);
					majorVersion = parseInt(navigator.appVersion, 10);
				}
				// End of copied code
				
				var webkit = detectWebKit();

				return {
					hasWebkit: webkit.iswebkit,
					webkitVersion: this.hasWebkit ? parseFloat(webkit.version) : null,
					name: browserName,
					version: majorVersion
				};
			}
		};
	});
;
angular.module('data-transfer')

	.factory('configService', function () {
		var settings; // Object that stores all settings
		// Ajax request to settings.json file. Get settings in json format
		$.ajax({
			url: '/dataTransfer/settings.json',
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
			getUploadURL: function () {
				return settings.baseURL + settings.uploadURL;
			},
			getFilesURL: function () {
				return settings.baseURL + settings.filesURL;
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
				transfers[transfers.length -1].status = 'Queued';
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
						if (transfers[index].status === 'Failed' || transfers[index].status === 'Queued') { // If the up has failed (retry)
							transfers[index].status = 'Pending'; // Status is now pending
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
						else {
							if (!finishedSent) { // And finished event hadn't been sent 
								finished.state = status; // Set state of the finished event
								finished.file = file; // Set the file that is concerned by this event
								finished.service = 'mock';
								index = transfers.indexOf(file); // Index of the file in the transfers array
								transfers.splice(index, 1); // Remove file from transfers array
								finishedSent = true; // Finished event has been sent
								clearInterval(interval); // Clear this interval
								$(window).trigger(finished); // Trigger the finished event
							}
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

	.factory('transfersService', ['serviceFactory', 'configService', '$http', function (serviceFactory, configService, $http) {

		var files = [];
		var autoRetries = [];
		var filePushed = $.Event('filePushed');
		var service = serviceFactory.getService('upload');
		var transfersToRun = [];
		var runningTransfers = [];
		var concurentTransfers = configService.getConcurentTransfersQty(); // Get the number of transfers that can run at the same time
		var transfersCompleted = 0; // Number of completed transfers
		var zipResponse = false;

		var run = $.Event('run');
		run.state = 'Pending';

		//--------------------------------------------------------------------------------------
		// Request for the storage space
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		window.storageInfo = window.storageInfo || window.webkitStorageInfo;

		// Request access to the file system
		var fileSystem = null,         // DOMFileSystem instance
			fsType = PERSISTENT,       // PERSISTENT vs. TEMPORARY storage
			fsSize = 10 * 1024 * 1024; // size (bytes) of needed space

		window.storageInfo.requestQuota(fsType, fsSize, function (gb) {
			window.requestFileSystem(fsType, gb, function (fs) {
				fileSystem = fs;
			}, errorHandler);
		}, errorHandler);

		//------------------------------------------------------------------------------------------
		// Error handler
		function errorHandler(e) {
			var msg = '';

			switch (e.code) {
				case FileError.QUOTA_EXCEEDED_ERR:
					msg = 'QUOTA_EXCEEDED_ERR';
					break;
				case FileError.NOT_FOUND_ERR:
					msg = 'NOT_FOUND_ERR';
					break;
				case FileError.SECURITY_ERR:
					msg = 'SECURITY_ERR';
					break;
				case FileError.INVALID_MODIFICATION_ERR:
					msg = 'INVALID_MODIFICATION_ERR';
					break;
				case FileError.INVALID_STATE_ERR:
					msg = 'INVALID_STATE_ERR';
					break;
				default:
					msg = 'Unknown Error';
					break;
			}

			console.log('Error: ' + msg);
		}

		//-------------------------------------------------------
		// Download file function
		function downloadFile(url, name, success) {
			var xhr = new XMLHttpRequest();
			var ms = 0;
			xhr.open('GET', url, true);
			xhr.responseType = "blob";
			window.setInterval(function () {
				ms += 100;
			}, 100);
			xhr.onprogress = function (e) {
				var percentComplete = e.loaded / e.total * 100;
				var progress = $.Event('progress');
				progress.progress = percentComplete;
				progress.loaded = e.loaded;
				progress.elapsedTime = ms;
				progress.size = e.total;
				progress.file = name;
				$(window).trigger(progress);
			};
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					zipResponse = xhr.response.type === 'application/zip';
					if (success) success(xhr.response);
					var finished = $.Event('finished');
					finished.state = 'Succeeded';
					finished.filename = name;
					$(window).trigger(finished);
				}
			};
			xhr.send(null);
		}

		//------------------------------------------------------
		// Save file function
		function saveFile(data, path) {
			if (!fileSystem) return;

			fileSystem.root.getFile(path, { create: true }, function (fileEntry) {
				fileEntry.createWriter(function (writer) {
					writer.write(data);
				}, errorHandler);
			}, errorHandler);
		}

		// Event triggered by the service when an upload is finished
		$(window).on('complete', function (e) {
			var finished = $.Event('finished');
			finished.file = e.file;
			finished.service = e.service;
			finished.state = e.state;
			runningTransfers.splice(index, 1); // Remove succeeded transfer from running transfers array
			var index = transfersToRun.indexOf(e.file); // Get the index of the file in the transfers array
			var offset = concurentTransfers - 1; // Offset for the index to get the next transfer
			if (e.state === 'Succeeded') { // If upload has succeeded
				transfersToRun.splice(index, 1);
				$(window).trigger(finished);
				transfersCompleted++; // Incerment the counter of completed transfers
				if (transfersCompleted < files.length - offset) { // If there is still queued transfers
					if (configService.getAutoStart()) { // If upload should start automatically
						runningTransfers.push(files[transfersCompleted + offset]); // Add next queued transfer to running transfers array
						service.uploadFile(files[transfersCompleted + offset]); // Run this transfer
						run.file = files[transfersCompleted + offset];
						$(window).trigger(run);
					}
				}
			}
			else if (e.state === 'Failed') {
				if (autoRetries[index] < configService.getAutoRetriesQty()) {
					service.uploadFile(e.file);
					e.state = 'Pending';
					run.state = e.state;
					run.file = e.file;
					$(window).trigger(run);
					autoRetries[index]++;
				}
				else {
					transfersToRun.splice(index, 1);
					transfersCompleted++;
					if (configService.getAutoStart() && transfersCompleted + offset < files.length) {
						service.uploadFile(files[transfersCompleted + offset]); // Run this transfer
						run.file = files[transfersCompleted + offset];
						$(window).trigger(run);
					}
					$(window).trigger(finished);
				}
			}
		});

		return {
			pushFile: function (file) {
				files.push(file);
				autoRetries.push(0);
				filePushed.status = configService.getAutoStart() ? 'Pending' : 'Queued';
				filePushed.file = file;
				$(window).trigger(filePushed);
				if (configService.getAutoStart()) {
					this.start(file);
				}
			},
			getFiles: function () {
				return files;
			},
			removeFile: function (file) {
				var index = files.indexOf(file);
				files.splice(index, 1);
				transfersToRun.splice(index, 1);
				runningTransfers.splice(index, 1);
				transfersCompleted = 0;
				var remove = $.Event('remove');
				remove.index = index;
				$(window).trigger(remove);
			},
			start: function (file) {
				autoRetries[files.indexOf(file)] = 0;
				if (runningTransfers.length < concurentTransfers) {
					transfersToRun.push(file);
					runningTransfers.push(file);
					service.uploadFile(file);
					run.file = file;
					$(window).trigger(run);
				}
			},
			getRunningTransfers: function () {
				return runningTransfers;
			},
			download: function (url, name) {
				var dl = $.Event('download');
				dl.fileName = name;
				$(window).trigger(dl);
				downloadFile(url, name, function (blob) {
					saveAs(blob, zipResponse ? name + '.zip' : name);
				});
			}
		};
	}]);
;
angular.module('data-transfer')

	.factory('uploadService', ['$http', '$resource', 'configService', function ($http, $resource, configService) {
		var url = configService.getUploadURL();
		return {
			uploadFile: function (file) {
				var uploadFormData = new FormData();
				uploadFormData.append('file', file);

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
			}
		};
	}]);
;
angular.module('data-transfer')

	.directive('dtDropZone', function () {
		return {
			restrict: 'E',
			templateUrl: 'js/directives/templates/dropZone.tpl.html'
		};
	});
;
angular.module('data-transfer')

	.directive('dtTransfersView', function () {
		return {
			restrict: 'E',
			scope: {
				page: '='
			},
			templateUrl: 'js/directives/templates/transfersView.tpl.html'
		};
	});
;
angular.module('data-transfer')

	.controller('dropController', ['$scope', 'browserDetectionService', 'transfersService', function ($scope, browserDetectionService, transfersService) {
		var browserInfo = browserDetectionService.getBrowserInfo();
		var webkit = browserInfo.hasWebkit;
		var hashes = [];
		// Display the message in the drop zone
		if (webkit) {
			document.getElementById("dropMessage").innerHTML = "Drag n'drop your files or folders here";
		}
		else {
			document.getElementById("dropMessage").innerHTML = "Drag n'drop your files here";
		}

		$(window).on('remove', function (e) {
			hashes.splice(e.index, 1);		
		});

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
;
angular.module('data-transfer')

	.controller('viewController', ['$scope', 'configService', 'transfersService', function ($scope, configService, transfersService) {

		var files = [];
		var filesVM = [];
		$scope.runningTransfers = [];
		$scope.displayedTransfers = [];
		$scope.selectedTransfers = [];
		$scope.failedTransfers = [];
		var currentPage = 1;
		$scope.allSelected = false;
		var selectedTransfersCompleted = 0;
		var failedTransfersRetried = 0;
		$scope.areTransfersRunning = false;

		$(window).on('download', function (e) {
			console.debug(e);
			var newFileVM = {
				name: e.fileName,
				transferType: 'Download',
				status: 'Pending',
				prog: 0,
				selected: false
			};
			filesVM.push(newFileVM);
			console.debug(newFileVM);
			$scope.runningTransfers.push(newFileVM);
			$scope.definePagination();
			$scope.changePage(currentPage);
		});

		$(window).on('filePushed', function (e) {
			files.push(e.file);
			$scope.runningTransfers = transfersService.getRunningTransfers();
			var sta = 'Queued';
			for (var i = 0; i < $scope.runningTransfers.length; i++) {
				if ($scope.runningTransfers[i].name == e.file.name) {
					sta = 'Pending';
					i = $scope.runningTransfers.length;
				}
			}
			var newFileVM = {
				name: e.file.name,
				size: e.file.size,
				displaySize: function () {
					var cptDiv = 0;
					var size = this.size;
					while (size > 1024) {
						size /= 1024;
						cptDiv++;
					}
					return (Number((size).toFixed(0))) + (cptDiv == 2 ? ' MB' : cptDiv == 1 ? ' KB' : ' B');
				},
				status: sta,
				transferType: 'Upload',
				selected: false
			};
			filesVM.push(newFileVM);
			$scope.definePagination();
			$scope.changePage(currentPage);
			$scope.$apply();
		});

		$(window).on('run', function (e) {
			var index = files.indexOf(e.file);
			filesVM[index].status = e.state;
		});

		$(window).on('progress', function (e) {
			var index = filesVM.indexOf(filesVM.filter(function (f) {
				return f.name === e.file;
			})[0]); // Get the index of the file in the transfers array
			console.debug(e);
			filesVM[index].prog = Number((e.progress).toFixed(2));
			var progressRemaining = 100 - filesVM[index].prog;
			filesVM[index].remainingTime = ((e.elapsedTime / e.progress) * progressRemaining) / 1000;
			filesVM[index].elapsedTime = e.elapsedTime / 1000;
			var loaded = e.loaded;
			filesVM[index].speed = (e.loaded / e.elapsedTime) / 1024;
			filesVM[index].displaySize = function () {
				var cptDiv = 0;
				var size = e.size;
				while (size > 1024) {
					size /= 1024;
					cptDiv++;
				}
				return (Number((size).toFixed(0))) + (cptDiv == 2 ? ' MB' : cptDiv == 1 ? ' KB' : ' B');
			};
			$scope.definePagination();
			$scope.changePage(currentPage);
			$scope.$apply();
		});

		$(window).on('finished', function (e) {
			var index;
			if (e.file !== undefined) {
				index = files.indexOf(e.file); // Get the index of the file in the transfers array
			}
			else if (e.filename !== undefined) {
				index = filesVM.indexOf(filesVM.filter(function (f) {
					return f.name === e.filename;
				})[0]);
			}
			var offset = 0;
			if ($scope.selectedTransfers.length > 0) {
				if ($scope.selectedTransfers.indexOf(filesVM[index]) > -1) {
					offset = selectedTransfersCompleted + configService.getConcurentTransfersQty();
					selectedTransfersCompleted++;
					if (offset < $scope.selectedTransfers.length) {
						$scope.start($scope.selectedTransfers[offset]);
					}
				}
			}
			if ($scope.failedTransfers.length > 0) {
				if ($scope.failedTransfers.indexOf(filesVM[index]) > -1) {
					offset = failedTransfersRetried + configService.getConcurentTransfersQty();
					failedTransfersRetried++;
					if (offset < $scope.failedTransfers.length) {
						$scope.start($scope.failedTransfers[offset]);
					}
				}
			}
			filesVM[index].status = e.state;
			$scope.definePagination();
			$scope.changePage(currentPage);
			$scope.failedTransfers = filesVM.filter(function (t) {
				return t.status === 'Failed';
			});
			$scope.areTransfersRunning = filesVM.filter(function (t) {
				return t.status === 'Pending';
			}).length > 0;
			if (e.service === 'mock' || filesVM[index].transferType === 'Download') {
				$scope.$apply();
			}
		});

		$scope.toggle = function (transfer) {
			transfer.selected = !transfer.selected;
			$scope.selectedTransfers = $scope.displayedTransfers.filter(function (t) {
				return t.selected;
			});
		};

		$scope.toggleAll = function () {
			if ($scope.selectedTransfers.length === $scope.displayedTransfers.length) {
				$scope.displayedTransfers.forEach(function (t) {
					if (t.selected) {
						$scope.toggle(t);
					}
				});
			}
			else {
				$scope.displayedTransfers.forEach(function (t) {
					if (!t.selected) {
						$scope.toggle(t);
					}
				});
			}
			$scope.selectedTransfers = $scope.displayedTransfers.filter(function (t) {
				return t.selected;
			});
		};

		$scope.delete = function () {
			$scope.selectedTransfers.forEach(function (t) {
				var index = filesVM.indexOf(t);
				transfersService.removeFile(files[index]);
				filesVM.splice(index, 1);
				files.splice(index, 1);
			});
			$scope.failedTransfers = filesVM.filter(function (t) {
				return t.status === 'Failed';
			});
			$scope.selectedTransfers = [];
			selectedTransfersCompleted = 0;
			failedTransfersRetried = 0;
			$scope.definePagination();
			$scope.changePage(currentPage);
		};

		$scope.start = function (trans) {
			var index = filesVM.indexOf(trans);
			transfersService.start(files[index]);
		};

		$scope.startSelected = function () {
			$scope.selectedTransfers.forEach(function (t) {
				$scope.start(t);
			});
		};

		$scope.retryFailed = function () {
			$scope.failedTransfers.forEach(function (t) {
				$scope.start(t);
			});
		};

		// Function that changes the page of the table (by changing displayed transfers)
		// num: number of the page to display
		$scope.changePage = function (num) {
			if (num !== 0)
				currentPage = num; // Change currentPage
			$scope.displayedTransfers = []; // Flushing displayed transfers array
			var displayedQty = configService.getDisplayedTransfersQty();
			transfers = filesVM;
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
			$scope.pageCount = (filesVM.length / displayedQty) + 1; // Calculate number of pages from number of transfers to display
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
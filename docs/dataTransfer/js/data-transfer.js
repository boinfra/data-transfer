/*! data-transfer 21.02.2017 */
angular.module('dt-download', [])
	.service('downloadService', ['configService', function (configService) {
		/** Array that contains all XMLHttpRequests */
		var xhrArray = [];

		return {
			/**
			 * @callback downloadFinishedCallback
			 * @param {string} filename name of the file
			 * @param {string} state status of the transfer (Succeeded or Failed)
			 * @param {string} msg message displayed to inform the user about the error
			 */
			/**
			 * @callback downloadProgressCallback
			 * @param {number} progress progress percentage of the download
			 * @param {number} loaded amount of data loaded
			 * @param {number} elapsedTime time elapsed since the behinning of the download
			 * @param {number} size size of the file to download
			 * @param {string} filename name of the file to download
			 */
			/**
			 * Downloads the file that have the specified file name at the specified URL
			 * @param {string} filename Name of the file to download
			 * @param {string} url url of the API endpoint to call to download the file
			 * @param {downloadFinishedCallback} finishedCallback callback function when download is finished
			 * @param {downloadProgressCallback} progressCallback callback function called when progress event is triggered
			 */
			download: function (filename, url, finishedCallback, progressCallback) {
				var ms = 0; // Elapsed time counter
				// 100 ms interval to increment counter
				window.setInterval(function () {
					ms += 100;
				}, 100);
				// Http request that calls the API to download a file
				var xhr = new XMLHttpRequest();
				xhr.aborted = false;
				xhr.open('GET', url); // Open request
				xhr.responseType = 'blob'; // Response type is blob
				xhr.onprogress = function (e) { // Progress event of the request
					var progress = e.loaded / e.total * 100; // Percentage
					progressCallback(progress, e.loaded, ms, e.total, filename);
				};
				xhr.onloadend = function () { // End of request event
					if (xhr.readyState === 4 && !xhr.aborted) { // If request state is 'Done'
						var status = '';
						var errorMessage = '';
						if (xhr.status < 400) { // If the http status is not error
							var zipResponse = false;
							zipResponse = xhr.response.type === 'application/zip'; // Check if the file is a zipped file (the VSD API sends zipped file, but some other API would not)
							saveAs(xhr.response, zipResponse ? filename + '.zip' : filename); // Download the file in the user's file system (uses saveAs function of FileSaver.js)
							status = 'Succeeded';
							finishedCallback(filename, status, errorMessage);
						}
						else { // If the status if error
							status = 'Failed'; // Transfer status is failed
							var reader = new FileReader();
							reader.onloadend = function () {
								if (xhr.getResponseHeader('Content-Type').indexOf('application/json') > -1) {
									errorMessage = JSON.parse(reader.result)[configService.getApiErrorMessageName()];
								}
								else if (xhr.getResponseHeader('Content-Type').indexOf('text/xml') > -1) {
									var parser = new DOMParser();
									xml = parser.parseFromString(reader.result, 'text/xml');
									errorMessage = xml.getElementsByTagName(configService.getApiErrorMessageName())[0].childNodes[0].nodeValue;
								}
								finishedCallback(filename, status, errorMessage);
							};
							reader.readAsText(xhr.response);
						}
						xhrArray.splice(xhrArray.indexOf(xhr), 1); // Remove the xhr from the array, because it's finished

					}
				};
				xhrArray.push(xhr); // Add the request to the array
				xhr.send(); // Send the request to the API
			},
			/**
			 * @callback stoppedCallback
			 * @param {object} trans transfer stopped
			 */
			/**
			 * Stops the download
			 * @param {number} index index of the XMLHttpRequest to stop in the xhrArray
			 * @param {object} trans transfer to stop
			 * @param {stoppedCallback} cb callback called when the request is stopped
			 */
			stop: function (index, trans, cb) {
				xhrArray[index].aborted = true;
				xhrArray[index].abort(); // Cancel the request
				xhrArray.splice(index, 1); // Remove it from the array
				cb(trans);
			}
		};
	}]);
;
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
;
var dtUpload = dtUpload || angular.module('dt-upload', []);

dtUpload.directive('dtDropZone', function () {
	return {
		restrict: 'E',
		templateUrl: 'js/dt-upload/dropZone.tpl.html'
	};
});
;
var dtUpload = dtUpload || angular.module('dt-upload', []);

dtUpload.service('uploadService', ['configService', function (configService) {
	/** Array that contains all XMLHttpRequests */
	var xhrArray = [];

	return {
		/**
		 * @callback downloadFinishedCallback
		 * @param {string} filename name of the file
		 * @param {string} state status of the transfer (Succeeded or Failed)
		 * @param {string} msg message displayed to inform the user about the error
		 */
		/**
		 * @callback downloadProgressCallback
		 * @param {number} progress progress percentage of the download
		 * @param {number} loaded amount of data loaded
		 * @param {number} elapsedTime time elapsed since the behinning of the download
		 * @param {number} size size of the file to download
		 * @param {string} filename name of the file to download
		 */
		/** 
		 * Upload the specified file 
		 * @param {File} file file to upload
		 * @param {downloadFinishedCallback} finishedCallback callback function when download is finished
		 * @param {downloadProgressCallback} progressCallback callback function called when progress event is triggered
		 */
		uploadFile: function (file, finishedCallback, progressCallback) {
			var uploadFormData = new FormData();
			uploadFormData.append('file', file);
			var ms = 0; // Elapsed time counter
			// 100 ms interval to increment counter
			window.setInterval(function () {
				ms += 100;
			}, 100);
			var xhr = new XMLHttpRequest();
			xhr.aborted = false;
			xhr.open('POST', configService.getUploadURL());
			xhr.upload.onprogress = function (e) {
				var progress = e.loaded / e.total * 100; // Percentage
				progressCallback(progress, e.loaded, ms, e.total, file.name);
			};
			xhr.onloadend = function () {
				if (xhr.readyState === 4 && !xhr.aborted) {
					var status = xhr.status < 400 ? 'Succeeded' : 'Failed';
					xhrArray.splice(xhrArray.indexOf(xhr), 1);
					var errorMessage = '';
					if (xhr.status >= 400) {
						if (xhr.getResponseHeader('Content-Type').indexOf('application/json') > -1) {
							errorMessage = JSON.parse(xhr.response)[configService.getApiErrorMessageName()];
						}
						else if (xhr.getResponseHeader('Content-Type').indexOf('text/xml') > -1) {
							errorMessage = $(xhr.responseXML).find(configService.getApiErrorMessageName()).text();
						}
					}
					finishedCallback(file.name, status, errorMessage);
				}
			};
			xhrArray.push(xhr);
			xhr.send(uploadFormData);
		},
		/**
		 * @callback stoppedCallback
		 * @param {object} trans transfer stopped
		 */
		/**
		 * Stops the upload
		 * @param {number} index index of the XMLHttpRequest to stop in the xhrArray
		 * @param {object} trans transfer to stop
		 * @param {stoppedCallback} cb callback called when the request is stopped
		 */
		stop: function (index, trans, cb) {
			xhrArray[index].aborted = true;
			xhrArray[index].abort(); // Cancel the request
			xhrArray.splice(index, 1); // Remove it from the array
			cb(trans);
		}
	};
}]);
;
var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.factory('browserDetectionService', function () {
	return {
		/**
		 * Allows to get information about the browser
		 * @return Object with an indication if it has webkit or not, webkit version (null if not supported), browser name and browser major version
		 */
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
var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.factory('configService', function () {
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
		/**
		 * Function that returns if the dropped file should upload automatically (boolean)
		 * @return true it uploads should start automatically
		 */
		getAutoStart: function () {
			return settings.autoStart;
		},

		/**
		 * Function that returns the number of time a failed upload should retry automatically (number)
		 * @return number of times a failed transfer should retry
		 */
		getAutoRetriesQty: function () {
			return settings.autoRetriesQty;
		},

		/**
		 * Function that returns the number of transfers that can run at the same time (number)
		 * @return number of transfers that can run at the same time
		 */
		getConcurentTransfersQty: function () {
			return settings.concurentTransfersQty;
		},

		/**
		 * Function that returns URL of the API upload endpoint (string)
		 * @return URL of the API endpoint that uploads files
		 */
		getUploadURL: function () {
			return settings.baseURL + settings.uploadURL;
		},

		/**
		 * Function that returns URL of the API endpoint to get all files that are uploaded (string)
		 * @return URL of the API endpoint that sends all available files
		 */
		getFilesURL: function () {
			return settings.baseURL + settings.filesURL;
		},

		/**
		 * Function that returns the number of transfers that are displayed on the same page in the view (number)
		 * @return number of transfers displayed at the same time
		 */
		getDisplayedTransfersQty: function () {
			return settings.displayedTransfersQty;
		},

		/**
		 * Function that returns the name of the message property in server response
		 * @return name of the property
		 */
		getApiErrorMessageName: function () {
			return settings.apiErrorMessageName;
		}
	};
});
;
var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.directive('dtTransfersView', function () {
	return {
		restrict: 'E',
		scope: {
			page: '='
		},
		templateUrl: 'js/dataTransfer/transfersView.tpl.html'
	};
});
;
var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.service('serviceFactory', ['downloadService', 'uploadService', function (downloadService, uploadService) {
	return {
		/**
		 * Create the desired service (inspired by the factory pattern)
		 * @param {string} service name of the deisred service
		 * @returns desired service depending on the name passed in arguments
		 */
		getService: function (service) {
			if (service.toLowerCase().indexOf('down') > -1) {
				return downloadService;
			}
			else if (service.toLowerCase().indexOf('up') > -1) {
				return uploadService;
			}
		}
	};
}]);
;
var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.service('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {
	/** Service that is used to download the files */
	var downloadService = serviceFactory.getService('download');
	/** Service that is used to upload the files */
	var uploadService = serviceFactory.getService('upload');
	/** Array that stores all transfers */
	var transfers = [];
	/** Array that conatins all transfers that are running */
	var runningTransfers = [];
	/** Counter of finished transfers */
	var finishedTransfers = 0;

	return {
		/**
		 * Downloads the file that have the specified file name at the specified URL
		 * @param {string} filename Name of the file to download
		 * @param {string} url url of the API endpoint to call to download the file
		 */
		downloadFile: function (filename, url) {
			if (transfers.indexOf(transfers.filter(function (t) {
				return (t.name === filename && t.url === url);
			})[0]) == -1) {
				transfers.push({ name: filename, url: url, retries: 0 }); // Add a new transfer to the array
			}
			if (runningTransfers.length < configService.getConcurentTransfersQty()) {
				runningTransfers.push({ name: filename, url: url, retries: 0 });
				var that = this; // Get the instance to call the downloadFile function
				// Event to tell that a transfer has just been started
				var start = $.Event('start');
				start.filename = filename;
				start.url = url;
				start.transferType = 'Download';
				$(window).trigger(start);
				// Call the download service
				downloadService.download(filename, url, function (name, state, statusMessage) { // Finished callback
					// Event to tell that the transfer has just finished
					var finished = $.Event('finished');
					finished.filename = name;
					finished.state = state;
					$(window).trigger(finished);
					// Check if the transfer has failed
					var trans = transfers.filter(function (t) {
						return t.name === filename;
					})[0]; // Get the finished transfer from transfers array
					var index;
					if (state === 'Failed') {
						if (trans.retries < configService.getAutoRetriesQty()) { // If the autoRetries limit hasn't been reached yet
							that.downloadFile(filename, url); // Call recursively the downloadFile function
							trans.retries++; // Increment retires counter
						}
						else {
							if (statusMessage !== undefined) {
								alert(statusMessage);
							}
							finishedTransfers++;
							index = runningTransfers.indexOf(runningTransfers.filter(function (t) {
								return t.name === trans.name;
							})[0]);
							runningTransfers.splice(index, 1);
							index = finishedTransfers + configService.getConcurentTransfersQty() - 1;
							if (transfers.length > index) {
								that.downloadFile(transfers[index].name, transfers[index].url);
							}
						}
					}
					else if (state === 'Succeeded') {
						finishedTransfers++;
						index = runningTransfers.indexOf(runningTransfers.filter(function (t) {
							return t.name === trans.name;
						})[0]);
						runningTransfers.splice(index, 1);
						index = finishedTransfers + configService.getConcurentTransfersQty() - 1;
						if (transfers.length > index) {
							that.downloadFile(transfers[index].name, transfers[index].url);
						}
					}
				}, function (progress, loaded, elapsedTime, size, name) { // Progress callback
					// Event to notify the view that the transfer is progressing
					// This event contains all information needed to calculate progress, size, speed, elapsed time and remaining time
					var progressEvt = $.Event('progress');
					progressEvt.prog = progress;
					progressEvt.loaded = loaded;
					progressEvt.elapsedTime = elapsedTime;
					progressEvt.size = size;
					progressEvt.filename = name;
					$(window).trigger(progressEvt);
				});
			}
		},
		/**
		 * Uploads a file
		 * @param {File} file file to upload
		 */
		uploadFile: function (file) {
			if (transfers.indexOf(transfers.filter(function (t) {
				return (t.name === file.name);
			})[0]) == -1) {
				transfers.push({ file: file, name: file.name, retries: 0 }); // Add a new transfer to the array
			}
			if (runningTransfers.length < configService.getConcurentTransfersQty()) {
				runningTransfers.push({ file: file, name: file.name, retries: 0 });
				var that = this; // Get the instance to call the uploadFile function
				// Event to tell that a transfer has just been started
				var start = $.Event('start');
				start.filename = file.name;
				start.transferType = 'Upload';
				$(window).trigger(start);
				// Call the upload service
				uploadService.uploadFile(file, function (name, state, statusMessage) { // Finished callback
					// Event to tell that the transfer has just finished
					var finished = $.Event('finished');
					finished.filename = name;
					finished.state = state;
					$(window).trigger(finished);
					// Check if the transfer has failed
					var trans = transfers.filter(function (t) {
						return t.name === file.name;
					})[0]; // Get the finished transfer from transfers array
					var index;
					if (state === 'Failed') {
						if (trans.retries < configService.getAutoRetriesQty()) { // If the autoRetries limit hasn't been reached yet
							that.uploadFile(file); // Call recursively the uploadFile function
							trans.retries++; // Increment retires counter
						}
						else {
							if (statusMessage !== undefined) {
								alert(statusMessage);
							}
							finishedTransfers++;
							index = runningTransfers.indexOf(runningTransfers.filter(function (t) {
								return t.name === trans.name;
							})[0]);
							runningTransfers.splice(index, 1);
							index = finishedTransfers + configService.getConcurentTransfersQty() - 1;
							if (transfers.length > index) {
								that.uploadFile(transfers[index].file);
							}
						}
					}
					else if (state === 'Succeeded') {
						finishedTransfers++;
						index = runningTransfers.indexOf(runningTransfers.filter(function (t) {
							return t.name === trans.name;
						})[0]);
						runningTransfers.splice(index, 1);
						index = finishedTransfers + configService.getConcurentTransfersQty() - 1;
						if (transfers.length > index) {
							that.uploadFile(transfers[index].file);
						}
					}
				}, function (progress, loaded, elapsedTime, size, name) { // Progress callback
					// Event to notify the view that the transfer is progressing
					// This event contains all information needed to calculate progress, size, speed, elapsed time and remaining time
					var progressEvt = $.Event('progress');
					progressEvt.prog = progress;
					progressEvt.loaded = loaded;
					progressEvt.elapsedTime = elapsedTime;
					progressEvt.size = size;
					progressEvt.filename = name;
					$(window).trigger(progressEvt);
				});
			}
		},
		/**
		 * @callback stoppedCallback
		 * @param {object} transfer transfer stopped
		 */
		/**
		 * Function that stops the transfer
		 * @param {string} transferType Type of the transfer (may be Download or Upload)
		 * @param {object} trans transfer to stop
		 * @param {stoppedCallback} stoppedCb callback called to notify caller that the transfer is stopped
		 */
		stop: function (transferType, trans, stoppedCb) {
			var index = runningTransfers.indexOf(runningTransfers.filter(function (t) {
				return t.name === trans.name;
			})[0]);
			runningTransfers.splice(index, 1);
			if (transferType === 'Download') {
				downloadService.stop(index, trans, function (t) {
					stoppedCb(t);
				});
			}
			else if (transferType === 'Upload') {
				uploadService.stop(index, trans, function (t) {
					stoppedCb(t);
				});
			}
		}
	};
}]);
;
var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.controller('viewController', ['$scope', 'configService', 'transfersService', function ($scope, configService, transfersService) {
	/** Viewmodels for files */
	var filesVM = [];
	/** Files for upload */
	var files = [];
	/** Current page of the pagination in the view */
	var currentPage = 1;
	/** Transfers that are displayed in the view */
	$scope.displayedTransfers = [];
	/** Transfers that are selected */
	$scope.selectedTransfers = [];
	/** Transfers that have failed */
	$scope.failedTransfers = [];
	/** Indicates if some transfers are running */
	$scope.areTransfersRunning = false;

	// Define the padding of the body, so it is displayed above the view
	window.onload = function () {
		$scope.defineBodyPadding();
	};

	// Event triggered when a transfer is started
	$(window).on('start', function (e) {
		var newFile = { // New file (fileVM)
			selected: false,
			name: e.filename,
			downloadUrl: e.url,
			transferType: e.transferType,
			status: 'Pending',
			prog: 0,
			aborted: false
		};
		if (filesVM.indexOf(filesVM.filter(function (f) {
			return f.name === e.filename && f.transferType === e.transferType;
		})[0]) === -1) { // If the fileVM doesn't exist
			filesVM.push(newFile); // Add it to the array
		}
		$scope.definePagination(); // Define the pagination (show only files that are on the current page)
	});

	// Event triggered when a transfer is finished
	$(window).on('finished', function (e) {
		var file = filesVM.filter(function (f) {
			return f.name === e.filename;
		})[0]; // Get the transfer in the array that has the filename specified in the event
		file.status = e.state; // Change status
		$scope.areTransfersRunning = filesVM.filter(function (t) {
			return t.status === 'Pending';
		}).length > 0;
		if (e.state === 'Failed') {
			if ($scope.failedTransfers.indexOf(file) === -1) {
				$scope.failedTransfers.push(file);
			}
		}
		$scope.$apply(); // Apply changes in the scope
	});

	// Event that notifies the progress of the transfer
	$(window).on('progress', function (e) {
		var file = filesVM.filter(function (f) {
			return f.name === e.filename;
		})[0]; // Get the transfer in the array that has the filename specified in the event
		file.status = 'Pending';
		file.prog = Math.floor(e.prog);
		file.displaySize = function () { // Format the size of the file to display it with the correct unit (B, KB or MB)
			var cptDiv = 0;
			var size = e.size;
			while (size > 1024) {
				size /= 1024;
				cptDiv++;
			}
			return (Number((size).toFixed(0))) + (cptDiv == 2 ? ' MB' : cptDiv == 1 ? ' KB' : ' B');
		};
		file.elapsedTime = e.elapsedTime / 1000;
		file.speed = (e.loaded / e.elapsedTime) / 1024;
		file.remainingTime = ((e.elapsedTime / e.prog) * (100 - e.prog)) / 1000;
		if (!file.aborted) {
			$scope.$apply(); // Apply changes in the scope
		}
	});

	$(window).on('dropped', function (e) {
		var newFile = { // New file (fileVM)
			selected: false,
			name: e.file.name,
			transferType: 'Upload',
			status: 'Queued',
			prog: 0,
			aborted: false,
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
		};
		filesVM.push(newFile);
		files.push(e.file);
		$scope.definePagination();
		$scope.$apply();
	});

	/**
	 * Starts the transfer
	 * @param {object} trans Transfer to start
	 */
	$scope.start = function (trans) {
		trans.aborted = false;
		var index = filesVM.indexOf(trans);
		if (trans.transferType === 'Upload') {
			transfersService.uploadFile(files[index]);
		}
		else if (trans.transferType === 'Download') {
			transfersService.downloadFile(trans.name, trans.downloadUrl);
		}
	};

	/**
	 * Deletes selected transfers
	 */
	$scope.delete = function () {
		$scope.selectedTransfers.forEach(function (t) {
			var index = filesVM.indexOf(t);
			filesVM.splice(index, 1);
			files.splice(index, 1);
			var removed = $.Event('removed');
			removed.filename = t.name;
			$(window).trigger(removed);
		});
		$scope.selectedTransfers = [];
		$scope.failedTransfers = filesVM.filter(function (t) {
			return t.status === 'Failed';
		});
		$scope.definePagination();
	};

	/**
	 * Retries all failed transfers
	 */
	$scope.retryFailed = function () {
		$scope.failedTransfers.forEach(function (t) {
			$scope.start(t);
		});
	};

	/**
	 * Function that selects / deselects all transfers
	 */
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

	/**
	 * Starts all selected transfers
	 */
	$scope.startSelected = function () {
		$scope.selectedTransfers.forEach(function (t) {
			$scope.start(t);
		});
	};

	/**
	 * Stops the transfer
	 * @param {object} trans Transfer to stop
	 */
	$scope.stop = function (trans) {
		trans.aborted = true;
		transfersService.stop(trans.transferType, trans, function (t) {
			var file = filesVM[filesVM.indexOf(t)];
			file.speed = 0;
			file.elapsedTime = 0;
			file.prog = 0;
			file.remainingTime = 0;
			file.status = 'Queued';
		});
		//$scope.$apply();
	};

	/**
	 * Function that changes the checked status of the transfer
	 * @param {object} trans transfer to change status
	 */
	$scope.toggle = function (transfer) {
		transfer.selected = !transfer.selected;
		$scope.selectedTransfers = $scope.displayedTransfers.filter(function (t) {
			return t.selected;
		});
	};

	/**
	 * Function that changes the page of the table (by changing displayed transfers)
	 * @param {number} num number of the page to display
	 */
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

	/**
	 * Function that defines the pagination (counts how many pages are needed to show all transfers)
	 */
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
		if ($scope.page != 'upload') { // If the page is not "upload"
			$scope.defineBodyPadding(); // Define bottom padding of the body
		}
		$scope.changePage(currentPage);
	};

	/**
	 * Function that defines the bottom padding of the body. The goal is to always have the body above the transfers view in home page
	 */
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
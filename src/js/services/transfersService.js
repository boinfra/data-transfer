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
		var xhrArray = [];
		var aborted = false;

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
			xhr.onloadend = function () {
				if (xhr.readyState == 4 && !aborted) {
					if (success) {
						zipResponse = xhr.response.type === 'application/zip';
						success(xhr.response);
						var finished = $.Event('finished');
						finished.state = 'Succeeded';
						finished.filename = name;
						$(window).trigger(finished);
					}
				}
			};
			xhrArray.push(xhr);
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
				dl.downloadUrl = url;
				$(window).trigger(dl);
				downloadFile(url, name, function (blob) {
					saveAs(blob, zipResponse ? name + '.zip' : name);
				});
			},
			stop: function (trans, index) {
				xhrArray[index].abort();
				var stopped = $.Event('stopped');
				stopped.trans = trans;
				$(window).trigger(stopped);
			}
		};
	}]);
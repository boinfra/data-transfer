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
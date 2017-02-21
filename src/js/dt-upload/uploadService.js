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
angular.module('dt-download', [])
	.service('downloadService', function () {
		/** Array that contains all XMLHttpRequests */
		var xhrArray = [];

		return {
			/**
			 * @callback downloadFinishedCallback
			 * @param {string} filename name of the file
			 * @param {string} state status of the transfer (Succeeded or Failed)
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
						if (xhr.status < 400) { // If the http status is not error
							var zipResponse = false;
							zipResponse = xhr.response.type === 'application/zip'; // Check if the file is a zipped file (the VSD API sends zipped file, but some other API would not)
							// saveAs(xhr.response, zipResponse ? filename + '.zip' : filename); // Download the file in the user's file system (uses saveAs function of FileSaver.js)
							status = 'Succeeded';
						}
						else { // If the status if error
							status = 'Failed'; // Transfer status is failed
						}
						xhrArray.splice(xhrArray.indexOf(xhr), 1); // Remove the xhr from the array, because it's finished
						finishedCallback(filename, status);
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
	});
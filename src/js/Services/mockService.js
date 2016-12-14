angular.module('data-transfer')

	.factory('mockService', ['$timeout', function ($timeout) {
		var transfers = []; // Array of transfers
		return {
			// Function that uploads a file
			uploadFile: function (file) {
				transfers.push(file); // Add the file to the transfers array
				var prog = 0; // Progress 
				var time = 0; // Elapsed time of the upload 
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
				transfers[index].status = 'Pending'; // Set status to Pending
			},
			// Function that stops the upload
			stop: function (trans) {
				var index = transfers.indexOf(trans); // Get the index of the file in the transfers array
				transfers[index].status = 'Queued'; // Set status to Queued
			}
		};
	}]);
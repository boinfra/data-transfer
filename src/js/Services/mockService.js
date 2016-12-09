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
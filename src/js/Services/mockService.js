angular.module('data-transfer')

	.factory('mockService', ['$timeout', function ($timeout) {
		var transfers = [];
		return {
			uploadFile: function (file) {
				transfers.push(file);
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
						var index = transfers.indexOf(file);
						if (transfers[index].status !== 'Paused') {
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
			pause: function (trans) {
				var index = transfers.indexOf(trans);
				transfers[index].status = 'Paused';
				console.debug('Pause', transfers);
			},
			resume: function (trans) {
				console.debug('Resume');
				trans.status = 'Pending';
			},
			stop: function (trans) {
				trans.status = 'Queued';
				transfers.splice(transfers.indexof(trans), 1);
			}
		};
	}]);
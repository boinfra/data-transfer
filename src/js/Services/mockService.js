angular.module('data-transfer')

	.factory('mockService', ['$timeout', function ($timeout) {
		var acceptedExtensions = ['*'];
		return {
			uploadFile: function (file) {
				var state = 0;
				var time = 0;
				var complete = false;
				var returnValue;
				var timeout;
				var message;

				var evt = $.Event('progress');

				function intervalTrigger() {
					setInterval(function () {
						time += 100;
						state = (time / timeout) * 100;
						evt.state = state;
						evt.file = file;
						evt.elapsedTime = time/1000 + ' s';
						evt.remainingTime = (timeout - time)/1000 + ' s';
						complete = state > 100;
						if (!complete) {
							$(window).trigger(evt);
						}
					}, 100);
				}
				var interval = intervalTrigger();

				if (state > 100) {
					window.clearInterval(interval);
				}

				if (file.name.indexOf('success') !== -1) {
					timeout = 2000;
					message = 'success';
				}
				if (file.name.indexOf('error') !== -1) {
					timeout = 3000;
					message = 'error';
				}

				return $timeout(function () {
					return message;
				}, timeout);
			}
		};
	}]);
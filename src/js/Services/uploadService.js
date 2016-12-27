angular.module('data-transfer')

	.factory('uploadService', ['$http', 'configService', function ($http, configService) {
		var acceptedExtensions = ['*'];
		var url = configService.getApiEndpointURL();
		return {
			uploadFile: function (file) {
				var uploadFormData = new FormData();
				uploadFormData.append('file', file);
				$http.defaults.headers.common.Authorization = 'Basic ZGVtb0B2aXJ0dWFsc2tlbGV0b24uY2g6ZGVtbw==';

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
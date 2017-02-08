angular.module('data-transfer')

	.factory('uploadService', ['$http', '$resource', 'configService', function ($http, $resource, configService) {
		var url = configService.getUploadURL();
		return {
			uploadFile: function (file) {
				var uploadFormData = new FormData();
				uploadFormData.append('file', file);

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
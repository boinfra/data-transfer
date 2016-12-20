angular.module('data-transfer')

	.factory('uploadService', ['$resource', '$http', 'configService', function ($resource, $http, configService) {
		var acceptedExtensions = ['*'];
		var url = configService.getApiEndpointURL();
		return {
			uploadFile: function (file) {

				var uploadFormData = new FormData();
				uploadFormData.append('file', file);
				/*var Upload = $resource(url, {}, {
					post: {
						method: 'POST',
						headers: {
							'Authorization': 'Basic ZGVtb0B2aXJ0dWFsc2tlbGV0b24uY2g6ZGVtbw==',
							'Content-Type': 'multipart/form-data'
						}
					}
				});
				Upload.post(uploadFormData);*/
				$http.defaults.headers.common.Authorization = 'Basic ZGVtb0B2aXJ0dWFsc2tlbGV0b24uY2g6ZGVtbw==';
				$http.post(url, uploadFormData, {
					transformRequest: angular.identity,
					headers: { 'Content-Type': undefined }
				});
			}
		};
	}]);
angular.module('data-transfer')

	.factory('uploadService', function () {
		var acceptedExtensions = ['*'];
		return {
			uploadFile: function (file) {
				console.debug("Upload file");
				console.debug(file);
			}
		};
	});
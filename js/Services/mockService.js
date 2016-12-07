angular.module('data-transfer')

	.factory('mockService', ['$timeout', function ($timeout) {
		var acceptedExtensions = ['*'];
		return {
			uploadFile: function (file) {
				var returnValue;
				if (file.name.indexOf('success') !== -1) {
					returnValue = $timeout(function () {
						return 'success';
					}, 2000);
				}
				if (file.name.indexOf('error') !== -1) {
					returnValue = $timeout(function () {
						return 'error';
					}, 3000);
				}
				return returnValue;
			}
		};
	}]);
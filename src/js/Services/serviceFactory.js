angular.module('data-transfer')

	.factory('serviceFactory', ['uploadService', 'mockService', function (uploadService, mockService) {

		return {
			// Function that returns either mockService or uploadService, depending on the value of service argument
			getService: function (service) {
				var returnedService = {}; // Service that will be returned
				switch (service) {
					case 'mock': // If the parameter is 'mock'
						returnedService = mockService; // Return mockService
						break;
					case 'upload': // If the parameter is 'upload'
						returnedService = uploadService; // Return uploadService
						break;
					default: // In each other case
						returnedService = mockService; // Return mockService
						break;
				}

				return returnedService;
			}
		};
	}]);
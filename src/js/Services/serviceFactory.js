angular.module('data-transfer')

.factory('serviceFactory', ['uploadService', 'mockService', function(uploadService, mockService){
	
	return {
		getService: function(service){
			var returnedService = {};
			switch (service) {
				case 'mock':
					returnedService = mockService;
					break;
				case 'upload':
					returnedService = uploadService;
					break;
				default:
					returnedService = mockService;
					break;
			}

			return returnedService;
		}
	};
}]);
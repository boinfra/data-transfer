angular.module('data-transfer')

.controller('transfersController', ['serviceFactory', function(serviceFactory){
	var service = serviceFactory.getService('mock');
	
}]);
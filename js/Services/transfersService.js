angular.module('data-transfer')

.factory('transfersService', ['serviceFactory', function(serviceFactory){
	var service = serviceFactory.getService('mock');
	var transfers = [];

	return {
		pushTransfer: function(trans) {
			transfers.push(trans);
		},
		getTransfers: function() {
			return transfers;
		}
	};
}]);
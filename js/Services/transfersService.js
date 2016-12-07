angular.module('data-transfer')

	.factory('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {
		var service = serviceFactory.getService('mock');
		var transfers = [];

		return {
			pushTransfer: function (trans) {
				transfers.push(trans);
				trans.status = 'Pending';
				if (configService.getAutoStart()) {
					service.uploadFile(trans).then(function (status) {
						switch(status){
							case 'success':
								trans.status = 'Succeeded';
								break;
							case 'error':
								trans.status = 'Failed';
								break;
						}
					 });
				}
			},
			getTransfers: function () {
				return transfers;
			}
		};
	}]);
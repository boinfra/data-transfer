angular.module('data-transfer')

	.factory('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {
		var service = serviceFactory.getService('mock');
		var transfers = [];

		function run(trans) {
			trans.status = 'Pending';
			service.uploadFile(trans).then(function (status) {
				switch (status) {
					case 'success':
						trans.status = 'Succeeded';
						break;
					case 'error':
						trans.status = 'Failed';
						break;
				}
			});
		}

		return {
			pushTransfer: function (trans) {
				transfers.push(trans);
				if (configService.getAutoStart()) {
					run(trans);
				}
			},
			getTransfers: function () {
				return transfers;
			},
			start: function(index) {
				var trans = transfers[index];
				run(trans);
			}
		};
	}]);
angular.module('data-transfer')

	.factory('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {
		var service = serviceFactory.getService('mock');
		var transfers = [];

		function run(trans, index) {
			trans.status = 'Pending';
			service.uploadFile(trans, index);
		}

		return {
			pushTransfer: function (trans, index) {
				trans.id = index;
				transfers.push(trans);
				if (configService.getAutoStart()) {
					run(trans, index);
				}
			},
			getTransfers: function () {
				return transfers;
			},
			start: function (index) {
				var trans = transfers[index];
				if (trans.status == 'Queued')
					run(trans, index);
				else if (trans.status == 'Paused')
					service.resume(index);
			},
			pause: function (index) {
				service.pause(index);
			},
			stop: function(index) {
				service.stop(index);
			}
		};
	}]);
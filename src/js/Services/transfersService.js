angular.module('data-transfer')

	.factory('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {
		var service = serviceFactory.getService('mock');
		var transfers = [];
		var runningTransfers = [];
		var concurentTransfers = configService.getConcurentTransfersQty();
		var transfersCompleted = 0;

		function run(trans) {
			trans.status = 'Pending';
			service.uploadFile(trans);
		}

		$(window).on('complete', function (e) {
			transfersCompleted++;
			if (transfersCompleted < transfers.length - 2) {
				for (var i = 0; i < transfers.length; i++) {
					var currentTransfer = transfers[i];
					var position = 0;
					if (currentTransfer === e.file) {
						for (var ct = 0; ct < concurentTransfers; ct++) {
							if (runningTransfers[ct] === currentTransfer) {
								position = ct;
								ct = runningTransfers;
							}
						}
						runningTransfers.splice(position, 1);
						if (configService.getAutoStart()) {
							runningTransfers.push(transfers[transfersCompleted + 2]);
							run(transfers[transfersCompleted + 2], transfers[transfersCompleted + 2].id);
						}
						i = transfers.length;
					}
				}
			}
		});

		return {
			pushTransfer: function (trans, index) {
				trans.id = index;
				transfers.push(trans);
				if (configService.getAutoStart()) {
					if (runningTransfers.length < concurentTransfers) {
						runningTransfers.push(trans);
						run(trans);
					}
				}
			},
			getTransfers: function () {
				return transfers;
			},
			start: function (trans) {
				if (!configService.getAutoStart()) {
					if (runningTransfers.length < concurentTransfers) {
						runningTransfers.push(trans);
						if (trans.status == 'Queued') {
							run(trans);
						}
						else if (trans.status == 'Paused') {
							service.resume(trans);
						}
					}
				}
				else {
					if (trans.status == 'Queued') {
						run(trans);
					}
					else if (trans.status == 'Paused') {
						service.resume(trans);
					}
				}
			},
			pause: function (trans) {
				service.pause(trans);
			},
			stop: function (trans) {
				service.stop(trans);
			}
		};
	}]);
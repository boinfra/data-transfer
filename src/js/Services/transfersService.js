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
			if (e.state == 'Failed') {
				if (e.file.autoRetries < configService.getAutoRetriesQty()) {
					var index = transfers.indexOf(e.file);
					transfers[index].autoRetries++;
					var trans = transfers[index];
					trans.status = 'Queued';
					run(trans);
				}
				else {
					for (var transfersCount = 0; transfersCount < transfers.length; transfersCount++) {
						if (transfers[transfersCount].status === 'Queued') {
							run(transfers[transfersCount]);
							transfersCount = transfers.length;
						}
					}
				}
			}
			else if (e.state == 'Succeeded') {
				var offset = concurentTransfers - 1;
				transfersCompleted++;
				if (transfersCompleted < transfers.length - offset) {
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
								runningTransfers.push(transfers[transfersCompleted + offset]);
								run(transfers[transfersCompleted + offset]);
							}
							i = transfers.length;
						}
					}
				}
			}
		});

		return {
			pushTransfer: function (trans, index) {
				trans.id = index;
				trans.autoRetries = 0;
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
					if (runningTransfers.length < concurentTransfers && trans.status === 'Queued') {
						runningTransfers.push(trans);
						run(trans);
					}
					else if (runningTransfers.length <= concurentTransfers && trans.status === 'Paused') {
						service.resume(trans);
					}
				}
				else {
					if (trans.status === 'Queued' || trans.status === 'Failed') {
						run(trans);
					}
					else if (trans.status === 'Paused') {
						service.resume(trans);
					}
				}
			},
			pause: function (trans) {
				service.pause(trans);
			},
			stop: function (trans) {
				var index = runningTransfers.indexOf(trans);
				runningTransfers.splice(index, 1);
				service.stop(trans);
			}
		};
	}]);
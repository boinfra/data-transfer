angular.module('data-transfer')

	.factory('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {
		var service = serviceFactory.getService('mock');
		var transfers = [];
		var runningTransfers = [];
		var concurentTransfers = configService.getConcurentTransfersQty();
		var transfersCompleted = 0;

		function run(trans, index) {
			trans.status = 'Pending';
			service.uploadFile(trans, index);
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
						runningTransfers.push(transfers[transfersCompleted + 2]);
						run(transfers[transfersCompleted + 2], transfers[transfersCompleted + 2].id);
						i = transfers.length;
					}
				}
			}
		});

		return {
			pushTransfer: function (trans, index) {
				trans.id = index;
				transfers.push(trans);
				if (runningTransfers.length < concurentTransfers) {
					runningTransfers.push(trans);
				}
				if (configService.getAutoStart() && runningTransfers.length <= concurentTransfers) {
					this.start(index);
				}
			},
			getTransfers: function () {
				return transfers;
			},
			start: function (index) {
				var currentTransfer = transfers[index];
				var trans = {};
				for (var i = 0; i < concurentTransfers; i++) {
					if (runningTransfers[i] === currentTransfer) {
						trans = runningTransfers[i];
					}
				}
				if (trans.status == 'Queued')
					run(trans, index);
				else if (trans.status == 'Paused')
					service.resume(index);
			},
			pause: function (index) {
				service.pause(index);
			},
			stop: function (index) {
				service.stop(index);
			}
		};
	}]);
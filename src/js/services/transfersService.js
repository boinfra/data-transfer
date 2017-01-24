angular.module('data-transfer')

	.factory('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {

		var files = [];
		var autoRetries = [];
		var filePushed = $.Event('filePushed');
		var service = serviceFactory.getService('mock');
		var transfersToRun = [];
		var runningTransfers = [];
		var concurentTransfers = configService.getConcurentTransfersQty(); // Get the number of transfers that can run at the same time
		var transfersCompleted = 0; // Number of completed transfers

		var run = $.Event('run');
		run.state = 'Pending';

		// Event triggered by the service when an upload is finished
		$(window).on('complete', function (e) {
			var finished = $.Event('finished');
			finished.file = e.file;
			finished.service = e.service;
			finished.state = e.state;
			runningTransfers.splice(index, 1); // Remove succeeded transfer from running transfers array
			var index = transfersToRun.indexOf(e.file); // Get the index of the file in the transfers array
			var offset = concurentTransfers - 1; // Offset for the index to get the next transfer
			if (e.state === 'Succeeded') { // If upload has succeeded
				transfersToRun.splice(index, 1);
				$(window).trigger(finished);
				transfersCompleted++; // Incerment the counter of completed transfers
				if (transfersCompleted < files.length - offset) { // If there is still queued transfers
					if (configService.getAutoStart()) { // If upload should start automatically
						runningTransfers.push(files[transfersCompleted + offset]); // Add next queued transfer to running transfers array
						service.uploadFile(files[transfersCompleted + offset]); // Run this transfer
						run.file = files[transfersCompleted + offset];
						$(window).trigger(run);
					}
				}
			}
			else if (e.state === 'Failed') {
				if (autoRetries[index] < configService.getAutoRetriesQty()) {
					service.uploadFile(e.file);
					e.state = 'Pending';
					run.state = e.state;
					run.file = e.file;
					$(window).trigger(run);
					autoRetries[index]++;
				}
				else {
					transfersToRun.splice(index, 1);
					transfersCompleted++;
					if (configService.getAutoStart() && transfersCompleted + offset < files.length) {
						service.uploadFile(files[transfersCompleted + offset]); // Run this transfer
						run.file = files[transfersCompleted + offset];
						$(window).trigger(run);
					}
					$(window).trigger(finished);
				}
			}
		});

		return {
			pushFile: function (file) {
				files.push(file);
				autoRetries.push(0);
				filePushed.status = configService.getAutoStart() ? 'Pending' : 'Queued';
				filePushed.file = file;
				$(window).trigger(filePushed);
				if (configService.getAutoStart()) {
					this.start(file);
				}
			},
			getFiles: function () {
				return files;
			},
			removeFile: function (file) {
				var index = files.indexOf(file);
				files.splice(index, 1);
				transfersToRun.splice(index, 1);
				runningTransfers.splice(index, 1);
				transfersCompleted = 0;
				var remove = $.Event('remove');
				remove.index = index;
				$(window).trigger(remove);
			},
			start: function (file) {
				autoRetries[files.indexOf(file)] = 0;
				if (runningTransfers.length < concurentTransfers) {
					transfersToRun.push(file);
					runningTransfers.push(file);
					service.uploadFile(file);
					run.file = file;
					$(window).trigger(run);
				}
			},
			getRunningTransfers: function () {
				return runningTransfers;
			}
		};

	}]);
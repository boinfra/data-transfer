angular.module('data-transfer')

	.factory('transfersService', ['serviceFactory', 'configService', function (serviceFactory, configService) {

		var files = [];
		var fakeFiles = [];
		var autoRetries = [];
		var filePushed = $.Event('filePushed');
		var service = serviceFactory.getService('upload');
		var runningTransfers = [];
		var concurentTransfers = configService.getConcurentTransfersQty(); // Get the number of transfers that can run at the same time
		var transfersCompleted = 0; // Number of completed transfers

		var run = $.Event('run');
		run.state = 'Pending';

		window.onbeforeunload = function () {
			var transfersToSave = JSON.stringify(fakeFiles);
			localStorage.setItem('transfers', transfersToSave);
			// localStorage.setItem('transfers', '[]');
		};

		$(document).ready(function () {
			var savedTransfers = localStorage.getItem('transfers');
			fakeFiles = JSON.parse(savedTransfers);
			for (var i = 0; i < fakeFiles.length; i++) {
				var f = new File([], fakeFiles[i].name);
				f.lastModified = fakeFiles[i].lastModified;
				f.lastModifiedDate = fakeFiles[i].lastModifiedDate;
				f.size = fakeFiles[i].size;
				// console.debug(f.size);
				f.type = fakeFiles[i].type;
				files.push(f);
				filePushed.status = configService.getAutoStart() ? 'Pending' : 'Queued';
				filePushed.file = f;
				$(window).trigger(filePushed);
				if (configService.getAutoStart()) {
					this.start(f);
				}
			}
		});

		// Event triggered by the service when an upload is finished
		$(window).on('complete', function (e) {
			var index = transfers.indexOf(e.file); // Get the index of the file in the transfers array
			runningTransfers.splice(index, 1); // Remove succeeded transfer from running transfers array
			var offset = concurentTransfers - 1; // Offset for the index to get the next transfer
			if (e.state == 'Succeeded') { // If upload has succeeded
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
			else if (e.state == 'Failed') {
				if (autoRetries[index] < configService.getAutoRetriesQty()) {
					service.uploadFile(e.file);
					run.file = e.file;
					$(window).trigger(run);
					autoRetries[index]++;
				}
				else {
					transfersCompleted++;
					if (configService.getAutoStart() && transfersCompleted + offset < files.length) {
						service.uploadFile(files[transfersCompleted + offset]); // Run this transfer
						run.file = files[transfersCompleted + offset];
						$(window).trigger(run);
					}
				}
			}
		});

		return {
			pushFile: function (file) {
				var fakeFile = {
					lastModified: file.lastModified,
					lastModifiedDate: file.lastModifiedDate,
					name: file.name,
					size: file.size,
					type: file.type
				};
				fakeFiles.push(fakeFile);
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
				var remove = $.Event('remove');
				remove.file = file;
				$(window).trigger(remove);
			},
			start: function (file) {
				if (runningTransfers.length < concurentTransfers) {
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
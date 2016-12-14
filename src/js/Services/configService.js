angular.module('data-transfer')

	.factory('configService', function () {
		var settings; // Object that stores all settings
		// Ajax request to settings.json file. Get settings in json format
		$.ajax({
			url: '/dataTransfer/src/js/settings.json',
			async: false,
			dataType: 'json',
			success: function (response) {
				settings = response;
			}
		});

		return {
			// Function that returns if the dropped file should upload automatically (boolean)
			getAutoStart: function () {
				return settings.autoStart;
			},
			// Function that returns the number of time a failed upload should retry automatically (number)
			getAutoRetriesQty: function () {
				return settings.autoRetriesQty;
			},
			// Function that returns the number of transfers that can run at the same time (number)
			getConcurentTransfersQty: function () {
				return settings.concurentTransfersQty;
			},
			// Function that returns URL of the API endpoint (string)
			getApiEndpointURL: function () {
				return settings.apiEndpointURL;
			},
			// Function that returns the number of transfers that are displayed on the same page in the view (number)
			getDisplayedTransfersQty: function () {
				return settings.displayedTransfersQty;
			}
		};
	});
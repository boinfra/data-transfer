var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.factory('configService', function () {
	var settings; // Object that stores all settings
	// Ajax request to settings.json file. Get settings in json format
	$.ajax({
		url: '/dataTransfer/settings.json',
		async: false,
		dataType: 'json',
		success: function (response) {
			settings = response;
		}
	});

	return {
		/**
		 * Function that returns if the dropped file should upload automatically (boolean)
		 * @return true it uploads should start automatically
		 */
		getAutoStart: function () {
			return settings.autoStart;
		},

		/**
		 * Function that returns the number of time a failed upload should retry automatically (number)
		 * @return number of times a failed transfer should retry
		 */
		getAutoRetriesQty: function () {
			return settings.autoRetriesQty;
		},

		/**
		 * Function that returns the number of transfers that can run at the same time (number)
		 * @return number of transfers that can run at the same time
		 */
		getConcurentTransfersQty: function () {
			return settings.concurentTransfersQty;
		},

		/**
		 * Function that returns URL of the API upload endpoint (string)
		 * @return URL of the API endpoint that uploads files
		 */
		getUploadURL: function () {
			return settings.baseURL + settings.uploadURL;
		},

		/**
		 * Function that returns URL of the API endpoint to get all files that are uploaded (string)
		 * @return URL of the API endpoint that sends all available files
		 */
		getFilesURL: function () {
			return settings.baseURL + settings.filesURL;
		},

		/**
		 * Function that returns the number of transfers that are displayed on the same page in the view (number)
		 * @return number of transfers displayed at the same time
		 */
		getDisplayedTransfersQty: function () {
			return settings.displayedTransfersQty;
		}
	};
});
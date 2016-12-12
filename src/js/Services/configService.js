angular.module('data-transfer')

	.factory('configService', function () {
		// var settings;
		// $.getJSON('../settings.json', function (json) {
		// 	settings = json;
		// });
		var settings = {
			"autoStart": "true",
			"autoRetriesQty": 3,
			"concurentTransfersQty": 1,
			"apiEndpointURL": "http://localhost:8080/api/upload",
			"displayedTransfersQty": 5
		};

		return {
			getAutoStart: function () {
				return settings.autoStart;
			},
			getAutoRetriesQty: function () {
				return settings.autoRetriesQty;
			},
			getConcurentTransfersQty: function () {
				return settings.concurentTransfersQty;
			},
			getApiEndpointURL: function () {
				return settings.apiEndpointURL;
			},
			getDisplayedTransfersQty: function () {
				return settings.displayedTransfersQty;
			}
		};
	});
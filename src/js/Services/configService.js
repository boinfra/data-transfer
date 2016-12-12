angular.module('data-transfer')

	.factory('configService', function () {
		var settings;
		$.ajax({
			url: '/dataTransfer/src/js/settings.json',
			async: false,
			dataType: 'json',
			success: function (response) {
				settings = response;
			}
		});

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
angular.module('data-transfer')

	.factory('configService', function(){
		var autoStart = false, // If the upload should start automatically
			autoRetriesQty = 3, // Number of times the upload should be automatically retried after fail
			concurentTransfersQty = 1, // Number of concurent transfers
			apiEndpointURL = 'http://demo.virtualskeleton.ch/api/upload', // URL of the endpoint that uploads files in the used API
			displayedTransfersQty = 5; // Number of displayed transfers in one page of the transfersView

		return {
			getAutoStart: function() {
				return autoStart;
			},
			getAutoRetriesQty: function() {
				return autoRetriesQty;
			},
			getConcurentTransfersQty: function() {
				return concurentTransfersQty;
			},
			getApiEndpointURL: function() {
				return apiEndpointURL;
			},
			getDisplayedTransfersQty: function() {
				return displayedTransfersQty;
			}
		};
	});
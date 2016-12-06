angular.module('data-transfer', ['ngResource']); // Creation of the main module of the framework
;
angular.module('data-transfer')

	.factory('configService', function(){
		var autoStart = true, // If the upload should start automatically
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
;
angular.module('data-transfer')

.factory('mockService', function(){
	var acceptedExtensions = ['*'];
	return{
		uploadFile: function(file){
			console.debug("Upload file");
		}
	};
});
;
angular.module('data-transfer')

.factory('serviceFactory', ['uploadService', 'mockService', function(uploadService, mockService){
	
	return {
		getService: function(service){
			var returnedService = {};
			switch (service) {
				case 'mock':
					returnedService = mockService;
					break;
				case 'upload':
					returnedService = uploadService;
					break;
				default:
					returnedService = mockService;
					break;
			}

			return returnedService;
		}
	};
}]);
;
angular.module('data-transfer')

.factory('uploadService', function(){
	return{
		toto: 'upload'
	};
});
;
angular.module('data-transfer')

.controller('dropController', [function(){
	
}]);
;
angular.module('data-transfer')

.controller('transfersController', ['serviceFactory', function(serviceFactory){
	var service = serviceFactory.getService('mock');
	
}]);
;
angular.module('data-transfer')

.controller('viewController', ['$scope', '$rootScope', 'configService', function($scope, $rootScope, configService){
	$scope.displayedTransfers = [];
	$scope.page = '';
	$scope.pageCount = 0;
	$rootScope.transfers = [
					{
						"name": "DICOM_patientXY_1.dcm",
						"size": "1.5 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_2.dcm",
						"size": "1.7 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "VSD.Thorax.089Y.M.CT.7.000.dcm.zip",
						"size": "2 GB",
						"transferType": "Download",
						"status": "Queued"
					},
					{
						"name": "NIFTI_patientXY.nii",
						"size": "1.2 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_1.dcm",
						"size": "1.5 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_2.dcm",
						"size": "1.7 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "VSD.Thorax.089Y.M.CT.7.000.dcm.zip",
						"size": "2 GB",
						"transferType": "Download",
						"status": "Queued"
					},
					{
						"name": "NIFTI_patientXY.nii",
						"size": "1.2 MB",
						"transferType": "Upload",
						"status": "Queued"
					}
				];

	// Function that changes the page of the table (by changing displayed transfers)
	// num: number of the page to display
	$scope.changePage = function (num) {
		currentPage = num; // Change currentPage
		$scope.displayedTransfers = []; // Flushing displayed transfers array
		var displayedQty = configService.getDisplayedTransfersQty();
		// Loop that adds the correct number of transfers into the displayedTransfers array
		for (var i = 0, trans = (num - 1) * 5; i < displayedQty; i++ , trans++) {
			if ($rootScope.transfers[trans] !== undefined) // If the current transfer exist
			if ($scope.page != 'upload' || $rootScope.transfers[trans].transferType == 'Upload') { // Check conditions to display current transfer (page different than "upload" or transfer type is "Upload")
				$scope.displayedTransfers.push($rootScope.transfers[trans]); // Affect the current displayedTransfer
			}
			else { // If transfer shouldn't be displayed
				i--; // Decrement i. It has for effect to stay at the same index in the display array
			}
			else // If the transfer doesn't exisit
				i = displayedQty; // Go out of the loop
		}
	};
	
	$scope.definePagination = function(){
		var displayedQty = configService.getDisplayedTransfersQty();
		$scope.pageCount = ($rootScope.transfers.length / displayedQty) + 1; // Calculate number of pages from number of transfers to display
		// init bootpag
		$('#page-selection').bootpag({
			total: $scope.pageCount,
			maxVisible: displayedQty,
			firstLastUse: true,
			first: '←',
			last: '→',
		})
			// When the user navigates in the pagination
			.on("page", function (event, num) {
				$scope.changePage(num); // Change the current page
				$scope.$apply(); // Apply changes to be displayed on the view
			});
		if ($scope.page != 'upload') // If the page is not "upload"
			$scope.defineBodyPadding(); // Define bottom padding of the body
	};

	// Function that defines the bottom padding of the body. The goal is to always have the body above the transfers view in home page
	$scope.defineBodyPadding = function () {
		var body = $("body"); // Get the body with jQuery		
		body.css("padding-bottom", fileTransfersView.css("height")); // Bottom padding is equals to transfers view height
	};
	
	var fileTransfersView = $("#fileTransfersView"); // Get the view with jQuery
	var imgChevronCollapse = $("#imgChevronCollapse"); // Get icon with jQuery
	$scope.definePagination();
	$scope.changePage(1);
		
	// Detects when the user click on the chevron icon of the transfers view
	imgChevronCollapse.on('click', function(){
		// Change the class to display an up or a down chevron (up when view is collapsed)
		if (imgChevronCollapse.hasClass("fa-chevron-down")) { 
			imgChevronCollapse.removeClass("fa-chevron-down"); 
			imgChevronCollapse.addClass("fa-chevron-up");
		}
		else if (imgChevronCollapse.hasClass("fa-chevron-up")) {
			imgChevronCollapse.removeClass("fa-chevron-up");
			imgChevronCollapse.addClass("fa-chevron-down");
		}
	});

	// When the view is collapsed
	fileTransfersView.on("hidden.bs.collapse", function () {
		if ($scope.page != 'upload')
			$scope.defineBodyPadding();
	});

	// When the view is shown
	fileTransfersView.on("shown.bs.collapse", function () {
		if ($scope.page != 'upload')
			$scope.defineBodyPadding();
	});
	
	// Event that is emitted when the ng-repeat directive (which displays all transfers that must be displayed) has finish to display all transfers			
	$scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
		if ($scope.page != 'upload') // If the page isn't "upload"
			$scope.defineBodyPadding(); // Define the padding of the body
	});
}])
// Directive that fires an event when ng-repeat is finished
// (found on the internet: http://stackoverflow.com/questions/15207788/calling-a-function-when-ng-repeat-has-finished)
.directive('onFinishRender', function ($timeout) {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			if (scope.$last === true) {
				$timeout(function () {
					scope.$emit(attr.onFinishRender);
				});
			}
		}
	};
});
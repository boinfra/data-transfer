angular.module('data-transfer')

	.controller('viewController', ['$scope', 'configService', 'transfersService', function ($scope, configService, transfersService) {
		$scope.displayedTransfers = []; // Transfers that are displayed in the view (size milited in the settings and content changes each times user changes page in the view)
		$scope.page = ''; // Name of the page (in the application)
		$scope.pageCount = 0; // Number of pages in the view 
		$scope.currentPage = 1; // Current page in the view

		// $(window).on('loaded', function () {
		var transfers = transfersService.getTransfers(); // All transfers (from transfersService)
		// $scope.definePagination();
		// $scope.changePage(1);
		// 	$scope.$apply();
		// });

		// Progress event sent by the service (mock or upload)
		$(window).on('progress', function (e) {
			// Search the corresponding transfer in transfers array
			for (var i = 0; i < transfers.length; i++) {
				var currentTransfer = transfers[i];
				if (currentTransfer === e.file) { // If corresponding
					currentTransfer.status = e.state; // Set transfer status
					currentTransfer.prog = e.prog; // Set transfer progress (to display the progressBar)
					currentTransfer.time = e.time;
					currentTransfer.elapsedTime = e.elapsedTime; // Set elapsed time
					currentTransfer.remainingTime = e.remainingTime; // Set remaining time
					$scope.$apply(); // Apply changes to the scope. This is used to refresh the view
					i = transfers.length; // Out of the loop
				}
			}
		});

		// Complete event sent by the service (mock or upload)
		$(window).on('complete', function (e) {
			// Search the corresponding transfer in transfers array
			for (var i = 0; i < transfers.length; i++) {
				var currentTransfer = transfers[i];
				if (currentTransfer === e.file) { // If corresponding
					currentTransfer.status = e.state; // Set transfer status
					if (e.state === 'Failed') { // If the upload has failed
						currentTransfer.prog = 0; // Set progress to 0%
					}
					$scope.$apply(); // Apply changes to the scope. This is used to refresh the view
					i = transfers.length; // Out of the loop
				}
			}
		});

		// Function that starts the upload (Sent by clicking on the start button)
		$scope.start = function (trans) {
			transfersService.start(trans);
		};

		// Function that suspends the upload (Sent by clicking on the pause button)
		$scope.pause = function (trans) {
			transfersService.pause(trans);
		};

		// Function that stops the upload (Sent by clicking on the stop button)
		$scope.stop = function (trans) {
			transfersService.stop(trans);
		};

		// Function that changes the page of the table (by changing displayed transfers)
		// num: number of the page to display
		$scope.changePage = function (num) {
			if (num !== 0)
				currentPage = num; // Change currentPage
			$scope.displayedTransfers = []; // Flushing displayed transfers array
			var displayedQty = configService.getDisplayedTransfersQty();
			transfers = transfersService.getTransfers();
			// Loop that adds the correct number of transfers into the displayedTransfers array
			for (var i = 0, trans = (currentPage - 1) * 5; i < displayedQty; i++ , trans++) {
				if (transfers[trans] !== undefined) { // If the current transfer exist
					if ($scope.page != 'upload' || transfers[trans].transferType == 'Upload') { // Check conditions to display current transfer (page different than "upload" or transfer type is "Upload")
						$scope.displayedTransfers.push(transfers[trans]); // Affect the current displayedTransfer
					}
					else { // If transfer shouldn't be displayed
						i--; // Decrement i. It has for effect to stay at the same index in the display array
					}
				}
				else // If the transfer doesn't exisit
					i = displayedQty; // Go out of the loop
			}
		};

		$scope.definePagination = function () {
			var displayedQty = configService.getDisplayedTransfersQty();
			$scope.pageCount = (transfersService.getTransfers().length / displayedQty) + 1; // Calculate number of pages from number of transfers to display
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
		imgChevronCollapse.on('click', function () {
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
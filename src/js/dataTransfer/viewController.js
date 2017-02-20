var dt = dt || angular.module('data-transfer', ['dt-download', 'ui.bootstrap', 'templates-dataTransfer']);

dt.controller('viewController', ['$scope', 'configService', 'transfersService', function ($scope, configService, transfersService) {
	/** Viewmodels for files */
	var filesVM = [];
	/** Current page of the pagination in the view */
	var currentPage = 1;

	// Event triggered when a transfer is started
	$(window).on('start', function (e) {
		var newFile = { // New file (fileVM)
			name: e.filename,
			downloadUrl: e.url,
			transferType: e.transferType,
			status: 'Pending',
			prog: 0,
			aborted: false
		};
		if (filesVM.indexOf(filesVM.filter(function (f) {
			return f.name === e.filename && f.transferType === e.transferType;
		})[0]) === -1) { // If the fileVM doesn't exist
			filesVM.push(newFile); // Add it to the array
		}
		$scope.definePagination(); // Define the pagination (show only files that are on the current page)
	});

	// Event triggered when a transfer is finished
	$(window).on('finished', function (e) {
		var file = filesVM.filter(function (f) {
			return f.name === e.filename;
		})[0]; // Get the transfer in the array that has the filename specified in the event
		file.status = e.state; // CHange status
		$scope.$apply(); // Apply changes in the scope
	});

	// Event that notifies the progress of the transfer
	$(window).on('progress', function (e) {
		var file = filesVM.filter(function (f) {
			return f.name === e.filename;
		})[0]; // Get the transfer in the array that has the filename specified in the event
		file.status = 'Pending';
		file.prog = Math.floor(e.prog);
		file.displaySize = function () { // Format the size of the file to display it with the correct unit (B, KB or MB)
			var cptDiv = 0;
			var size = e.size;
			while (size > 1024) {
				size /= 1024;
				cptDiv++;
			}
			return (Number((size).toFixed(0))) + (cptDiv == 2 ? ' MB' : cptDiv == 1 ? ' KB' : ' B');
		};
		file.elapsedTime = e.elapsedTime / 1000;
		file.speed = (e.loaded / e.elapsedTime) / 1024;
		file.remainingTime = ((e.elapsedTime / e.prog) * (100 - e.prog)) / 1000;
		if (!file.aborted) {
			$scope.$apply(); // Apply changes in the scope
		}
	});

	/**
	 * Starts the transfer
	 * @param {object} trans Transfer to start
	 */
	$scope.start = function (trans) {
		trans.aborted = false;
		var index = filesVM.indexOf(trans);
		trans.status = 'Pending';
		if (trans.transferType === 'Upload') {
			// transfersService.start(files[index]);
		}
		else if (trans.transferType === 'Download') {
			transfersService.downloadFile(trans.name, trans.downloadUrl);
		}
	};

	/**
	 * Stops the transfer
	 * @param {object} trans Transfer to stop
	 * @param {number} index Index of the transfer in the view
	 */
	$scope.stop = function (trans, index) {
		trans.aborted = true;
		transfersService.stop(trans.transferType, trans, index, function (t) {
			var file = filesVM[filesVM.indexOf(t)];
			file.speed = 0;
			file.elapsedTime = 0;
			file.prog = 0;
			file.remainingTime = 0;
			file.status = 'Queued';
		});
		//$scope.$apply();
	};

	/**
	 * Function that changes the page of the table (by changing displayed transfers)
	 * @param {number} num number of the page to display
	 */
	$scope.changePage = function (num) {
		if (num !== 0)
			currentPage = num; // Change currentPage
		$scope.displayedTransfers = []; // Flushing displayed transfers array
		var displayedQty = configService.getDisplayedTransfersQty();
		transfers = filesVM;
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

	/**
	 * Function that defines the pagination (counts how many pages are needed to show all transfers)
	 */
	$scope.definePagination = function () {
		var displayedQty = configService.getDisplayedTransfersQty();
		$scope.pageCount = (filesVM.length / displayedQty) + 1; // Calculate number of pages from number of transfers to display
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
		if ($scope.page != 'upload') { // If the page is not "upload"
			$scope.defineBodyPadding(); // Define bottom padding of the body
		}
		$scope.changePage(currentPage);
	};

	/**
	 * Function that defines the bottom padding of the body. The goal is to always have the body above the transfers view in home page
	 */
	$scope.defineBodyPadding = function () {
		var body = $("body"); // Get the body with jQuery		
		body.css("padding-bottom", fileTransfersView.css("height")); // Bottom padding is equals to transfers view height
	};

	var fileTransfersView = $("#fileTransfersView"); // Get the view with jQuery
	var imgChevronCollapse = $("#imgChevronCollapse"); // Get icon with jQuery

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
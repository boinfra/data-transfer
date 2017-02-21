var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.controller('viewController', ['$scope', 'configService', 'transfersService', function ($scope, configService, transfersService) {
	/** Viewmodels for files */
	var filesVM = [];
	/** Files for upload */
	var files = [];
	/** Current page of the pagination in the view */
	var currentPage = 1;
	/** Transfers that are displayed in the view */
	$scope.displayedTransfers = [];
	/** Transfers that are selected */
	$scope.selectedTransfers = [];
	/** Transfers that have failed */
	$scope.failedTransfers = [];
	/** Indicates if some transfers are running */
	$scope.areTransfersRunning = false;

	// Define the padding of the body, so it is displayed above the view
	window.onload = function () {
		$scope.defineBodyPadding();
	};

	// Event triggered when a transfer is started
	$(window).on('start', function (e) {
		var newFile = { // New file (fileVM)
			selected: false,
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
		file.status = e.state; // Change status
		$scope.areTransfersRunning = filesVM.filter(function (t) {
			return t.status === 'Pending';
		}).length > 0;
		if (e.state === 'Failed') {
			if ($scope.failedTransfers.indexOf(file) === -1) {
				$scope.failedTransfers.push(file);
			}
		}
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

	$(window).on('dropped', function (e) {
		var newFile = { // New file (fileVM)
			selected: false,
			name: e.file.name,
			transferType: 'Upload',
			status: 'Queued',
			prog: 0,
			aborted: false,
			size: e.file.size,
			displaySize: function () {
				var cptDiv = 0;
				var size = this.size;
				while (size > 1024) {
					size /= 1024;
					cptDiv++;
				}
				return (Number((size).toFixed(0))) + (cptDiv == 2 ? ' MB' : cptDiv == 1 ? ' KB' : ' B');
			},
		};
		filesVM.push(newFile);
		files.push(e.file);
		$scope.definePagination();
		$scope.$apply();
	});

	/**
	 * Starts the transfer
	 * @param {object} trans Transfer to start
	 */
	$scope.start = function (trans) {
		trans.aborted = false;
		var index = filesVM.indexOf(trans);
		if (trans.transferType === 'Upload') {
			transfersService.uploadFile(files[index]);
		}
		else if (trans.transferType === 'Download') {
			transfersService.downloadFile(trans.name, trans.downloadUrl);
		}
	};

	/**
	 * Deletes selected transfers
	 */
	$scope.delete = function () {
		$scope.selectedTransfers.forEach(function (t) {
			var index = filesVM.indexOf(t);
			filesVM.splice(index, 1);
			files.splice(index, 1);
		});
		$scope.selectedTransfers = [];
		$scope.definePagination();
	};

	/**
	 * Retries all failed transfers
	 */
	$scope.retryFailed = function () {
		$scope.failedTransfers.forEach(function (t) {
			$scope.start(t);
		});
	};

	/**
	 * Function that selects / deselects all transfers
	 */
	$scope.toggleAll = function () {
		if ($scope.selectedTransfers.length === $scope.displayedTransfers.length) {
			$scope.displayedTransfers.forEach(function (t) {
				if (t.selected) {
					$scope.toggle(t);
				}
			});
		}
		else {
			$scope.displayedTransfers.forEach(function (t) {
				if (!t.selected) {
					$scope.toggle(t);
				}
			});
		}
		$scope.selectedTransfers = $scope.displayedTransfers.filter(function (t) {
			return t.selected;
		});
	};

	/**
	 * Starts all selected transfers
	 */
	$scope.startSelected = function () {
		$scope.selectedTransfers.forEach(function (t) {
			$scope.start(t);
		});
	};

	/**
	 * Stops the transfer
	 * @param {object} trans Transfer to stop
	 */
	$scope.stop = function (trans) {
		trans.aborted = true;
		transfersService.stop(trans.transferType, trans, function (t) {
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
	 * Function that changes the checked status of the transfer
	 * @param {object} trans transfer to change status
	 */
	$scope.toggle = function (transfer) {
		transfer.selected = !transfer.selected;
		$scope.selectedTransfers = $scope.displayedTransfers.filter(function (t) {
			return t.selected;
		});
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
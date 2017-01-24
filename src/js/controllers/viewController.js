angular.module('data-transfer')

	.controller('viewController', ['$scope', 'configService', 'transfersService', function ($scope, configService, transfersService) {

		var files = [];
		var filesVM = [];
		$scope.runningTransfers = [];
		$scope.displayedTransfers = [];
		$scope.selectedTransfers = [];
		$scope.failedTransfers = [];
		var currentPage = 1;
		$scope.allSelected = false;
		var selectedTransfersCompleted = 0;
		var failedTransfersRetried = 0;
		$scope.areTransfersRunning = false;

		$(window).on('filePushed', function (e) {
			files.push(e.file);
			$scope.runningTransfers = transfersService.getRunningTransfers();
			var sta = 'Queued';
			for (var i = 0; i < $scope.runningTransfers.length; i++) {
				if ($scope.runningTransfers[i].name == e.file.name) {
					sta = 'Pending';
					i = $scope.runningTransfers.length;
				}
			}
			var newFileVM = {
				name: e.file.name,
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
				status: sta,
				transferType: 'Upload',
				selected: false
			};
			filesVM.push(newFileVM);
			$scope.displayedTransfers.push(newFileVM);
			$scope.definePagination();
			$scope.changePage(currentPage);
			$scope.$apply();
		});

		$(window).on('run', function (e) {
			var index = files.indexOf(e.file);
			filesVM[index].status = e.state;
		});

		$(window).on('progress', function (e) {
			var index = files.indexOf(e.file); // Get the index of the file in the transfers array
			filesVM[index].elapsedTime = e.elapsedTime;
			filesVM[index].remainingTime = e.remainingTime;
			$scope.$apply();
		});

		$(window).on('finished', function (e) {
			var index = files.indexOf(e.file); // Get the index of the file in the transfers array
			var offset = 0;
			if ($scope.selectedTransfers.length > 0) {
				if ($scope.selectedTransfers.indexOf(filesVM[index]) > -1) {
					offset = selectedTransfersCompleted + configService.getConcurentTransfersQty();
					selectedTransfersCompleted++;
					if (offset < $scope.selectedTransfers.length) {
						$scope.start($scope.selectedTransfers[offset]);
					}
				}
			}
			if ($scope.failedTransfers.length > 0) {
				if ($scope.failedTransfers.indexOf(filesVM[index]) > -1) {
					offset = failedTransfersRetried + configService.getConcurentTransfersQty();
					failedTransfersRetried++;
					if (offset < $scope.failedTransfers.length) {
						$scope.start($scope.failedTransfers[offset]);
					}
				}
			}
			filesVM[index].status = e.state;
			$scope.failedTransfers = filesVM.filter(function (t) {
				return t.status === 'Failed';
			});
			$scope.areTransfersRunning = filesVM.filter(function (t) {
				return t.status === 'Pending';
			}).length > 0;
			if (e.service === 'mock') {
				$scope.$apply();
			}
		});

		$scope.toggle = function (transfer) {
			transfer.selected = !transfer.selected;
			$scope.selectedTransfers = $scope.displayedTransfers.filter(function (t) {
				return t.selected;
			});
		};

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

		$scope.delete = function () {
			$scope.selectedTransfers.forEach(function (t) {
				var index = filesVM.indexOf(t);
				transfersService.removeFile(files[index]);
				filesVM.splice(index, 1);
				files.splice(index, 1);
			});
			$scope.failedTransfers = filesVM.filter(function (t) {
				return t.status === 'Failed';
			});
			$scope.selectedTransfers = [];
			selectedTransfersCompleted = 0;
			failedTransfersRetried = 0;
			$scope.definePagination();
			$scope.changePage(currentPage);
		};

		$scope.start = function (trans) {
			var index = filesVM.indexOf(trans);
			transfersService.start(files[index]);
		};

		$scope.startSelected = function () {
			$scope.selectedTransfers.forEach(function (t) {
				$scope.start(t);
			});
		};

		$scope.retryFailed = function () {
			$scope.failedTransfers.forEach(function (t) {
				$scope.start(t);
			});
		};

		// Function that changes the page of the table (by changing displayed transfers)
		// num: number of the page to display
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
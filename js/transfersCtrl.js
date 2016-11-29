// Main module of the framework
angular.module("data-transfer")
	// Controller that handles all transfers (linked mainly to the transfersView) (used by dropController)
	.controller("TransfersController", ["$scope", "$http",
		function ($scope, $http) {
			$scope.page = ""; // Indicates if user is on upload page or not
			$scope.transfers = []; // Array that contains all transfers
			$scope.displayedTransfers = []; // Array that contains transfers that should be displayed
			$scope.displayedTransfersCount = 5; // Amount of transfers displayed in a page of the table
			var currentPage = 1; // Memories which page of the table is displayed

			// Function that is called to push transfers into transfers array
			// trans: transfer to push (object)
			$scope.pushTransfer = function (trans) {
				$scope.transfers.push(trans); // Pushing into array
				$scope.$apply(function () { // Applying changes
					$scope.changePage(currentPage); // Change displayed transfers (by changing page)
				});
			};

			// Function that changes the page of the table (by changing displayed transfers)
			// num: number of the page to display
			$scope.changePage = function (num) {
				currentPage = num; // Change currentPage
				$scope.displayedTransfers = []; // Flushing displayed transfers array
				// Loop that adds the correct number of transfers into the displayedTransfers array
				for (var i = 0, trans = (num - 1) * 5; i < $scope.displayedTransfersCount; i++ , trans++) {
					if ($scope.transfers[trans] !== undefined) // If the current transfer exist
						if ($scope.page != 'upload' || $scope.transfers[trans].transferType == 'Upload') { // Check conditions to display current transfer (page different than "upload" or transfer type is "Upload")
							$scope.displayedTransfers[i] = $scope.transfers[trans]; // Affect the current displayedTransfer
						}
						else { // If transfer shouldn't be displayed
							i--; // Decrement i. It has for effect to stay at the same index in the display array
						}
					else // If the transfer doesn't exisit
						i = $scope.displayedTransfersCount; // Go out of the loop
				}
			};

			// Function that defines the bottom padding of the body. The goal is to always have the body above the transfers view in home page
			$scope.defineBodyPadding = function () {
				var body = $("body"); // Get the body with jQuery		
				body.css("padding-bottom", fileTransfersView.css("height")); // Bottom padding is equals to transfers view height
			}

			// Event that is emitted when the ng-repeat directive (which displays all transfers that must be displayed) has finish to display all transfers			
			$scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
				if ($scope.page != 'upload') // If the page isn't "upload"
					$scope.defineBodyPadding(); // Define the padding of the body
				paginate(); // Build and display the pagination
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
		}
	});
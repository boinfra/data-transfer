angular.module("data-transfer")
	
	.controller("TransfersController", ["$scope", "$http", "ConfigService",
		function ($scope, $http, ConfigService) {
			$scope.page = "";
			$scope.transfers = [];
			$scope.uploadTransfers = [];
			$scope.displayedTransfers = [];
			$scope.displayedTransfersCount = 5;
			$scope.pageCount = 1;
			var currentPage = 1;

			$scope.pushTransfer = function (trans) {
				$scope.transfers.push(trans);
				if (trans.transferType == "Upload") {
					$scope.uploadTransfers.push(trans);
				}
				$scope.$apply(function () {
					$scope.changePage(currentPage);
				});	
			};

			$scope.changePage = function (num) {
				currentPage = num;
				var array = $scope.page == 'upload' ? $scope.uploadTransfers : $scope.transfers;
				$scope.displayedTransfers = [];
				for (var i = 0, trans = (num - 1) * 5; i < $scope.displayedTransfersCount; i++ , trans++) {
					if (array[trans] !== undefined)
						if ($scope.page == 'browse' || array[trans].transferType == 'Upload') {
							$scope.displayedTransfers[i] = array[trans];
						}
						else {
							i--;
						}
					else
						i = $scope.displayedTransfersCount;
				}
			};
			
			$scope.defineBodyPadding = function () {
				var body = $("body");
				body.css("padding-bottom", fileTransfersView.css("height"));
			}

			$scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
				if ($scope.page == 'browse')
					$scope.defineBodyPadding();
				paginate();
			});
		}])

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
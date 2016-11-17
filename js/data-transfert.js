angular.module("data-transfert", [])

	.controller("TransfertsController", ["$scope", "$http", "ConfigService",
		function ($scope, $http, ConfigService) {
			$scope.transferts = [];
			$scope.displayedTransferts = [];
			$scope.displayedTransfertsCount = 5;
			$scope.pageCount = 1;

			$scope.changePage = function (num) {
				$scope.displayedTransferts = [];
				for (var i = 0, trans = (num - 1) * 5; i < $scope.displayedTransfertsCount; i++ , trans++) {
					if ($scope.transferts[trans] !== undefined)
						$scope.displayedTransferts[i] = $scope.transferts[trans];
					else
						i = $scope.displayedTransfertsCount;
				}
			};

			$http.get(ConfigService.Url).success(function (data) {
				$scope.transferts = data;
				$scope.changePage(1);
			});

			$scope.$on('ngRepeatFinishedBrowse', function (ngRepeatFinishedEvent) {
				defineBodyPadding();
				paginate();
			});

			$scope.$on('ngRepeatFinishedUpload', function (ngRepeatFinishedEvent) {
				w3IncludeHTML();
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
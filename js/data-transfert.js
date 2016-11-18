angular.module("data-transfert", [])

	.controller("TransfertsController", ["$scope", "$http", "ConfigService",
		function($scope, $http, ConfigService) {
			$scope.page = "";
			$scope.transferts = [];
			$scope.uploadTransferts = [];
			$scope.displayedTransferts = [];
			$scope.displayedTransfertsCount = 5;
			$scope.pageCount = 1;

            $scope.changePage = function(num) {
                var array = $scope.page == 'upload' ? $scope.uploadTransferts : $scope.transferts;
				$scope.displayedTransferts = [];
				for (var i = 0, trans = (num - 1) * 5; i < $scope.displayedTransfertsCount; i++ , trans++) {
					if (array[trans] !== undefined)
						if ($scope.page == 'browse' || array[trans].transfertType == 'Upload') {
							$scope.displayedTransferts[i] = array[trans];
						}
						else {
							i--;
						}
					else
						i = $scope.displayedTransfertsCount;
				}
			};

			$http.get(ConfigService.Url).success(function(data) {
				$scope.transferts = data;
				for (var i = 0; i < $scope.transferts.length; i++) {
                    if ($scope.transferts[i].transfertType == 'Upload') {
                        $scope.uploadTransferts.push($scope.transferts[i]);
					}
				}
				$scope.changePage(1);
			});

			$scope.defineBodyPadding = function() {
				var body = $("body");
				body.css("padding-bottom", fileTransfertsView.css("height"));
			}

			$scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
				if ($scope.page == 'browse')
					$scope.defineBodyPadding();
				paginate();
			});
		}])

	.directive('onFinishRender', function($timeout) {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				if (scope.$last === true) {
					$timeout(function() {
						scope.$emit(attr.onFinishRender);
					});
				}
			}
		}
	});
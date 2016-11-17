angular.module("data-transfert", [])

	.controller("FilesController", ["$scope", "$http", "ConfigService",
		function ($scope, $http, ConfigService) {
		$scope.files = [];

		$http.get(ConfigService.Url).success(function (data) {
			$scope.files = data;
		});
	}]);
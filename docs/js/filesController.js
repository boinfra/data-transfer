angular.module('app')

	.controller('filesController', ['$scope', '$http', 'transfersService', 'configService', function ($scope, $http, transfersService, configService) {
		$scope.files = [];
		$scope.filesVM = [];
		$scope.selectedFiles = [];

		$http.get(configService.getFilesURL()).then(function (data) {
			$scope.files = data.data.items;
			$scope.files.forEach(function (f) {
				$scope.filesVM.push({ name: f.name, downloadUrl: f.downloadUrl, selected: false });
			})
		});

		$scope.download = function (url, name) {
			transfersService.downloadFile(name, url);
		};

		$scope.downloadSelected = function () {
			$scope.selectedFiles.forEach(function (f) {
				$scope.download(f.downloadUrl, f.name);
			})
		};

		$scope.changeSelected = function (file) {
			file.selected = !file.selected;
			if (file.selected) {
				$scope.selectedFiles.push(file);
			}
			else {
				$scope.selectedFiles.splice($scope.selectedFile.indexOf(file), 1);
			}
		};
	}]);
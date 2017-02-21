var dtUpload = dtUpload || angular.module('dt-upload', []);

dtUpload.directive('dtDropZone', function () {
	return {
		restrict: 'E',
		templateUrl: 'js/dt-upload/dropZone.tpl.html'
	};
});
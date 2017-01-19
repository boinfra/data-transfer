angular.module('data-transfer')

	.directive('dtDropZone', function () {
		return {
			restrict: 'E',
			templateUrl: '/dataTransfer/src/js/Directives/templates/dropZone.html'
		};
	});
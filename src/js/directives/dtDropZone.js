angular.module('data-transfer')

	.directive('dtDropZone', function () {
		return {
			restrict: 'E',
			templateUrl: 'js/directives/templates/dropZone.tpl.html'
		};
	});
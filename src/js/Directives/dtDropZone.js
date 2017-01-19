angular.module('data-transfer')

	.directive('dtDropZone', function () {
		return {
			restrict: 'E',
			templateUrl: 'js/Directives/templates/dropZone.tpl.html'
		};
	});
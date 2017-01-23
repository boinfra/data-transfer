angular.module('data-transfer')

	.directive('dtTransfersView', function () {
		return {
			restrict: 'E',
			scope: {
				page: '='
			},
			templateUrl: 'js/directives/templates/transfersView.tpl.html'
		};
	});
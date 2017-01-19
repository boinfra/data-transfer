angular.module('data-transfer')

	.directive('dtTransfersView', function () {
		return {
			restrict: 'E',
			scope: {
				page: '='
			},
			templateUrl: '/dataTransfer/src/js/Directives/templates/transfersView.tpl.html'
		};
	});
var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.directive('dtTransfersView', function () {
	return {
		restrict: 'E',
		scope: {
			page: '='
		},
		templateUrl: 'js/dataTransfer/transfersView.tpl.html'
	};
});
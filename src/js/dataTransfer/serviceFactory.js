var dt = dt || angular.module('data-transfer', ['dt-download', 'ui.bootstrap', 'templates-dataTransfer']);

dt.service('serviceFactory', ['downloadService', function (downloadService) {
	return {
		/**
		 * Create the desired service (inspired by the factory pattern)
		 * @param {string} service name of the deisred service
		 * @returns desired service depending on the name passed in arguments
		 */
		getService: function (service) {
			if (service.toLowerCase().indexOf('down') > -1) {
				return downloadService;
			}
		}
	};
}]);
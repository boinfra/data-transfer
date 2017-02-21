var dt = dt || angular.module('data-transfer', ['dt-download', 'dt-upload', 'ui.bootstrap', 'templates-dataTransfer']);

dt.service('serviceFactory', ['downloadService', 'uploadService', function (downloadService, uploadService) {
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
			else if (service.toLowerCase().indexOf('up') > -1) {
				return uploadService;
			}
		}
	};
}]);
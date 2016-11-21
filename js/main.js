angular.module("app", ["data-transfer"])

	.config(["$httpProvider", "DemoDataProvider", function ($httpProvider, DemoDataProvider) {
		
		var interceptor = ["$rootScope", "$q", "$location", "ConfigService",
			function ($rootScope, $q, $location, ConfigService) {

			var demoData = DemoDataProvider.$get();

			return {
				'request': function (request) {
					if (request.url.indexOf(ConfigService.Url) > -1) {
						request.timeout = 1;
					}
					return request;
				},
				'responseError': function (response) {
					if (response.config.url.indexOf(ConfigService.Url) > -1) {
						response.data = demoData.getFiles();
						response.status = 200;
					}
					return response;
				}
			};

		}];

		$httpProvider.interceptors.push(interceptor);
	}])
	
	.provider("DemoData", function DemoDataProvider() {
		function DemoData() {
			this.getFiles = function () {
				return [
					{
						"name": "DICOM_patientXY_1.dcm",
						"size": "1.5 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_2.dcm",
						"size": "1.7 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "VSD.Thorax.089Y.M.CT.7.000.dcm.zip",
						"size": "2 GB",
						"transferType": "Download",
						"status": "Queued"
					},
					{
						"name": "NIFTI_patientXY.nii",
						"size": "1.2 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_1.dcm",
						"size": "1.5 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_2.dcm",
						"size": "1.7 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "VSD.Thorax.089Y.M.CT.7.000.dcm.zip",
						"size": "2 GB",
						"transferType": "Download",
						"status": "Queued"
					},
					{
						"name": "NIFTI_patientXY.nii",
						"size": "1.2 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_1.dcm",
						"size": "1.5 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_2.dcm",
						"size": "1.7 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "VSD.Thorax.089Y.M.CT.7.000.dcm.zip",
						"size": "2 GB",
						"transferType": "Download",
						"status": "Queued"
					},
					{
						"name": "NIFTI_patientXY.nii",
						"size": "1.2 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_1.dcm",
						"size": "1.5 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "DICOM_patientXY_2.dcm",
						"size": "1.7 MB",
						"transferType": "Upload",
						"status": "Queued"
					},
					{
						"name": "VSD.Thorax.089Y.M.CT.7.000.dcm.zip",
						"size": "2 GB",
						"transferType": "Download",
						"status": "Queued"
					},
					{
						"name": "NIFTI_patientXY.nii",
						"size": "1.2 MB",
						"transferType": "Upload",
						"status": "Queued"
					}
				];
			};
		};

		this.$get = function demoDataFactory() {
			return new DemoData();
		};
	})
	
	.service("ConfigService", function () {
		this.Url = "https://localhost/data-transfer/files";
	});
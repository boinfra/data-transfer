angular.module('data-transfer')

	.factory('browserDetectionService', function () {
		return {
			isChrome: function () {
				return true;
			},
			getBrowserInfo: function () {
				var browserInfo = {};
				var webkit = detectWebKit();
				console.debug(webkit);
				browserInfo.hasWebkit = webkit.iswebkit;
				browserInfo.webkitVersion = parseFloat(webkit.version);
				browserInfo.name = webkit.browser.substr(0, webkit.browser.search(/\d/));
				browserInfo.version = webkit.browser.substr(webkit.browser.search(/\d/));

				return browserInfo;
			}
		};
	});
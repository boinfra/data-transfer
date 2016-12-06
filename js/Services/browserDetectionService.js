angular.module('data-transfer')

	.factory('browserDetectionService', function(){
		return {
			isChrome: function(){
				var chrome,
				// Code copied from internet (http://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome)	
					isChromium = window.chrome,
					winNav = window.navigator,
					vendorName = winNav.vendor,
					isOpera = winNav.userAgent.indexOf("OPR") > -1,
					isIEedge = winNav.userAgent.indexOf("Edge") > -1,
					isIOSChrome = winNav.userAgent.match("CriOS"),
					message = document.getElementById("dropMessage");

				if (isIOSChrome) {
					chrome = true;
				} else if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isIEedge === false) {
					chrome = true;
				} else {
					chrome = false;
				}

				return chrome;
			}
		};
	});
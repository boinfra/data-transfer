function isChrome() {
	// Cross browser support
	var isChromium = window.chrome,
		chrome,
		winNav = window.navigator,
		vendorName = winNav.vendor,
		isOpera = winNav.userAgent.indexOf("OPR") > -1,
		isIEedge = winNav.userAgent.indexOf("Edge") > -1,
		isIOSChrome = winNav.userAgent.match("CriOS"),
		message = document.getElementById("dropMessage");

	if (isIOSChrome) {
		message.innerHTML = "Drag n'drop your files or folders here";
		chrome = true;
	} else if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isIEedge == false) {
		message.innerHTML = "Drag n'drop your files or folders here";
		chrome = true;
	} else {
		message.innerHTML = "Drag n'drop your files here";
		chrome = false;
	}

	return chrome;
}
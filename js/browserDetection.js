// Function that returns true if the user is using a browser that is compatible with webkit technology (which alloes to drop folders)
function isChrome() {
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
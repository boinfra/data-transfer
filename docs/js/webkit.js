function parse_webkit_version(version) {
	var bits = version.split(".");
	var isnightly = (version[version.length - 1] == "+");
	var minor;
	if (isnightly) {
		minor = "+";
	} else {
		minor = parseInt(bits[1]);
		if (isNaN(minor)) {
			minor = "";
		}
	}
	return {version: version, major: parseInt(bits[0]), minor: minor, isnightly: isnightly};
}

function detectWebKit(aUserAgent) {
	var ua = navigator.userAgent;
	if (aUserAgent) {
		ua = aUserAgent;
	}
	var webkit = false;
	var regex, matches;

	// Check for Safari
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) \\(KHTML, like Gecko\\) Safari/(\\S+)");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "Safari " + matches[2];
	}

	// Check for Safari Windows
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) \\(KHTML, like Gecko\\) Version/(.*) Safari/");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "Safari " + matches[2];
	}

	// Check for Google Chrome
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) \\(KHTML, like Gecko\\) Chrome/(\\S+)");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "Google Chrome " + matches[2];
	}

	// Check for Shiira
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) \\(KHTML, like Gecko\\) Shiira/(.*) Safari/(\\S+)");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "Shiira " + matches[2];
	}

	// Check for OmniWeb 4 or 5
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) \\(KHTML, like Gecko\\) OmniWeb/v(\\S+) ");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "OmniWeb " + matches[2];
	}

	// Check for OmniWeb 5.1 and up
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) \\(KHTML, like Gecko, Safari\\) OmniWeb/v(\\S+) ");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "OmniWeb " + matches[2];
	}

	// Check for NetNewsWire 2 and higher
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) (KHTML, like Gecko) NetNewsWire/(\\S+)");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "NetNewsWire " + matches[2];
	}

	// Check for RealPlayer
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) (KHTML, like Gecko) RealPlayer/(\\S+)");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "RealPlayer " + matches[2];
	}

	// Check for iPhone
	regex = new RegExp("Mozilla/5.0 \\((.*)\\) AppleWebKit/(.*) \\(KHTML, like Gecko\\) Version/.* Mobile/(.*) Safari/(\\S+)");
	matches = regex.exec(ua);
	if (matches) {
		var deviceName = matches[1].split(";")[0];
		var mobileVersion = matches[3];
		var browserVersion = matches[4];
		webkit = parse_webkit_version(matches[2]);
		webkit["browser"] = deviceName + " " + mobileVersion + " " + browserVersion;
	}

	// Check for Adobe Air
	regex = new RegExp("AppleWebKit/(.*) \\(KHTML, like Gecko\\) Safari/(.*) Apollo/(\\S+)");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "Adobe Air " + matches[3];
	}

	// Check for Adobe Air
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) (KHTML, like Gecko) Safari/(.*) Apollo/(\\S+)");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "Adobe Air " + matches[3];
	}

	// Check for Adobe Air
	regex = new RegExp("Mozilla/5.0 \\(.*\\) AppleWebKit/(.*) \\(KHTML, like Gecko\\) AdobeAIR/(\\S+)");
	matches = regex.exec(ua);
	if (matches) {
		webkit = parse_webkit_version(matches[1]);
		webkit["browser"] = "Adobe Air " + matches[2];
	}

	// Make object if not already there
	if (typeof(webkit["browser"]) == "undefined") {
		webkit = [];
		webkit["browser"] = false;
		webkit["major"] = false;
		webkit["minor"] = false;
		webkit["isnightly"] = false;
	}
	// Check for unknown webkit useragent
	if (typeof(webkit["version"]) == "undefined") {
	    var fields = RegExp("(AppleWebKit/)([^ ]+)").exec(ua);
	    if (fields && fields.length > 2) {
		    webkit["version"] = fields[2];
			webkit["isnightly"] = (fields[2][fields[2].length - 1] == "+");
		}
	}
	webkit["useragent"] = ua;
	webkit["iswebkit"] = RegExp("AppleWebKit/").test(ua);

	var ismobile = false, mobiledevice = false, mobileversion = false;
	if (RegExp(" Mobile/").test(ua)) {
		ismobile = true;
		var fields = RegExp("(Mozilla/5.0 \\()([^;]+)").exec(ua);
		if (fields && fields.length > 1) {
			mobiledevice = fields[2];
		}
		var fields = RegExp("( Mobile/)([^ ]+)").exec(ua);
		if (fields && fields.length > 1) {
			mobileversion = fields[2];
		}
	}
	webkit["ismobile"] = ismobile;
	webkit["mobiledevice"] = mobiledevice;
	webkit["mobileversion"] = mobileversion;
	return webkit;
}

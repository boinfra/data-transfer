function allowDrop(ev) {
	ev.preventDefault();
}

function drop(ev) {
	ev.preventDefault();
	var files = ev.dataTransfer.files;
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		var reader = new FileReader();
		reader.readAsText(file);
		reader.onload = (function (theFile) {
			return function (e) {
				console.debug(e.target.result);
        };
      })(file);
	}
}
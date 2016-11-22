var files = { names: [], contents: [], count: 0 };

function allowDrop(ev) {
	ev.preventDefault();
}

function drop(ev) {
	ev.preventDefault();
	for (var i = 0; i < ev.dataTransfer.files.length; i++) {
		var file = ev.dataTransfer.files[i];
		files.names[i] = file.name;
		var reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function (e) {
			files.contents[files.count] = e.target.result;
			console.debug(files.names[files.count]);
			console.debug(files.contents[files.count]);
			files.count++;
		};
	}
}
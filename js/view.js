var fileTransfertsView = $("#fileTransfertsView");
console.debug(fileTransfertsView);

function paginate() {
	var scope = angular.element(fileTransfertsView).scope();
	scope.pageCount = (scope.transferts.length / scope.displayedTransfertsCount) + 1;
	// init bootpag
	$('#page-selection').bootpag({
		total: scope.pageCount,
		maxVisible: 5,
		firstLastUse: true,
		first: '←',
		last: '→',
	}).on("page", function (event, num) {
		scope.changePage(num);
		scope.$apply();
	});
}

function onImgChevronClick() {
	var imgChevronCollapse = $("#imgChevronCollapse");
	if (imgChevronCollapse.hasClass("fa-chevron-down")) {
		imgChevronCollapse.removeClass("fa-chevron-down");
		imgChevronCollapse.addClass("fa-chevron-up");
	}
	else if (imgChevronCollapse.hasClass("fa-chevron-up")) {
		imgChevronCollapse.removeClass("fa-chevron-up");
		imgChevronCollapse.addClass("fa-chevron-down");
	}
}

function defineBodyPadding() {
	var body = $("body");
	body.css("padding-bottom", fileTransfertsView.css("height"));
}

fileTransfertsView.on("hidden.bs.collapse", function () {
	defineBodyPadding();
});

fileTransfertsView.on("shown.bs.collapse", function () {
	defineBodyPadding();
});

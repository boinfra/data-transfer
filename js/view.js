var fileTransfertsView = $("#fileTransfertsView");

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
	defineBodyPadding();
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

fileTransfertsView.on("hidden.bs.collapse", function () {
	defineBodyPadding();
});

fileTransfertsView.on("shown.bs.collapse", function () {
	defineBodyPadding();
});
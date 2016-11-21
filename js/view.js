var fileTransfersView = $("#fileTransfersView");
var scope;

function paginate() {
    scope = angular.element(fileTransfersView).scope()
    var array = scope.page == 'upload' ? scope.uploadTransfers : scope.transfers;
    scope.pageCount = (array.length / scope.displayedTransfersCount) + 1;
    // init bootpag
    $('#page-selection').bootpag({
        total: scope.pageCount,
        maxVisible: 5,
        firstLastUse: true,
        first: '←',
        last: '→',
    }).on("page", function(event, num) {
        scope.changePage(num);
        scope.$apply();
    });
    if (scope.page == 'browse')
        scope.defineBodyPadding();
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

fileTransfersView.on("hidden.bs.collapse", function() {
    if (scope.page == 'browse')
        scope.defineBodyPadding();
});

fileTransfersView.on("shown.bs.collapse", function() {
    if (scope.page == 'browse')
        scope.defineBodyPadding();
});
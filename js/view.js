var fileTransfersView = $("#fileTransfersView"); // Get the view with jQuery
var scope; // scope of the transfersController

// Build and display the pagination
function paginate() {
    scope = angular.element(fileTransfersView).scope(); // Get transfersController's scope
    scope.pageCount = (scope.transfers.length / scope.displayedTransfersCount) + 1; // Calculate number of pages from number of transfers to display
    // init bootpag
    $('#page-selection').bootpag({
        total: scope.pageCount,
        maxVisible: 5,
        firstLastUse: true,
        first: '←',
        last: '→',
    })
        // When the user navigates in the pagination
        .on("page", function (event, num) {
            scope.changePage(num); // Change the current page
            scope.$apply(); // Apply changes to be displayed on the view
        });
    if (scope.page != 'upload') // If the page is not "upload"
        scope.defineBodyPadding(); // Define bottom padding of the body
}

// Detects when the user click on the chevron icon of the transfers view
function onImgChevronClick() {
    var imgChevronCollapse = $("#imgChevronCollapse"); // Get icon with jQuery
    // Change the class to display an up or a down chevron (up when view is collapsed)
    if (imgChevronCollapse.hasClass("fa-chevron-down")) { 
        imgChevronCollapse.removeClass("fa-chevron-down"); 
        imgChevronCollapse.addClass("fa-chevron-up");
    }
    else if (imgChevronCollapse.hasClass("fa-chevron-up")) {
        imgChevronCollapse.removeClass("fa-chevron-up");
        imgChevronCollapse.addClass("fa-chevron-down");
    }
}

// When the view is collapsed
fileTransfersView.on("hidden.bs.collapse", function () {
    if (scope.page != 'upload')
        scope.defineBodyPadding();
});

// When the view is shown
fileTransfersView.on("shown.bs.collapse", function () {
    if (scope.page != 'upload')
        scope.defineBodyPadding();
});
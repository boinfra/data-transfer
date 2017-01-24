angular.module('templates-dataTransfer', ['js/directives/templates/dropZone.tpl.html', 'js/directives/templates/transfersView.tpl.html']);

angular.module("js/directives/templates/dropZone.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("js/directives/templates/dropZone.tpl.html",
    "<div ng-controller=\"dropController\" id=\"dropZone\" class=\"dropZone\">\n" +
    "	<div class=\"dropZoneContent\">\n" +
    "		<i class=\"fa fa-file-o fa-3x\"></i><i class=\"fa fa-plus-circle\"></i><br/>\n" +
    "		<p id=\"dropMessage\"></p>\n" +
    "	</div>\n" +
    "</div>");
}]);

angular.module("js/directives/templates/transfersView.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("js/directives/templates/transfersView.tpl.html",
    "<div class=\"fileTransfersView\" ng-class=\"{'pull-bottom': page != 'upload'}\" id=\"fileTransfersView\" ng-controller=\"viewController\">\n" +
    "	<div class=\"fileTransfersViewHeader\" ng-show=\"page!='upload'\">\n" +
    "		<p>\n" +
    "			<i class=\"fa fa-arrow-circle-o-up fa-lg\"></i>\n" +
    "			<i class=\"fa fa-arrow-circle-o-down fa-lg\"></i>\n" +
    "			<strong>File transfers</strong>\n" +
    "			<span class=\"pull-right\">\n" +
    "				<i class=\"fa fa-gear fa-2x\"></i>\n" +
    "				<i id=\"imgChevronCollapse\" class=\"fa fa-chevron-down fa-2x\"\n" +
    "					data-toggle=\"collapse\" data-target=\"#fileTransfersTable\"></i>\n" +
    "			</span>\n" +
    "		</p>\n" +
    "	</div>\n" +
    "	<button class=\"btn btn-danger\" ng-show=\"selectedTransfers.length > 0\" ng-click=\"delete()\">Delete selected</button>\n" +
    "	<button class=\"btn btn-success\" ng-show=\"selectedTransfers.length > 0\" ng-click=\"startSelected()\">Start selected</button>	\n" +
    "	<div id=\"fileTransfersViewBody\" class=\"fileTransfersViewBody\">\n" +
    "		<div class=\"collapse in\" id=\"fileTransfersTable\">\n" +
    "			<table class=\"table table-condensed borderless\">\n" +
    "				<thead>\n" +
    "					<tr>\n" +
    "						<th><input type=\"checkbox\" ng-checked=\"(selectedTransfers.length === displayedTransfers.length) && displayedTransfers.length > 0\" ng-click=\"toggleAll()\"/></th>\n" +
    "						<th>Name</th>\n" +
    "						<th>Size</th>\n" +
    "						<th>Transfer type</th>\n" +
    "						<th>Status</th>\n" +
    "						<th>Speed</th>\n" +
    "						<th>Elapsed time</th>\n" +
    "						<th>Remaining time</th>\n" +
    "						<th>Actions</th>\n" +
    "					</tr>\n" +
    "				</thead>\n" +
    "				<tbody id=\"tableBody\" class=\"tableBody\">\n" +
    "					<tr ng-repeat=\"transfer in displayedTransfers\" on-finish-render=\"ngRepeatFinished\" \n" +
    "						ng-show=\"transfer.transferType=='Upload' || page!='upload'\"\n" +
    "						ng-class=\"{'Failed': 'danger', 'Succeeded': 'success'} [transfer.status]\">\n" +
    "						<td><input type=\"checkbox\" ng-checked=\"transfer.selected\" ng-click=\"toggle(transfer)\"/></td>\n" +
    "						<td>{{transfer.name}}</td>\n" +
    "						<td>{{transfer.displaySize()}}</td>\n" +
    "						<td>\n" +
    "							<i class=\"fa fa-lg\" ng-class=\"{true:'fa-arrow-circle-o-up', false:'fa-arrow-circle-o-down'}\n" +
    "							[transfer.transferType=='Upload']\"></i> {{transfer.transferType}}\n" +
    "						</td>\n" +
    "						<td ng-hide=\"transfer.status == 'Pending'\">\n" +
    "							<i class=\"fa\" ng-class=\"{'Failed': 'fa-warning', 'Queued': 'fa-hourglass', 'Succeeded': 'fa-check'} [transfer.status]\"></i>	{{transfer.status}}\n" +
    "						</td>\n" +
    "						<td ng-show=\"transfer.status == 'Pending'\">\n" +
    "							<uib-progressbar class=\"progress-striped active\" value=\"transfer.prog\" style=\"margin-bottom: 0px\">\n" +
    "							</uib-progressbar>\n" +
    "						</td>\n" +
    "						<td>{{transfer.speed}}</td>\n" +
    "						<td>{{transfer.elapsedTime}}</td>\n" +
    "						<td>{{transfer.remainingTime}}</td>\n" +
    "						<td>\n" +
    "							<i class=\"fa fa-play fa-lg\" ng-click=\"start(transfer)\" ng-show=\"transfer.status == 'Paused' || transfer.status == 'Queued' || transfer.status == 'Failed'\"></i>\n" +
    "						</td>\n" +
    "					</tr>\n" +
    "				</tbody>\n" +
    "			</table>\n" +
    "			<hr/>\n" +
    "			<div id=\"page-selection\" class=\"pagination\"></div>\n" +
    "			</div>\n" +
    "			</div>\n" +
    "		</div>");
}]);

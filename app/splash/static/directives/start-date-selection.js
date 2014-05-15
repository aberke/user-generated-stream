var startDateSelection = function() {
	/* Create drop down Month and Day menu for selecting start date of campaign
		only allows year as 2014 to avoid going over twitter rate limit

		For invalid dates new Date() creates closest possible date
			ie, say user enters 2/31/2014 -- creates 3/2/2014

		*** NOTE: 
				Date months zero-indexed while Date days not zero-indexed 
	*/

	var setupMonthOptions = function(scope, opp) {
		if (opp.start && opp.start instanceof Date) {
			opp.month = opp.start.getMonth();
		}
		scope.monthOptions = [];
		for (var i=0; i<12; i++) {
			scope.monthOptions.push(i);
		}
	}
	var setupDayOptions = function(scope, opp) {
		if (opp.start && opp.start instanceof Date) {
			opp.day = opp.start.getDate();
		}
		scope.dayOptions = [];
		for (var i=1; i<=31; i++) {
			scope.dayOptions.push(i);
		}
	}

	return {
		restrict: 'E',
		replace: false,
		scope: {
			opp: '=opp',
			edit: '=edit',
		},
		templateUrl: '/directives/start-date-selection.html',
		link: function(scope, element, attrs) {
			
			setupMonthOptions(scope, scope.opp);
			setupDayOptions(scope, scope.opp);

			scope.$watch('opp.month', function(newMonth) {
				if (scope.opp.start) { scope.opp.start.setMonth(newMonth); }
				else if (scope.opp.day >= 0) {
					scope.opp.start = new Date(2014, newMonth, scope.opp.day + 1);
				}
			});
			scope.$watch('opp.day', function(newDay) {
				if (scope.opp.start) { scope.opp.start.setDate(newDay); }
				else if (scope.opp.month >= 0) {
					scope.opp.start = new Date(2014, scope.opp.month, newDay + 1);
				}
			});

		}
	}
}
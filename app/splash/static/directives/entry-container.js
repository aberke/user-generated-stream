var entryContainer = function() {
	
	return {
		restrict: 'EAC',
		replace: false,
		transclude: true,
		templateUrl: '/directives/entry-container.html',
		link: function(scope, element, attrs) {
			scope.entryList = attrs.entryList;
		}
	}
}
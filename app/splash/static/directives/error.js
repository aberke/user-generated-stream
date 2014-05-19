var error = function($rootScope) {

	return {
		restrict: 'EAC',
		templateUrl: '/directives/error.html',
		link: function(scope, element, attrs) {

			scope.error = null;


			$rootScope.$on('$routeChangeStart', function(next, current) {
				scope.error = null;
			});
			$rootScope.$on('error', function(name, error) {
				scope.error = error;
			})
		}
	}
}
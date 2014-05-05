OPPapp.config(function($routeProvider) {
	/* the front-end authentication scheme (similar logic on backend)
		- when going to a route with resolve: {user: userOrRedirect }
			- check that user logged in
				- if so: return user
				- otherwise: reroute to '/'
	*/
	var userOrRedirect = function(UserFactory, $location) {
		return UserFactory.then(function(data) {
			if (!data){ /* user isn't logged in - redirect to home */
				$location.path('/'); 
				return null;
			}
			return data; /* success: return user object */
		});
	};


	$routeProvider.when('/user/:search', {
		templateUrl: '/html/user.html',
		controller: UserCntl,
		resolve: {
			userList: function(APIservice) {
				return APIservice.GET('/user/all').then(function(data) {
					return data;
				});
			}
		}
	});	
	$routeProvider.when('/contact', {
		templateUrl: '/static/html/contact.html',
	});	
	$routeProvider.when('/forbidden', {
		templateUrl: '/static/html/forbidden.html',
	});
	
	$routeProvider.when('/', {
		templateUrl: '/static/html/partials/index.html',
	});
});
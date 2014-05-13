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

	
	$routeProvider.when('/contact', {
		templateUrl: '/html/contact.html',
	});	
	$routeProvider.when('/forbidden', {
		templateUrl: '/html/forbidden.html',
	});
	
	$routeProvider.when('/', {
		templateUrl: '/html/partials/index.html',
		controller: IndexCntl,
	});
	$routeProvider.when('/new', {
		templateUrl: '/html/partials/index.html',
		controller: IndexCntl,
		resolve: { 
			user: userOrRedirect,
		}
	});
	$routeProvider.when('/update/:id', {
		templateUrl: '/html/partials/update.html',
		controller: UpdateCntl,
		resolve: {
			user: userOrRedirect,
			opp: function(APIservice, $location) {
					return APIservice.GET('/opp/' + $location.path().split('/')[2]).then(function(data) { 
						return data; 
				});
			}
		}
	});
});
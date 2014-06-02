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
	var oppVia = function(via) {
		/* routes /update/via-social/:id and /update/via-editor/:id use this helper in resolve function
			returns function checking that via matches opp.via
				if they don't match, redirects to correct opp/via-opp.via/:id
		*/
		return function(APIservice, OPPservice, $location, $route) {
			return APIservice.GET('/opp/' + $route.current.params.id).then(function(data) { 
				if (data.via != via) {
					$location.path('/update/via-' + data.via + '/'  + data.id);
					return null;
				}
				return OPPservice.frontEndFormat(data); 
			});
		}
	}

	
	$routeProvider.when('/contact', {
		templateUrl: '/html/contact.html',
	})
	.when('/opp/:id', {
		templateUrl: '/html/partials/opp.html',
		controller: OPPCntl,
		resolve: {
			opp: function(APIservice, OPPservice, $route) {
					return APIservice.GET('/opp/' + $route.current.params.id).then(function(data) { 
						return OPPservice.frontEndFormat(data); 
				});
			}
		},
	})
	.when('/', {
		templateUrl: '/html/partials/index.html',
		controller: IndexCntl,
	})
	.when('/update/via-social/:id', {
		templateUrl: '/html/partials/update.html',
		controller: UpdateCntl,
		resolve: {
			user: userOrRedirect,
			opp: oppVia('social'),
		}
	})
	.when('/update/via-editor/:id', {
		templateUrl: '/html/partials/update.html',
		controller: UpdateViaEditorCntl,
		resolve: {
			user: userOrRedirect,
			opp: oppVia('editor'),
		}
	})
	.otherwise({
		redirectTo: '/'
	});;
});
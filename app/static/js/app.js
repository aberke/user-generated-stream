/* route handling file */
var OPPapp = angular.module('OPPapp', ['ngRoute'])

	.config(function($locationProvider) {
		
		$locationProvider.html5Mode(true);

	})

	.config(function($sceDelegateProvider) {
		$sceDelegateProvider.resourceUrlWhitelist([
			// Allow same origin resource loads.
			'self',
			// Allow loading from our assets domain.  Notice the difference between * and **.
			'https://t.co/**',
			'http://t.co/**'
		]);
	})

	.config(function($provide, $compileProvider, $filterProvider) {

	
		// register services
		$provide.service('APIservice', APIservice);

		// register directives
		//$compileProvider.directive('editQuizPartial', editQuizPartial);

		// register factories
		$provide.factory('UserFactory', UserFactory);
	});



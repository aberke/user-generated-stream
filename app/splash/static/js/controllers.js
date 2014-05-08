
function MainCntl($scope, $location, UserFactory) {
	$scope.domain = window.location.origin;
	$scope.user;

	$scope.goTo = function(path) {
		$location.path(path);
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	}
	$scope.login = function(){
		window.location.href=($scope.domain + '/auth/login');
	}
	$scope.logout = function(){
		window.location.href=($scope.domain + '/auth/logout');
	}
	var init = function(){
		UserFactory.then(function(user) {
			$scope.user = user;
			console.log('user', $scope.user)
		});
	}
	init();
}
function IndexCntl($scope, $rootScope, APIservice, WidgetService, page) {
	$rootScope.page = page;
	$scope.showNew = false;
	$scope.OPPlist;


	var getOPPlist = function() {
		APIservice.GET('/opp/all').then(function(data) {
			$scope.OPPlist = data;
			WidgetService.loadOscript();
		});
	}


	var init = function() {
		getOPPlist();
	}
	init();
}
function NewCntl($scope, APIservice, FormService) {
	$scope.error;
	$scope.opp;

	$scope.create = function(opp) {
		$scope.error = {};
		console.log('create', opp)
		if (!FormService.dateValid(opp.start)) {
			$scope.error.start = true;
			opp.start = null;
			return false;
		}
		APIservice.POST('/opp', opp).then(function(data) {
			console.log(data)
		});
	}
	var init = function() {
		$scope.opp = {};
	}
	init();
}


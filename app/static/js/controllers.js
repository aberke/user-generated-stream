
function MainCntl($scope, UserFactory) {
	$scope.domain = window.location.origin;
	$scope.user;

	$scope.scrollToTop = function() {
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	}
	$scope.scrollToById = function(eltID) {
		var elt = $('#' + eltID).eq(0);
		$('html, body').animate({'scrollTop': elt.offset().top}, 'slow', 'swing');
	}
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
		});
	}
	init();
}
function UserCntl($scope, $routeParams, userList) {
	$scope.userList = userList;
	$scope.searchText;

	var init = function() {
		var search = $routeParams.search;
		if (search && search != 'all') {
			$scope.searchText = search;
		}	
	}
	init();
}
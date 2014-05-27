
var ownerOnlyElement = function() {
	/* only show these elements to the user who owns the quiz (within scope) */

	function userOwnsOPP(user, opp) {
		if (user && user.id && 
		((user.twitter_screen_name == "HuffPostLabs") || // let HuffpostLabs delete anything 
		(opp._user && opp._user==user.id))) {
			return true;
		}
		return false;
	}
	function hideOrShowCheck(scope, element) {
		if (!userOwnsOPP(scope.user, scope.opp)) {
			element.style.display = 'none';
		} else {
			element.style.display = 'block';
		}
	}


	return {
		scope: {
			opp: '=opp',
			user: '=user',
		},
		restrict: 'EA',
		link: function(scope, element, attrs) {

			scope.$watch('opp._user', function(value) {
				hideOrShowCheck(scope, element[0]);
			});
			hideOrShowCheck(scope, element[0]);
		}
	}
}

function MainCntl($scope, $location, UserFactory) {
	$scope.domain = window.location.origin;
	$scope.user;

	/* controls the header, so update the page for the header */ 
	$scope.$on('$routeChangeStart', function(next, current) {
		$scope.page = $location.path();
	});


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
function IndexCntl($scope, $rootScope, APIservice, WidgetService) {
	$scope.showNew = false;
	$scope.OPPlist;


	var getOPPlist = function() {
		APIservice.GET('/opp/all').then(function(data) {
			$scope.OPPlist = data;
			WidgetService.loadOscript();
			console.log('OPPlist', $scope.OPPlist)
		});
	}
	$scope.deleteOPP = function(OPP) {
		var index = $scope.OPPlist.indexOf(OPP);
		if (index < 0) { return false; }
		APIservice.DELETE('/opp/' + OPP.id).then(function(data) {
			console.log('DELETE', data)
			$scope.OPPlist.splice(index, 1);
		});
	}


	var init = function() {
		getOPPlist();
	}
	init();
}
function UpdateCntl($scope, APIservice, FormService, opp) {
	$scope.allEntries = [];
	$scope.pendingEntryList = [];
	$scope.rejectEntryList = [];
	$scope.entryList = [];
	var max_id = null;

	$scope.rejectEntry = function(curr_entryList, entry) {
		var index = $scope[curr_entryList].indexOf(entry);
		if (index < 0) { console.log('ERROR'); return false; }

		APIservice.PUT('/opp/' + opp.id + '/reject/' + entry.tweet_id).then(function(data) {
			$scope.opp = data;
			$scope[curr_entryList].splice(index, 1);
			$scope.rejectEntryList.push(entry);
		});
	}
	$scope.acceptEntry = function(curr_entryList, entry) {
		var index = $scope[curr_entryList].indexOf(entry);
		if (index < 0) { console.log('ERROR'); return false; }

		APIservice.PUT('/opp/' + opp.id + '/accept/' + entry.tweet_id, entry).then(function(data) {
			$scope.opp = data;
			$scope[curr_entryList].splice(index, 1);
			$scope.entryList.push(entry);
		});
	}


	var filterEntryList = function(list) {
		for (var i=0; i<list.length; i++) {
			var item = list[i];
			item['created_at'] = new Date(item['created_at']);
			
			if (opp.entryIDList.indexOf(item.tweet_id) >= 0) {
				$scope.entryList.push(item);
			} else if (opp.rejectEntryIDList.indexOf(item.tweet_id) >= 0) {
				$scope.rejectEntryList.push(item);
			} else {
				$scope.pendingEntryList.push(item);
			}
			$scope.allEntries.push(item);
		}
		
	}

	$scope.moreEntries = function() { searchEntries(); }

	var searchEntries = function() {
		var params = {'hashtag': opp.title, 'since': opp.start, 'max_id': (max_id || null)};

		APIservice.GET('/opp/' + opp.id + '/search', params).then(function(ret) {
			console.log('searchEntries returned', ret)
			filterEntryList(ret.data);
			max_id = ret.max_id;
		});
	}

	var init = function() {
		console.log('opp', opp)
		$scope.opp = opp;
		searchEntries();
	}
	init();
}
function NewCntl($scope, $location, APIservice, FormService) {
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
			console.log('POST returned data',data)
			$location.path('/update/' + data.id);
		});
	}
	var init = function() {
		$scope.opp = {};
	}
	init();
}


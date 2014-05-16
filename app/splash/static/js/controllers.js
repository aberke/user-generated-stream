
function MainCntl($scope, $location, UserFactory) {
	$scope.domain = window.location.origin;
	$scope.user;

	/* controls the header, so update the page for the header */ 
	$scope.$on('$routeChangeStart', function(next, current) {
		$scope.page = $location.path();
		$scope.showNew = false;
	});

	$scope.createNew = function() {
		$scope.showNew = true;
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
			$scope.OPPlist.splice(index, 1);
		});
	}
	$scope.claimOPP = function(opp) {
		if (!$scope.user || opp._user) { return false; }
		APIservice.PUT('/user/' + $scope.user.id + '/assign-opp/' + opp.id).then(function(data) {
			opp._user = $scope.user.id;
			opp._user_name = $scope.user.twitter_screen_name;
			$scope.user.OPPlist.push(opp);
		});
	}
	$scope.relinquishOPP = function(opp) {
		APIservice.PUT('/user/' + $scope.user.id + '/resign-opp/' + opp.id).then(function(data) {
			opp._user = null;
			var index = $scope.user.OPPlist.indexOf(opp);
			$scope.user.OPPlist.splice(index, 1);
		});

	}


	var init = function() {
		getOPPlist();
	}
	init();
}
function UpdateCntl($scope, APIservice, OPPservice, FormService, WidgetService, opp) {
	$scope.opp = opp;

	// initialized in init
	$scope.allEntries;
	$scope.pendingEntryList;
	$scope.rejectEntryList;
	$scope.entryList;
	var max_id;


	var reloadOPP = function() {
		WidgetService.reloadOPP();
	}

	$scope.rejectEntry = function(curr_entryList, entry) {
		var index = $scope[curr_entryList].indexOf(entry);
		if (index < 0) { console.log('ERROR'); return false; }

		APIservice.PUT('/opp/' + opp.id + '/reject/' + entry.tweet_id).then(function() {
			$scope[curr_entryList].splice(index, 1);
			$scope.rejectEntryList.push(entry);
			reloadOPP();
		});
	}
	$scope.acceptEntry = function(curr_entryList, entry) {
		var index = $scope[curr_entryList].indexOf(entry);
		if (index < 0) { console.log('ERROR'); return false; }

		APIservice.PUT('/opp/' + opp.id + '/accept/' + entry.tweet_id, entry).then(function() {
			$scope[curr_entryList].splice(index, 1);
			$scope.entryList.push(entry);
			reloadOPP();
		});
	}
	$scope.saveOPP = function() {
		APIservice.PUT('/opp/' + opp.id, $scope.opp).then(function(data) {
			/* 
			Don't set $scope.opp = data
			start over with fetching data since date changed 
			*/
			init();
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
		var params = {'hashtag': opp.title, 'since': opp.start.toISOString(), 'max_id': (max_id || null)};

		APIservice.GET('/opp/' + opp.id + '/search', params).then(function(ret) {
			console.log('searchEntries returned', ret)
			filterEntryList(ret.data);
			max_id = ret.max_id;
			/* 
				keep searching for the next stuff
				max_id of 0 signifies no more to search for 
			*/
			if (max_id > 0) { searchEntries(); }
		});
	}

	var init = function() {
		$scope.allEntries = [];
		$scope.pendingEntryList = [];
		$scope.rejectEntryList = [];
		$scope.entryList = [];
		max_id = null;
		searchEntries();
		console.log('scope.opp', $scope.opp)
	}
	init();
}
function NewCntl($scope, $location, APIservice, FormService) {
	$scope.error;
	$scope.opp;

	$scope.create = function(opp) {
		$scope.error = {};
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
function OPPCntl($scope, opp) {
	$scope.opp = opp;
}


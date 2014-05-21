
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
	$scope.pendingEntryList;
	$scope.rejectEntryList;
	$scope.entryList;
	$scope.listLengths;
	var queues;
	var max_id;

	/* 
	The problem: To fetch all the tweets from twitter right away 
					pros: reflect correct entry numbers and store the least amount of data
		Can only fetch up to 100 tweets at a time
		Need to get back last set before can query next set (need max_id for "paging")
		-- so iteratively fetch tweets

		Can't iteratively update lists in scope 
			- updating HTML (with angular ng-repeat) to that extent is too exhausting for the browser
			- browser conks out until data fetching done

	Solution: fetch all the data iteratively upfront, but don't reflect it all in the scope
			  until it's asked for with showMore()

		--------------------------

		$scope.pendingEntryList
		$scope.rejectEntryList
		$scope.entryList --- accepted entries

		3 sets of entryLists
		for each set keep total length and queue of more lists to concat with

		var queues = { 'listName': [[next-list-0], [next-list-1], [next-list-2],..] }
		$scope.listLengths = { 'listName': x }

		at page load iteratively call searchEntries
			on callback: filterEntries into the 3 lists
							add to respective queue as a next-list
							$scope.listLengths[listName] += list.length;
				
			on showMore(listName):
				nextList = queues[listName].shift(1)
				$scope[listName].concat(nextList)
	*/
	var filterEntries = function(list) { // callback to searchEntries
		// set up tempLists before adding to queues
		var tempLists = {'entryList': [], 'rejectEntryList': [], 'pendingEntryList': []};
		for (var i=0; i<list.length; i++) {
			var item = list[i];
			item['created_at'] = new Date(item['created_at']);
			
			if (opp.entryIDList.indexOf(item.tweet_id) >= 0) {
				tempLists['entryList'].push(item);
			} else if (opp.rejectEntryIDList.indexOf(item.tweet_id) >= 0) {
				tempLists['rejectEntryList'].push(item);
			} else {
				tempLists['pendingEntryList'].push(item);
			}
		}
		// add tempLists to queues and listLengths
		for (var listName in tempLists) {
			var tempList = tempLists[listName];
			queues[listName].push(tempList);
			$scope.listLengths[listName] += tempList.length;

			if (!$scope[listName].length) {
				$scope[listName] = tempList;
			}
		}
	}
	$scope.showMore = function(listName) {
		nextList = queues[listName].shift(1);
		$scope[listName] = $scope[listName].concat(nextList);
	}
	$scope.moreEntries = function() { searchEntries(); }

	var filterEntries2 = function(list) {
		for (var i=0; i<list.length; i++) {
			var item = list[i];
			item['created_at'] = new Date(item['created_at']);
			
			if ($scope.opp.rejectEntryIDList.indexOf(item.tweet_id) >= 0) {
				$scope['rejectEntryList'].push(item);
			} else if ($scope.opp.entryIDList.indexOf(item.tweet_id) < 0) {
				$scope['pendingEntryList'].push(item);
			} // else its in the opp.entryList
		}
	}

	var searchEntries = function(callback) {
		$scope.moreEntries = false;
		var params = {'hashtag': opp.title, 'since': opp.start.toISOString(), 'max_id': (max_id || null)};
		
		APIservice.GET('/opp/' + opp.id + '/search', params).then(function(ret) {
			filterEntries2(ret.data);
			max_id = ret.max_id;
			if (callback) { callback(); }
			/*  max_id of <= 0 signifies no more to search for  */
			if (max_id > 0) { $scope.moreEntries = true; }
		});
	}
	$scope.loadMoreEntries = function() {
		$scope.loadingMoreEntries = true;
		searchEntries(function() { 
			$scope.loadingMoreEntries = false;
		});
	}

	var reloadOPP = function() {
		APIservice.GET('/opp/' + opp.id).then(function(data) { 
			WidgetService.reloadOPP(data);
		});
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
	// to save start and share_link
	$scope.saveOPP = function() {
		APIservice.PUT('/opp/' + opp.id, $scope.opp).then(function(data) {
			/* 
			Don't set $scope.opp = data
			start over with fetching data since date changed 
			*/
			init();
		});
	}

	var init = function() {
		console.log('opp', $scope.opp)
		$scope.allEntries = [];
		$scope.pendingEntryList = [];
		$scope.rejectEntryList = [];
		$scope.entryList = $scope.opp.entryList;
		queues = {
			'pendingEntryList': [],
			'rejectEntryList': [],
			'entryList': [],
		}
		$scope.listLengths = {
					'pendingEntryList': 0,
					'rejectEntryList': 0,
					'entryList': 0,
		}
		max_id = null;
		searchEntries();
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


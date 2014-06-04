
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
	$scope.cancelNew = function() {
		// called from within scope of NewCntl
		$scope.showNew = false;
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
function IndexCntl($scope, $rootScope, APIservice, WidgetService) {
	$scope.showNew = false;
	$scope.OPPlist;
	$scope.showAll = true; // vs show only user's OPPs
	$scope.showAllOPP = function() {
		$scope.showAll = true;
	}
	$scope.showUserOPP = function() {
		$scope.showAll = false;
	}

	console.log('user', $scope.user)

	var getOPPlist = function() {
		APIservice.GET('/opp/all').then(function(data) {
			$scope.OPPlist = data;
			WidgetService.loadOscript();
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
	$scope.showTab = 'pending-instagram';
	$scope.opp = opp;
	console.log('opp', $scope.opp)

	// initialized in init
	$scope.pendingEntryList;
	$scope.pendingEntryListInstagram;
	$scope.rejectEntryList;
	$scope.entryList;
	var next_max_id; // {'twitter': next_max_id, 'instagram': next_max_id};

	/* 
	
	*/
	
	$scope.moreEntries = function() { searchEntries(); }

	var filterEntries = function(list, source) {
		console.log('filterEntries', list, source)
		for (var i=0; i<list.length; i++) {
			var item = list[i];
			item['created_at'] = new Date(item['created_at']);
			
			if ($scope.opp.rejectEntryIDList.indexOf(item.id) >= 0) {
				$scope['rejectEntryList'].push(item);
			} else if ($scope.opp.entryIDList.indexOf(item.id) < 0) {
				if (item.source == 'twitter') {
					$scope['pendingEntryList'].push(item);
				} else if (item.source == 'instagram') {
					$scope['pendingEntryListInstagram'].push(item);
				} else {
					console.log("item.source", item.source)
				}
			} // else its in the opp.entryList
		}
	}
	var searchParams = function(source) {
		return {'hashtag': opp.title, 
				'since': $scope.opp.start.toISOString(), 
				'max_id': (next_max_id[source] || null),
				'source': source,
			};
	}

	var searchEntries = function(source, callback) {
		// don't search if there's nothing more to get
		if (next_max_id[source] && next_max_id[source] <= 0) { return callback(); }

		var params = searchParams(source);
		APIservice.GET('/opp/' + opp.id + '/search', params).then(function(ret) {
			// ready for next call to server
			callback();
			next_max_id[source] = ret.next_max_id;
			filterEntries(ret.data, source);
		});
	}
	$scope.loadMoreEntries = function() {
		$scope.loadingMoreEntries = true;
		$scope.moreEntries = false;
		// search instagram first since that tab shown first
		searchEntries('instagram', function() {
			searchEntries('twitter', function() {
				/*  max_id of <= 0 signifies no more to search for  */
				if (next_max_id['twitter'] > 0 || next_max_id['instagram'] > 0) { $scope.moreEntries = true; }
				$scope.loadingMoreEntries = false;
			});
		});
	}

	var reloadOPP = function() {
		APIservice.GET('/opp/' + opp.id).then(function(data) { 
			WidgetService.reloadOPP(data);
			$scope.opp.rejectEntryIDList = data.rejectEntryIDList;
			$scope.opp.entryIDList = data.entryIDList;
		});
	}
	var moveEntry = function(from_entryList, move, entry) {
		/* handles rejectEntry/acceptEntry
			params: 
				from_entryList: current entryList
				move: 'accept' or 'reject'
				entry: entry JSON object
		 */
		var index = $scope[from_entryList].indexOf(entry);
		if (index < 0) { console.log('ERROR'); return false; }

		APIservice.PUT('/opp/' + opp.id + '/' + move + '/' + entry.id, entry).then(function() {
			$scope[from_entryList].splice(index, 1);
			if (move == 'reject') {
				$scope['rejectEntryList'].push(entry);
			} else {
				$scope['entryList'].push(entry);
			}
			reloadOPP();
		});

	}

	$scope.rejectEntry = function(from_entryList, entry) {
		moveEntry(from_entryList, 'reject', entry);
	}
	$scope.acceptEntry = function(from_entryList, entry) {
		moveEntry(from_entryList, 'accept', entry);
	}
	$scope.saveOPP = function() {
		APIservice.PUT('/opp/' + opp.id, $scope.opp).then(init);
	}

	var init = function() {
		$scope.allEntries = [];
		$scope.rejectEntryList = [];
		$scope.pendingEntryList = [];
		$scope.pendingEntryListInstagram = [];
		$scope.entryList = $scope.opp.entryList;

		next_max_id = {'twitter': 0, 'instagram': 0};
		$scope.loadMoreEntries();
	}
	init();
}
function UpdateViaEditorCntl($scope, APIservice, OPPservice, FormService, WidgetService, opp) {
	$scope.showTab;
	$scope.opp;
	$scope.entryList;

	$scope.addEntry = function() {
		/* insert empty entry at start of entryList */
		$scope.entryList.splice(0, 0, {'state': 'unsaved'});
	}
	$scope.deleteEntry = function(entry) {
		var index = $scope.entryList.indexOf(entry);
		var callback = function() {
			$scope.entryList.splice(index, 1);
			reloadOPP();
		}
		if (!entry.id) { // not saved server side, needs not be deleted server side
			return callback();
		}
		APIservice.DELETE('/opp/' + opp.id + '/entry/' + entry.id).then(callback);
	}
	$scope.saveEntry = function(entry) {
		entry.state = 'saving';
		var callback = function() {
			entry.state = 'saved';
			reloadOPP();
		}
		if (entry.id) { // it's been saved before -- not new so PUT
			APIservice.PUT('/opp/' + opp.id + '/entry/' + entry.id, entry).then(callback);
		} else {
			APIservice.POST('/opp/' + opp.id + '/entry', entry).then(function(retEntry) {
				entry.id = retEntry.id;
				callback();
			});
		}
	}
	

	var reloadOPP = function() {
		APIservice.GET('/opp/' + opp.id).then(function(data) { 
			WidgetService.reloadOPP(data);
			$scope.opp.rejectEntryIDList = data.rejectEntryIDList;
			$scope.opp.entryIDList = data.entryIDList;
		});
	}

	$scope.saveOPP = function() {
		$scope.opp.state = 'saving';
		APIservice.PUT('/opp/' + opp.id, $scope.opp).then(function() {
			$scope.opp.state = 'saved';
			reloadOPP();
		});
	}

	var init = function() {
		$scope.showTab = 'slides';
		$scope.opp = opp;
		$scope.entryList = $scope.opp.entryList;
		if (!$scope.entryList.length) {
			$scope.addEntry();
		}
		console.log('opp', $scope.opp)
	}
	init();
}
function NewCntl($scope, $location, APIservice, FormService) {
	$scope.opp;
	$scope.step;
	$scope.error = {};

	$scope.create = function(opp) {
		if (!FormService.validOPP) { 
			return false; 
		}
		APIservice.POST('/opp', opp).then(function(data) {
			console.log('POST returned data',data)
			$location.path('/update/via-' + data.via + '/' + data.id);
		});
	}
	var init = function() {
		$scope.opp = {'widget_type': null};
		$scope.step = 0;

		$scope.$watch('opp.widget_type', function(n,o) {
			if (n) { $scope.step = 1; }
		});
		$scope.$watch('opp.via', function(n,o) {
			if (n) { $scope.step = 2; }
		});
		$scope.$watch('opp.title', function(n,o) {
			/* ensure no title for social with non-letter characters */
			$scope.error.title = false;
			if ($scope.opp.via == 'social' && $scope.opp.title && $scope.opp.title.match(/[^a-z|A-Z]/)) {
				$scope.error.title = true;
			}
		});
	}
	init();
}
function OPPCntl($scope, opp) {
	$scope.opp = opp;
}


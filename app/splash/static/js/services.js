
var FormService = function() {
  
  this.validOPP = function(opp) {
    /* returns true if OPP valid, false if not
       used by createOPP in new form
    */
    if (!(opp.widget_type=='poll'||opp.widget_type=='slideshow')) {
      return false;
    }
    if (!(opp.via=='editor'||opp.via=='social')) {
      return false;
    }
    if (!opp.title.length) {
      return false;
    }
    if (opp.via=='social'&&(!opp.start || !opp.start instanceof Date)) {
      return false;
    }
    /* ensure no title for social with non-letter characters */
    if ($scope.opp.via == 'social' && $scope.opp.title && $scope.opp.title.match(/[^a-z|A-Z]/)) {
      return false;
    }
    return true;
  }
}
var OPPservice = function() {
  /* handles backend to javascript front end data type transition */

  this.frontEndFormat = function(opp) {
    /* take OPP fresh from the server and turn its fields into something front end wants to work with */
    opp.start = new Date(opp.start);
    return opp;
  }
}

var WidgetService = function($http) {

  this.loadOscript = function() {
    $http.get("/widget/o.js").success(function(data) {
      eval(data);
    });
  }
  this.reloadOPP = function(OPPdata) {
    if (!OPPwidgets || !OPPwidgets[OPPdata.id]) { return false; }
    OPPwidgets[OPPdata.id].init(OPPdata);
  }
}


var APIservice = function($rootScope, $http, $q){
  /* $rootScope broadcasts errors */

  function HTTP(method, endpoint, data, params) {
    
    var deferred = $q.defer();
    $http({
      method:  method,
      url:    ('/api' + endpoint),
      data:   (data || {}),
      params: (params || {}),
    })
    .success(function(returnedData){
      deferred.resolve(returnedData);
    })
    .error(function(errData, status) {
      var e = new APIserviceError(errData, status);
      deferred.reject(e);
    });
    return deferred.promise;
  };
  /* when there is an $http error, service rejects promise with a custom Error */
  function APIserviceError(err, status) {
    console.log('API Error', status, err)
    var error = (err || {});
    this.type = "APIserviceError";
    this.data = err;
    this.message = (err.message || status + " Error");
    this.status = status;
    $rootScope.$broadcast('error', this);
  }
  APIserviceError.prototype = Error.prototype;


  /* ---------- below functions return promises --------------------------- */
  

  this.GET = function(endpoint, data) { // if there's data, send it as params
    return HTTP('GET', endpoint, null, data);
  };
  this.POST = function(endpoint, data) {
    return HTTP('POST', endpoint, data);
  };
  this.PUT = function(endpoint, data) {
    return HTTP('PUT', endpoint, data);
  };
  this.DELETE = function(endpoint) {
    return HTTP('DELETE', endpoint, null);
  };

};
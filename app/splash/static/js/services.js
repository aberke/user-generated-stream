
var FormService = function() {


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
    console.log(OPPwidgets[OPPdata.id])
    OPPwidgets[OPPdata.id].reload(OPPdata);
  }
}

var APIservice = function($rootScope, $http, $q){

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
      console.log('API ERROR', status, errData)
      var e = new APIserviceError(errData);
      deferred.reject(e);
    });
    return deferred.promise;
  };
  /* when there is an $http error, service rejects promise with a custom Error */
  function APIserviceError(err) {
    this.name = "APIserviceError";
    this.data = (err || {});
    this.message = (err || "");
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
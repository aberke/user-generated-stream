
var FormService = function() {

  this.dateValid = function(date) {
    /* return true for valid date, false otherwise
      Date valid if matches MM/DD/YYYY
    */
    //var a = date.split(/\ |,|-|\//);
    var a = date.split('/');
    if (a.length != 3) { return false; }
    var month = Number(a[0]),
        day   = Number(a[1]),
        year  = Number(a[2]);
    if (month < 1 || month > 12) { return false; }
    if (day < 1 || day > 31) { return false; }
    if (year < 2000 || year > new Date().getFullYear()) { return false; }
    
    return true;
  }
}

var WidgetService = function($http) {

  this.loadOscript = function() {
    $http.get("/widget/q.js").success(function(data) {
      eval(data);
    });
  }
}

var APIservice = function($rootScope, $http, $q){

  function HTTP(method, endpoint, data) {
    $rootScope.unauthorized = false;
    
    var deferred = $q.defer();
    $http({
      method: method,
      url: ('/api' + endpoint),
      data: (data || {}),
    })
    .success(function(returnedData){
      deferred.resolve(returnedData);
    })
    .error(function(errData, status) {
      if (status == 401) { /* the header in base.html pays attention to error */
        $rootScope.unauthorized = true;
        $rootScope.user = null;
      }
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
  

  this.GET = function(endpoint) {
    return HTTP('GET', endpoint, null);
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
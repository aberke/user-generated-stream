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
  

  this.GETquiz = function(id) {
    return this.GET('/quiz/' + id);
  };

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
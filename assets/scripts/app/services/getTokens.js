/**
 * Retrieve necessary tokens to talk to the Spotify web helper (CSRF and OAuth
 * Access tokens)
 */
App.service( 'getTokens', [ '$http', '$q', function ( $http, $q ) {
  var deferred = $q.defer();

  $http.jsonp( '/auth/getplaytokens', {
      params: { callback: 'JSON_CALLBACK' }
    })
    .success( function ( data, status, headers, config ) {
      if ( data && data.success ) {
        // And back we go
        deferred.resolve( data.tokens );
      } else {
        deferred.reject( data.error );
      }
    })
    .error( function ( data, status, headers, config ) {
      deferred.reject( 'Unable to fetch Spotify tokens.' );
    });

  return deferred.promise;
}]);

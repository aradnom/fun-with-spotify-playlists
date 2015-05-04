// Provides access to URL query params as a simple key => value object
App.service( 'queryParams', [ function () {
  var search = location.search;

  if (search) {
    var params = {};
    var pairs  = location.search.substring( 1 ).split( '&' );

    pairs.forEach( function ( pair ) {
      var split = pair.split( '=' );
      params[ split[ 0 ] ] = split[ 1 ];
    });
  }

  return params;
}]);


/**
 * Search controller.  It controls the search.
 */
App.controller( 'Search', [ '$scope', '$element', 'spotifyApi', 'debounce', function ( $scope, $element, spotifyApi, debounce ) {
  $scope.search = {};

  $scope.runSearch = debounce( function () {
    if ( $scope.search.query ) {
      spotifyApi.search( $scope.search.query )
        .then( function ( results ) {
          console.log( results );
        })
    }
  }, 200 );
}]);

/**
 * Search controller.  It controls the search.
 */
App.controller( 'Search', [ '$scope', '$rootScope', '$element', 'spotifyApi', 'debounce', 'spotifyUtility', function ( $scope, $rootScope, $element, spotifyApi, debounce, spotifyUtility ) {
  // Create blank object for search query
  $scope.search = {};

  // Keep track of search results so we can slide in with Velocity
  var $results = $element.find( '.search__results' );

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.runSearch = debounce( function () {
    if ( $scope.search.query ) {
      spotifyApi.search( $scope.search.query )
        .then( function ( results ) {
          // Check which arrays have results so we know how many finished
          // events to listen for
          var finishedCount = ( results.tracks.total > 0 ? 1 : 0 ) +
            ( results.artists.total > 0 ? 1 : 0 ) +
            ( results.albums.total > 0 ? 1 : 0 );

          var eventCount = 0;
          var unsubscribe = $scope.$on( 'ngRepeatFinished', function () {
            eventCount++;

            if ( eventCount === finishedCount ) {
              unsubscribe();

              // Slide in results
              openSearchResults();
            }
          });

          // Set the results arrays
          $scope.results = results;
        })
    } else {
      // Slide out results
      closeSearchResults();
    }
  }, 300 );

  $scope.closeSearch = function () {
    closeSearchResults();
  };

  // Tells the master playlist to add the track
  $scope.addToPlaylist = function ( track ) {
    $rootScope.$broadcast( 'addToMasterPlaylist', spotifyUtility.formatTrack( track ) );
  };

  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  function openSearchResults () {
    $results
      .velocity( 'stop', true )
      .velocity( 'slideDown', { duration: 200 } );
  }

  function closeSearchResults () {
    $results
      .velocity( 'stop', true )
      .velocity( 'slideUp', { duration: 200, complete: function () {
        $scope.results = null;
      }});
  }
}]);

/**
 * Library controller.
 */
App.controller( 'Library', [ '$scope', '$rootScope', '$element', 'spotifyApi', 'resources', 'spotifyConfig', 'dragAndDrop', 'spotifyUtility', 'debounce', function ( $scope, $rootScope, $element, spotifyApi, resources, spotifyConfig, dragAndDrop, spotifyUtility, debounce ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  // Search object for containing playlist/track queries
  $scope.search = {};

  // Wait for resources to be loaded before going
  $scope.$on( 'resourcesReady', function () {
    $scope.library = resources.library;
  });


  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  $scope.addToPlaylist = function ( track ) {
    $rootScope.$broadcast( 'addToMasterPlaylist', spotifyUtility.formatTrack( track ) );
  };

  $scope.dragStart = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStart', track );

    // Update the track currently dragging in the drag and drop service so
    // other controllers can see it
    dragAndDrop.currentTrack = track.track;
  };

  $scope.dragStop = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStop', track );
  };

  $scope.searchLibrary = debounce( function () {
    var query = $scope.search.library.toLowerCase();

    if ( query ) {
      var filtered = resources.library.filter( function ( track ) {
        return track.track.name.toLowerCase().indexOf( query ) > -1 ||
          track.track.artist_string.toLowerCase().indexOf( query ) > -1;
      });

      $scope.library = filtered;
    } else {
      $scope.library = resources.library;
    }
  }, 200 );

}]);

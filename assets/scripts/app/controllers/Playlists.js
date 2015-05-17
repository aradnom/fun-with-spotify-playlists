/**
 * Playlists controller.
 */
App.controller( 'Playlists', [ '$scope', '$rootScope', '$element', 'spotifyApi', 'resources', 'spotifyConfig', 'dragAndDrop', 'spotifyUtility', 'debounce', function ( $scope, $rootScope, $element, spotifyApi, resources, spotifyConfig, dragAndDrop, spotifyUtility, debounce ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Search object for containing playlist/track queries
  $scope.search = {};

  // Wait for resources to be loaded before going
  $scope.$on( 'resourcesReady', function () {
    var displayPlaylists = buildDisplayPlaylists( resources.playlists );

    // Turn the lights on
    $scope.playlists = displayPlaylists;
  });


  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  $scope.showPlaylist = function ( $event, playlist ) {
    var $parent = $($event.currentTarget).parent();
    var $tracks = $parent.find( '.playlist__tracks' );

    if ( playlist.activeTracks ) {
      playlist.active = false;

      $tracks.velocity( 'slideUp', { duration: Math.log( playlist.tracks.length ) * 0.5 * 1000, easing: 'easeOutExpo', complete: function () {
        playlist.activeTracks = null;

        $scope.safeApply();
      }});
    } else if ( playlist.tracks && playlist.tracks.length ) {
      playlist.activeTracks = playlist.tracks;

      playlist.active = true;

      var unsubscribe = $scope.$on( 'ngRepeatFinished', function () {
        $tracks.velocity( 'slideDown', { duration: Math.log( playlist.tracks.length ) * 0.5 * 1000, easing: 'easeOutExpo' });

        unsubscribe();
      });
    }
  };

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

  $scope.searchPlaylists = debounce( function () {
    var query = $scope.search.playlists.toLowerCase();

    if ( query ) {
      var filtered = resources.playlists.filter( function ( playlist ) {
        return playlist.name.toLowerCase().indexOf( query ) > -1 &&
          playlist.tracks &&
          playlist.tracks.length;
      });

      $scope.playlists = buildDisplayPlaylists( filtered );
    } else {
      $scope.playlists = buildDisplayPlaylists( resources.playlists );
    }
  }, 200 );

  $scope.searchTracks = debounce( function ( playlist ) {
    var query = $scope.search.tracks.toLowerCase();

    if ( query && playlist ) {
      var filtered = playlist.tracks.filter( function ( track ) {
        return track.track.name.toLowerCase().indexOf( query ) > -1 ||
          track.track.artist_string.toLowerCase().indexOf( query ) > -1;
      });

      playlist.activeTracks = filtered;
    } else {
      playlist.activeTracks = playlist.tracks;
    }
  }, 200 );


  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Put together display playlist array.
   *
   * @param  {Array} playlists Array of raw playlist results
   */
  function buildDisplayPlaylists ( playlists ) {
    var displayPlaylists = [];

    playlists.forEach( function ( playlist ) {
      displayPlaylists.push({
        id: playlist.id,
        image: playlist.images && playlist.images.length ? playlist.images[0].url : null,
        name: playlist.name,
        tracks: playlist.tracks
      });
    });

    return displayPlaylists;
  }
}]);

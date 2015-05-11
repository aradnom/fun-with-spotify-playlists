/**
 * Controller for the main playlist.
 */
App.controller( 'MasterPlaylist', [ '$scope', '$element', '$rootScope', 'localStorageService', 'dragAndDrop', function ( $scope, $element, $rootScope, localStorageService, dragAndDrop ) {
  // No track is playing to start
  $scope.currentTrack = null;

  // Set up the master list of tracks - load from cache if available
  $scope.tracks = localStorageService.get( 'playerMasterPlaylist' );

  if ( ! $scope.tracks ) { $scope.tracks = []; }

  // Keep track of the fact that we're dragging an internal track so we can
  // delete it from the old location after dropping it
  var draggingTrackIndex = -1;

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.playTrack = function ( track ) {
    // Tell the player to play the track
    $rootScope.$broadcast( 'playTrack', track );
  };

  $scope.removeTrack = function ( index ) {
    removeFromPlaylist( index );
  };

  $scope.dragDrop = function ( $event, ui ) {
    // Then deal with adding the new track at the correct position
    var $tracks = $element.find( '.master-playlist__tracks__track' );

    if ( $tracks.length ) {
      // Figure out which track we're closest to and our offset relative to it
      // We only care about vertical offset because this event won't fire unless
      // the dropped track was in the playlist container
      var trackOffsets = $tracks.map( function () {
        return Math.abs( ui.offset.top - $( this ).offset().top );
      });

      var closestIndex = trackOffsets.index( Math.min.apply( trackOffsets, trackOffsets ));

      // Now figure out if we're above or below it and add accordingly.  If it
      // happens to be right over it, default to adding after it
      var closestOffset = $( $tracks[ closestIndex ] ).offset().top;

      if ( ( ui.offset.top - closestOffset ) >= 0 ) {
        // Insert after the closest track
        addToPlaylist( dragAndDrop.currentTrack, closestIndex + 1 );

        // If this is an internal drag and drop, remove the old track
        if ( draggingTrackIndex > -1 ) {
          if ( draggingTrackIndex > ( closestIndex + 1 ) ) { draggingTrackIndex++; }
        }
      } else {
        // Insert before the closest track
        addToPlaylist( dragAndDrop.currentTrack, closestIndex );

        // If this is an internal drag and drop, remove the old track
        if ( draggingTrackIndex > -1 ) {
          if ( draggingTrackIndex > closestIndex ) { draggingTrackIndex++; }
        }
      }
    } else {
      // If this is the first track, it doesn't matter where it lands so just
      // add it right away
      addToPlaylist( dragAndDrop.currentTrack );
    }

    // Deal with internal drag and drop
    if ( draggingTrackIndex > -1 ) {
      removeFromPlaylist( draggingTrackIndex );

      // Clear the internal dragging track index
      draggingTrackIndex = -1;
    }

    // Clear the current drag track now that drop has been achieved
    dragAndDrop.currentTrack = null;

    // Reset the hover state
    $scope.hover = false;

    $scope.safeApply();
  };

  // Set hover state on mouseover
  $scope.dragOver = function () {
    $scope.hover = true;

    $scope.safeApply();
  };

  // Remove hover state on mouseout
  $scope.dragOut = function () {
    $scope.hover = false;

    $scope.safeApply();
  };

  $scope.dragStart = function ( $event, ui, track, index ) {
    $rootScope.$broadcast( 'dragStart', track );

    // Update the track currently dragging in the drag and drop service so
    // other controllers can see it
    dragAndDrop.currentTrack = track;

    // Keep track of the fact that we're dragging an internal track so we can
    // delete it from the old location after dropping it
    draggingTrackIndex = index;
  };

  $scope.dragStop = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStop', track );
  };

  /////////////////////////////////////////////////////////////////////////////
  // Events ///////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // On play track event, display track as the current track
  $scope.$on( 'playTrack', function ( $event, track ) {
    $scope.currentTrack = track;

    // Deactivate any currently-active tracks
    $scope.tracks
      .filter( function ( track ) {
        return track.active;
      }).forEach( function ( track ) {
        track.active = false;
      });

    // And activate this track
    track.active = true;
  });

  // On player playing, set current item to active
  $scope.$on( 'playerPlaying', function () {
    // Set current track status to active
    $scope.currentTrack.active = true;

    // Set master playlist status to active
    $scope.playing = true;
  });

  // On player stopped, set current item to inactive
  $scope.$on( 'playerStopped', function () {
    $scope.playing = false;

    // Deactivate tracks in the playlist
    $scope.tracks
      .filter( function ( track ) {
        return track.active;
      }).forEach( function ( track ) {
        track.active = false;
      });
  });

  $scope.$on( 'addToMasterPlaylist', function ( $event, track ) {
    addToPlaylist( track, 0 );
  });

  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Add to the master playlist and update the track cache appropriately
   *
   * @param {Object}  track Spotify track object
   * @param {Integer} index Specific inex to add track at (opt.)
   */
  function addToPlaylist ( track, index ) {
    // Add track to the master list
    if ( typeof( index ) !== 'undefined' ) {
      $scope.tracks.splice( index, 0, track );
    } else {
      $scope.tracks.push( track );
    }

    // And update the cache
    localStorageService.set( 'playerMasterPlaylist', $scope.tracks );
  }

  /**
   * Remove track at the specified index.
   *
   * @param  {Integer} index Index to remove item at
   */
  function removeFromPlaylist ( index ) {
    // Remove the track
    $scope.tracks.splice( index, 1 );

    // Update the cache
    localStorageService.set( 'playerMasterPlaylist', $scope.tracks );
  }
}]);

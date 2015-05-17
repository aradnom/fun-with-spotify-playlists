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
    // Tell the player to play the track (but only if track is playable)
    if ( ! track.unplayable ) {
      $rootScope.$broadcast( 'playTrack', track );
    }
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

  // On track ended event, attempt to play the next track
  $scope.$on( 'trackEnded', function () {
    var playing = playNextTrack();

    if ( ! playing ) {
      // If there is no next track, tell the player to stop
      $rootScope.$broadcast( 'stopPlayback' );
    }
  });

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

  // Play next track if available
  $scope.$on( 'nextTrack', function () {
    playNextTrack();
  });

  // Play previous track if available
  $scope.$on( 'previousTrack', function () {
    playPreviousTrack();
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

  // Deal with unplayable tracks.  These are discovered at play time (there's
  // no way to detect these in the API results).
  $scope.$on( 'unplayableTrack', function ( $event, track ) {
    track.unplayable = true;

    // Update the track cache so we know ahead of time next time
    localStorageService.set( 'playerMasterPlaylist', $scope.tracks );
  });

  // On the sidebars closing, check if they're both closed, and if so, expand
  // the playlist to full width
  $rootScope.$watchCollection( 'sidebarStatus', function () {
    var status = $rootScope.sidebarStatus;

    $scope.fullWidth = status.left && status.right;
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

  /**
   * Attempt to play the next track in the master playlist.
   *
   * @return {Boolean} Returns true/false on play success/fail
   */
  function playNextTrack () {
    // Cut tracks down to the playable set just in case
    var playable = $scope.tracks.filter( function ( track ) {
      return ! track.unplayable;
    });

    if ( playable.length ) {
      var trackIndex = playable.indexOf( $scope.currentTrack );

      if ( trackIndex > -1 && playable[ trackIndex + 1 ] ) {
        $rootScope.$broadcast( 'playTrack', playable[ trackIndex + 1 ] );

        return true;
      }
    }

    // Apparently there was nothing to play
    return false;
  }

  /**
   * Attempt to play the previous track in the master playlist.
   *
   * @return {Boolean} Returns true/false on play success/fail
   */
  function playPreviousTrack () {
    // Cut tracks down to the playable set just in case
    var playable = $scope.tracks.filter( function ( track ) {
      return ! track.unplayable;
    });

    if ( playable.length ) {
      var trackIndex = playable.indexOf( $scope.currentTrack );

      if ( trackIndex > -1 && playable[ trackIndex - 1 ] ) {
        $rootScope.$broadcast( 'playTrack', playable[ trackIndex - 1 ] );

        return true;
      }
    }

    // Apparently there was nothing to play
    return false;
  }
}]);

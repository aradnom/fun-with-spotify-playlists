/**
 * Controller for The Player.
 */
App.controller( 'Player', [ '$scope', '$rootScope', '$element', 'spotifyHelper', 'utility', '$interval', '$timeout', function ( $scope, $rootScope, $element, spotifyHelper, utility, $interval, $timeout ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Assume we're not playing to start and that a track isn't loaded
  var progressTimer   = null;
  $scope.currentTrack = null;
  $scope.playing      = false;

  /////////////////////////////////////////////////////////////////////////////
  // Events ///////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // On request, play passed Spotify track object
  $rootScope.$on( 'playTrack', function ( $event, track ) {
    playTrack( track );
  });

  // On request, stop playback
  $rootScope.$on( 'stopPlayback', function ( $event, track ) {
    stopPlayback();
  });

  // On the sidebars closing, move player a bit to take advantage of the extra
  // space
  $rootScope.$watchCollection( 'sidebarStatus', function () {
    var status = $rootScope.sidebarStatus;

    $scope.fullWidth = status.left && status.right;
  });

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.playPause = function () {
    if ( $scope.playing ) {
      stopPlayback();
    } else {
      if ( $scope.currentTrack ) {
        playTrack( $scope.currentTrack );
      }
    }
  };

  $scope.nextTrack = function () {
    $rootScope.$broadcast( 'nextTrack' );
  };

  $scope.previousTrack = function () {
    $rootScope.$broadcast( 'previousTrack' );
  };

  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Stop playback and update player status appropriately.
   */
  function stopPlayback () {
    spotifyHelper.pause()
      .then( function ( response ) {
        if ( response && ! response.playing ) {
          setPlayerStatusStopped();
        } else {
          // Deal with player errors
          console.error( response );
        }
      });
  }

  /**
   * Play a track object.
   *
   * @param  {Object} track Track object from Spotify API
   */
  function playTrack ( track ) {
    spotifyHelper.play( track.uri )
      .then( function ( response ) {
        if ( response.playing ) {
          // Set the player status to playing
          setPlayerStatusPlaying( track, response );

          // Update the current track
          $scope.currentTrack = track;
        } else {
          // Deal with player errors
          // If API returns a specific error (4303), track is unplayable
          // (usually because it doesn't exist or got moved), so mark it as such
          // to avoid this is in the future
          if ( response.error && response.error.type && response.error.type === '4303' ) {
            $rootScope.$broadcast( 'unplayableTrack', track );
          }

          console.error( response );
        }
      });
  }

  /**
   * Update the player status to playing.
   *
   * @param {Object} track    Spotify Track object
   * @param {Object} response Response object from play or status request
   */
  function setPlayerStatusPlaying ( track, response ) {
    $scope.playing = true;

    startPlayerProgress( track );

    // Tell the world
    $rootScope.$broadcast( 'playerPlaying' );
  }

  /**
   * Update the player status to not playing.
   */
  function setPlayerStatusStopped () {
    // Turn of playing status
    $scope.playing = false;

    // Update player progress
    stopPlayerProgress();

    // Tell the world
    $rootScope.$broadcast( 'playerStopped' );
  }

  /**
   * Clear all progress-related status "stuff."
   */
  function clearProgress () {
    var $progress = $element.find( '.player__progress__inner' );

    // Reset counters
    $scope.currentTime   = null;
    $scope.timeRemaining = null;

    // Reset progress width
    $progress.width( 0 );

    // As well as progress counter
    if ( progressTimer ) {
      $interval.cancel( progressTimer );

      progressTimer = null;
    }

    // Reset reverse remaining timer
    $scope.reverseRemaining = false;
  }

  /**
   * Setup player progress bar counter and timing.
   *
   * @param {Object} track Spotify Track object
   */
  function startPlayerProgress ( track ) {
    var $progress  = $element.find( '.player__progress__inner' );

    // Clear progress before doing anything else
    clearProgress();

    // Set up progress counting
    var duration         = Math.round( track.duration_ms / 1000 );
    var progress         = 0;
    var timeRemaining    = duration;
    $scope.currentTime   = utility.getPlayingTimeString( progress );
    $scope.timeRemaining = '-' + utility.getPlayingTimeString( timeRemaining );

    // Start timer to update progress as track plays
    // Handle timing by date because timers are horribly inaccurate
    var start  = moment();
    var end    = moment().add( moment.duration( track.duration_ms ) );

    progressTimer = $interval( function () {
      var now                = moment();
      var progress           = ( now - start ) / 1000;
      var progressRounded    = Math.round( progress );
      var progressPercentage = progress / duration;
      var playing            = now.isBefore( end );

      if ( playing ) {
        // Set progress width
        $progress.width( ( progressPercentage * 100 ) + '%' );

        // And update playing numbers
        $scope.currentTime = utility.getPlayingTimeString( progressRounded );
        $scope.timeRemaining = '-' + utility.getPlayingTimeString( duration - progressRounded );

        // If we're a bit into playback, reverse display of Remaining timers
        if ( progressPercentage > 0.3 ) {
          $scope.reverseRemaining = true;
        }
      } else {
        // We've hit the end of the track so let the playlist know that
        $rootScope.$broadcast( 'trackEnded' );
      }
    }, 250 );
  }

  /**
   * Shut down player progress bar.
   */
  function stopPlayerProgress () {
    clearProgress();
  }
}]);

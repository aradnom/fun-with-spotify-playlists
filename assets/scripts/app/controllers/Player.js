/**
 * Controller for The Player.
 */
App.controller( 'Player', [ '$scope', '$rootScope', '$element', 'spotifyHelper', 'utility', '$interval', function ( $scope, $rootScope, $element, spotifyHelper, utility, $interval ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Assume we're not playing to start and that a track isn't loaded
  var currentTrack  = null;
  var progressTimer = null;
  $scope.playing    = false;

  /////////////////////////////////////////////////////////////////////////////
  // Events ///////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // On request, play passed Spotify track object
  $rootScope.$on( 'playTrack', function ( $event, track ) {
    playTrack( track );
  });

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.playPause = function () {
    if ( $scope.playing ) {
      stopPlayback();
    } else {
      if ( currentTrack ) {
        playTrack( currentTrack );
      }
    }
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
          console.log( response );
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
          currentTrack = track;
        } else {
          // Deal with player errors
          console.log( response );
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
    console.log( track, response );

    $scope.playing = true;

    startPlayerProgress( track );
  }

  /**
   * Update the player status to not playing.
   */
  function setPlayerStatusStopped () {
    // Turn of playing status
    $scope.playing = false;

    // Update player progress
    stopPlayerProgress();
  }

  /**
   * Clear all progress-related status "stuff."
   */
  function clearProgress () {
    // Reset counters
    $scope.currentTime   = null;
    $scope.timeRemaining = null;

    // Reset styles
    $scope.progressStyles = {
      'transition-duration': '',
      '-moz-transition-duration': '',
      '-webkit-transition-duration': '',
      '-o-transition-duration': '',
      '-ms-transition-duration': ''
    };

    $scope.progressStyles.width = '0';

    $scope.safeApply();

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
    // Clear progress before doing anything else
    clearProgress();

    // Set progress styles
    var duration = Math.round( track.duration_ms / 1000 );

    // Set progress styles
    $scope.progressStyles = {
      'transition-duration': duration.toString() + 's',
      '-moz-transition-duration': duration.toString() + 's',
      '-webkit-transition-duration': duration.toString() + 's',
      '-o-transition-duration': duration.toString() + 's',
      '-ms-transition-duration': duration.toString() + 's'
    };

    // And set width
    $scope.progressStyles.width = '100%';

    // Set up progress counting
    var progress         = 0;
    var timeRemaining    = duration;
    $scope.currentTime   = utility.getPlayingTimeString( progress );
    $scope.timeRemaining = '-' + utility.getPlayingTimeString( timeRemaining );

    // Start timer to update progress as track plays
    progressTimer = $interval( function () {
      if ( progress < duration ) {
        $scope.currentTime = utility.getPlayingTimeString( ++progress );
        $scope.timeRemaining = '-' + utility.getPlayingTimeString( --timeRemaining );

        // If we're a bit into playback, reverse display of Remaining timers
        if ( ( progress / duration ) > 0.3 ) {
          $scope.reverseRemaining = true;
        }
      }
    }, 1000 );
  }

  /**
   * Shut down player progress bar.
   */
  function stopPlayerProgress () {
    clearProgress();
  }
}]);

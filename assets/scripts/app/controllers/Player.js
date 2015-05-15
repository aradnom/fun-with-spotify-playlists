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

  // On the sidebars closing, move player a bit to take advantage of the extra
  // space
  $scope.$on( 'sidebarToggle', function ( $event, closed, side ) {
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

    // Reset styles - with regular jQuery because we actually need this to go
    // through right-the-hell-now, not when-digest-gets-around-to-it.
    $progress.css({
      'transition-duration': '0',
      '-moz-transition-duration': '0',
      '-webkit-transition-duration': '0',
      '-o-transition-duration': '0',
      '-ms-transition-duration': '0'
    });

    // This will kill a CSS transition mid-progress
    $progress.width( 0 ).hide().show( 0 );

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
    var $container = $element.find( '.player__progress' );
    var $progress  = $element.find( '.player__progress__inner' );

    // Clear progress before doing anything else
    clearProgress();

    // Set progress styles
    var duration = Math.round( track.duration_ms / 1000 );

    // Set progress styles
    $progress.css({
      'transition-duration': duration.toString() + 's',
      '-moz-transition-duration': duration.toString() + 's',
      '-webkit-transition-duration': duration.toString() + 's',
      '-o-transition-duration': duration.toString() + 's',
      '-ms-transition-duration': duration.toString() + 's'
    });

    // And set width
    $progress.width( '100%' );

    // Set up progress counting
    var progress         = 0;
    var timeRemaining    = duration;
    $scope.currentTime   = utility.getPlayingTimeString( progress );
    $scope.timeRemaining = '-' + utility.getPlayingTimeString( timeRemaining );

    // Start timer to update progress as track plays
    // Handle timing by date because timers are horribly inaccurate
    var start  = moment();
    var end    = moment().add( moment.duration( track.duration_ms ) );

    progressTimer = $interval( function () {
      var now      = moment();
      var progress = Math.round( ( now - start ) / 1000 );
      var playing  = now.isBefore( end );

      if ( playing ) {
        $scope.currentTime = utility.getPlayingTimeString( progress );
        $scope.timeRemaining = '-' + utility.getPlayingTimeString( duration - progress );

        // If we're a bit into playback, reverse display of Remaining timers
        if ( ( progress / duration ) > 0.3 ) {
          $scope.reverseRemaining = true;
        }
      } else {
        // We've hit the end of the track
        $rootScope.$broadcast( 'trackEnded' );

        stopPlayback();
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

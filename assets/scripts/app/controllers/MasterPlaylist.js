/**
 * Controller for the main playlist.
 */
App.controller( 'MasterPlaylist', [ '$scope', '$element', '$rootScope', 'localStorageService', function ( $scope, $element, $rootScope, localStorageService ) {
  // No track is playing to start
  $scope.currentTrack = null;

  // Set up the master list of tracks - load from cache if available
  $scope.tracks = localStorageService.get( 'playerMasterPlaylist' );

  if ( ! $scope.tracks ) { $scope.tracks = []; }

  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.playTrack = function ( track ) {
    // Tell the player to play the track
    $rootScope.$broadcast( 'playTrack', track );
  };

  $scope.$on( 'trackDropped', function ( $event, track ) {
    // Add the track
    addToPlaylist( track );
  });

  // On play track event, display track as the current track
  $scope.$on( 'playTrack', function ( $event, track ) {
    $scope.currentTrack = track;
  });

  // On player playing, set current item to active
  $scope.$on( 'playerPlaying', function () {
    $scope.playing = true;
  });

  // On player stopped, set current item to inactive
  $scope.$on( 'playerStopped', function () {
    $scope.playing = false;
  });

  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Add to the master playlist and update the track cache appropriately
   *
   * @param {Object} track Spotify track object
   */
  function addToPlaylist ( track ) {
    // Add track to the master list
    $scope.tracks.push( track );

    // And update the cache
    localStorageService.set( 'playerMasterPlaylist', $scope.tracks );
  }
}]);

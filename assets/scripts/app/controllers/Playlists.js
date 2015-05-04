/**
 * Playlists controller.
 */
App.controller( 'Playlists', [ '$scope', '$rootScope', '$element', 'spotifyApi', 'resources', 'spotifyConfig', function ( $scope, $rootScope, $element, spotifyApi, resources, spotifyConfig ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  // Wait for resources to be loaded before going
  $scope.$on( 'resourcesReady', function () {
    displayPlaylists( resources.playlists );
  });


  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  $scope.showPlaylist = function ( $event, playlist ) {
    var $parent = $($event.currentTarget).parent();
    var $tracks = $parent.find( '.playlist__tracks' );

    if ( playlist.activeTracks ) {
      $tracks.velocity( 'slideUp', { duration: playlist.tracks.length * 50, easing: 'easeOutExpo', complete: function () {
        playlist.activeTracks = null;

        $scope.safeApply();
      }});
    } else if ( playlist.tracks && playlist.tracks.length ) {
      playlist.activeTracks = playlist.tracks;

      $scope.safeApply();

      var unsubscribe = $scope.$on( 'ngRepeatFinished', function () {
        $tracks.velocity( 'slideDown', { duration: playlist.tracks.length * 50, easing: 'easeOutExpo' });

        unsubscribe();
      });
    }
  };

  $scope.playTrack = function ( track ) {
    // Tell the player to play the track
    $rootScope.$broadcast( 'playTrack', track );
  };


  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Put together display playlist array
   *
   * @param  {Array} playlists Array of raw playlist results
   */
  function displayPlaylists ( playlists ) {
    var displayPlaylists = [];

    playlists.forEach( function ( playlist ) {
      displayPlaylists.push({
        id: playlist.id,
        image: playlist.images && playlist.images.length ? playlist.images[0].url : null,
        name: playlist.name,
        tracks: playlist.tracks
      });
    });

    // Turn the lights on
    $scope.playlists = displayPlaylists;
  }
}]);

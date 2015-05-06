/**
 * Controller for the main playlist.
 */
App.controller( 'MasterPlaylist', [ '$scope', '$element', function ( $scope, $element ) {
  // Set up empty list of tracks
  $scope.tracks = [];

  $scope.$on( 'trackDropped', function ( $event, track ) {
    // Add the track to the active playlist
    $scope.tracks.push( track.track );
  });
}]);

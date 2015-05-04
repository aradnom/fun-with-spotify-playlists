/**
 * Body-level controller for anything site-wide.
 */
App.controller( 'Main', [ '$scope', '$element', 'spotifyHelper', '$timeout', 'Spotify', function ( $scope, $element, spotifyHelper, $timeout, Spotify ) {
  // $scope.$on( 'spotifyHelperLoaded', function () {
  //   // Play a track
  //   console.log( 'Starting playback...' );

  //   spotifyHelper.play( 'spotify:track:6qIhYlaLt0ra6YohxThTqi' );

  //   // Pull the status after a bit
  //   $timeout( function () {
  //     console.log( 'Pulling playback status...' );

  //     spotifyHelper.status()
  //       .then( function ( status ) {
  //         console.log( status );
  //       });
  //   }, 2500 );

  //   // After another bit, pause it
  //   $timeout( function () {
  //     console.log( 'Pausing playback...' );

  //     spotifyHelper.pause();
  //   }, 5000 );
  // });

  // Soooo $scope.$apply() is something you sometimes have to use when dealing
  // with 3rd-party DOM events (which in practice happens all the time).
  // Angular sucks at handling these calls safely, so the following will just
  // make sure it's not trying to call it when in the middle of an existing
  // apply/digest cycle.  This will automatically propagate to all scopes
  // below the main controller (so the whole app)
  $scope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if ( phase === '$apply' || phase === '$digest' ) {
      if ( fn && ( typeof( fn ) === 'function' ) ) fn();
    } else {
      this.$apply(fn);
    }
  };
}]);

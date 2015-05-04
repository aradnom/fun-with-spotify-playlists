/**
 * Global object for simple Underscore templates.
 */
App.service( 'templates', [ 'spotifyConfig', function ( spotifyConfig ) {
  return {
    spotifyCommandUrl: spotifyConfig.spotifyHelperUrl + '<%= action %>.json?csrf=<%= csrf %>&oauth=<%= oauth %>&<%= suffix %>&ref=&cors'
  };
}]);

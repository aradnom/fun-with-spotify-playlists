/**
 * Service for misc. Spotify functionality.
 */
App.service( 'spotifyUtility', [ function () {
  var service = {};

  /**
   * Given a Spotify track object, return thumbnail of the specified size.
   * If the size cannot be found and fallback is true, just return the first
   * available image instead.
   *
   * @param  {Object}  track    Spotify track object
   * @param  {Integer} size     Desired thumbnail size.  Valid options:
   * 64, 300, 640
   * @param  {Boolean} fallback Pass true to fall back to first available
   * image if desired size cannot be found.
   * @return {String}           Returns thumbnail URI if it exists
   */
  service.getTrackThumbnail = function ( track, size, fallback ) {
    if ( track.album && track.album.images && track.album.images.length ) {
      var thumbnail = track.album.images.filter( function ( image ) {
        return image.width === size;
      });

      if ( thumbnail.length ) {
        return thumbnail[0].url;
      }

      // Just return the first available image then
      return track.album.images[0].url;
    }

    // Guess it didn't work out
    return null;
  };

  /**
   * Do a bit of formatting on a raw Spotify track to make display easier.
   *
   * @param  {Object} track Track object from Spotify API
   * @return {Object}       Returns formatted track object
   */
  service.formatTrack = function ( track ) {
    // Track can be nested in other stuff depending on where it came from so
    // find it first
    if ( track.track ) { track = track.track; }

    // Put together display-friendly track titles
    var title   = track.name;
    var artists = track.artists.map( function ( artist ) {
      return artist.name;
    });

    track.artist_string  = artists.join( ', ' );
    track.playlist_title = track.artist_string + ' - ' + title;

    // Get reference thumbnail
    track.thumbnail      = service.getTrackThumbnail( track, 300, true );

    return track;
  };

  return service;
}]);

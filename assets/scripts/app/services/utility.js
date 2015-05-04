/**
 * Service for random functionality that doesn't fit better elsewhere.
 */
App.service( 'utility', [ function () {
  return {
    /**
     * Convert a track playing time in seconds or milliseconds to formatted
     * minutes:seconds string.
     *
     * @param  {Int}    time Raw time to format, in seconds or milliseconds
     * @param  {String} unit Unit of raw time, 's' or 'ms.'  Defaults to
     * seconds
     * @return {String}      Returns formatted playtime string
     */
    getPlayingTimeString: function ( time, unit ) {
      unit = unit || 's';

      // Deal with milliseconds
      if ( unit === 'ms' ) {
        time /= 1000;
      }

      // Round time to nearest second
      time = Math.round( time );

      var minutes = parseInt( time / 60 ).toString();
      var seconds = ( time % 60 ).toString();

      if ( seconds < 10 ) { seconds = '0' + seconds; }

      // And back we go
      return minutes + ':' + seconds;
    }
  };
}]);

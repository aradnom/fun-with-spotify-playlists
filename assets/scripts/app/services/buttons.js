/**
 * Service for handling simple button-related tasks that are used in multiple
 * controllers/directives.
 */
App.service( 'buttons', [ '$http', '$q', '$timeout', function ( $http, $q, $timeout ) {
  return {
    /**
     * 'Flash' a button - display the button's highlight state for a period
     * before fading back to the default state.
     *
     * @param  {Object} $button Button selector to be flashed
     */
    flash: function ( $button ) {
      $button.addClass( '--active' );

      $timeout( function () {
        $button.removeClass( '--active' );
      }, 250 );
    }
  };
}]);

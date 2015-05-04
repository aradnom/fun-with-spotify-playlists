'use strict';

// Creates a simple loading button which can be controlled from scope
// controller
App.directive( 'adminLoadingButton', function () {
  return {
    restrict: 'A',
    controller: function ( $scope, $element, $attrs ) {
      // Assign the necessary attributes to make this a Ladda button
      $element.addClass( 'ladda-button' );
      $element.attr( 'data-style', 'expand-right' );

      // Build new Ladda instance
      var ladda = Ladda.create( $element[0] );

      // Button events
      $scope.$on( 'loadingStart', function () {
        ladda.start();
      });
      $scope.$on( 'loadingStop', function () {
        ladda.stop();
      });
    }
  };
});

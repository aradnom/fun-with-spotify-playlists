'use strict';

// Creates a simple message element which can be placed where needed and used
// to display discrete success/error messages
App.directive( 'adminMessage', function ( $window ) {
  return {
    restrict: 'E',
    controller: function ( $scope, $element, $attrs ) {
      var message = $scope.message = {
        classes: {
          '--visible': false,
          '--error'  : false,
          '--success': false
        }
      };

      // Success message
      message.success = function ( content ) {
        message.content = content;

        message.classes['--visible'] = true;
        message.classes['--success'] = true;
        message.classes['--error']   = false;
      };

      // Error message
      message.error = function ( content ) {
        message.content = content;

        message.classes['--visible'] = true;
        message.classes['--success'] = false;
        message.classes['--error']   = true;
      };

      // Hide message
      message.hide = function () {
        message.content = null;

        message.classes['--visible'] = false;
        message.classes['--success'] = false;
        message.classes['--error']   = false;
      };
    },
    template: '<div class="admin-message" ng-bind-html="message.content" ng-class="message.classes"></div>'
  };
});

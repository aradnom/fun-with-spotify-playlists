// Focuses input based on scope var
App.directive('focusMe', function($timeout, $parse) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function(value) {
        if(value === true) {
          // Timeout is needed to let the element
          // render.
          $timeout(function() {
            element[0].focus();
          });
        }
      });
    }
  };
});
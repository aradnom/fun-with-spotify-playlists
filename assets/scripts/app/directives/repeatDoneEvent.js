'use strict';

/**
 * Simple directive for emitting an event when repeat is finished
 */
App.directive( 'repeatDoneEvent', function () {
  return function( scope, element, attrs ) {
    if ( scope.$last ) {
      // At this point, ng-repeat is done populating - but we're not finished
      // yet because $compile still has to compile any tags in the repeat
      // directive
      scope.$evalAsync(function() {
        // NOW we're done
        scope.$emit( 'ngRepeatFinished', element );
      });
    }
  };
});

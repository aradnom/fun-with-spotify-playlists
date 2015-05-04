'use strict';

/* Simple directive for emitting an event when repeat is finished */
App.directive( 'repeatDoneEvent', function ( $window ) {
  return function( scope, element, attrs ) {
    if ( scope.$last ) scope.$emit( 'ng_repeat_finished', element );
  };
});


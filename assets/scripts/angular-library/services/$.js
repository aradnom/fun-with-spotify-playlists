'use strict';

// This does one very simple, incredibly stupid thing - it prevides $ (jQuery)
// as a service because wordpress will noconflict it before we arrive at the
// Angular bits.  Yes, you could type 'jQuery' but that is extra work I will
// not stand for.
App.service( '$', [ function () {
  return jQuery;
}]);

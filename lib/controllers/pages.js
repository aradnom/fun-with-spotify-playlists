'use strict';

/**
 * This controller handles all page-related routes that aren't more specific.
 */


///////////////////////////////////////////////////////////////////////////////
// Setup //////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


var _      = require( 'underscore' );
var Args   = require( 'yargs' ).argv;

// Pull in global config
var config = require( '../config/config.js' );

// Figure out if this is a production or dev environment
var env    = Args.env ? Args.env : config.environment;

// Set up configuration for production vs. dev - dev is assumed if
// production isn't set
if ( env == 'production' ) {
    // Production includes
    var assets = {
        stylesheet: '/assets/styles/application.min.css',
        vendors: '/assets/scripts/dist/vendor.min.js',
        app: '/assets/scripts/dist/application.min.js'
    };
} else {
    // Development includes
    var assets = {
        stylesheet: '/assets/styles/application.css',
        vendors: '/assets/scripts/dist/vendor.js',
        app: '/assets/scripts/dist/application.js'
    };
}


///////////////////////////////////////////////////////////////////////////////
// Routes /////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/**
 * Homepage request.
 *
 * @param  {Object} req Express request object
 * @param  {Object} res Express response object
 * @return {Object}     Returns page content
 */
exports.home = function ( req, res ) {
  // Merge in any additional args you want to pass to the route here
  var args = {};

  res.render( 'index.html', _.extend( args, assets ));
};

// jshint /////////////////////////////////////////////////////////////////////
// Configurable JS syntax alerts - the rules for jshint are in the .jshintrc
// file in the build root.

module.exports = {
  options: {
    jshintrc: '.jshintrc',
    reporter: require( 'jshint-stylish' ),
    force: true
  },
  dev: [
    '../assets/scripts/dist/application.js'
  ]
};





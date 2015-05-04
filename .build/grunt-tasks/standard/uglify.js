// Uglify /////////////////////////////////////////////////////////////////////
// JS minifier - minifies JS output (usually from concat)

module.exports = {
  options: {
    // the banner is inserted at the top of the output
    banner: '/*! <%= pkg.name %> main - built with Grunt - DO NOT MODIFY THIS FILE DIRECTLY - built <%= grunt.template.today("mm-dd-yyyy") %> */\n'
  },
  vendor: {
    src: ['../assets/scripts/dist/vendor.js'],
    dest: '../assets/scripts/dist/vendor.min.js'
  },
  application: {
    src: ['../assets/scripts/dist/application.js'],
    dest: '../assets/scripts/dist/application.min.js'
  }
};





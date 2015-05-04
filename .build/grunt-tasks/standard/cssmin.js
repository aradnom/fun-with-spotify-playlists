// CSSMin /////////////////////////////////////////////////////////////////////
// Takes stylesheets and turns them into stlshts

var banner = '/*! <%= pkg.name %> main - built with Grunt - DO NOT MODIFY THIS FILE DIRECTLY - built <%= grunt.template.today("mm-dd-yyyy") %> */\n';

module.exports = {
  application: {
    options: { banner: banner },
    files: {
      '../assets/styles/application.min.css': '../assets/styles/application.css'
    }
  }
};





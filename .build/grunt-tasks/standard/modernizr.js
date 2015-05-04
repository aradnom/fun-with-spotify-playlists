// Grunt Modernizr ////////////////////////////////////////////////////////////
// This nifty little guy looks at your CSS/JS files and generates a custom
// Modernizr build with the tests you need.  Simple and automatic.

module.exports = {
  dist: {
    devFile: '../assets/bower-components/modernizr/modernizr.js',
    outputFile: '../assets/scripts/vendor/modernizr.custom.min.js',
    files: {
      src: [
        '../assets/scripts/dist/application.js',
        '../assets/styles/application.css'
      ]
    },
    tests: ['csstransitions', 'svg', 'input'],
    uglify: true
  }
};





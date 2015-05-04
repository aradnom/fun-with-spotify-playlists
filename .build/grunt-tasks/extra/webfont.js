// Webfont ////////////////////////////////////////////////////////////
// Make webfonts on the fly from vectors.  Still more convenient for 
// simple icons over straight SVGs occasionally

module.exports = {
  icons: {
    src: '../assets/fonts/icons/svg-min/**/*.svg',
    dest: '../assets/fonts/icons/',
    destCss: '../assets/sass/fonts/',
    options: {
      syntax: 'bootstrap',
      stylesheet: 'scss',
      htmlDemo: false,
      relativeFontPath: '../fonts/icons/',
      template: '../assets/fonts/icons/tmpl.css',
      templateOptions: {
        classPrefix: 'icon'
      }
    }
  }
};


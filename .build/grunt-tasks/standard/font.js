// Fontsmith //////////////////////////////////////////////////////////////////
// Build custom webfonts using the same engine as Icomoon.

module.exports = {
  icons: {
    src: '../assets/fonts/icons/dist/*.svg',
    destCss: '../assets/sass/fonts/_icons.scss',
    destFonts: '../assets/fonts/icons/icons.{svg,woff,eot,ttf}',
    fontFamily: 'icons',
    cssRouter: function(fontpath) {
      return '../' + fontpath;
    }
  }
};

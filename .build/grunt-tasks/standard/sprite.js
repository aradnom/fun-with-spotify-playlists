// Sprites ////////////////////////////////////////////////////////////
// Standalone spriting - this is unnecessary if you're rolling with
// compass

module.exports = {
  normal: {
    src: '../assets/images/spritesheet/normal/*.png',
    destImg: '../assets/images/spritesheet/sprites.png',
    imgPath: '../images/spritesheet/sprites.png',
    destCSS: '../assets/sass/sprites/_sprites.scss',
    cssTemplate: '../assets/images/spritesheet/template.mustache',
    algorithm: 'binary-tree',
    padding: 2
  },
  retina: {
    src: '../assets/images/spritesheet/retina/*.png',
    destImg: '../assets/images/spritesheet/retina-sprites.png',
    imgPath: '../images/spritesheet/retina-sprites.png',
    destCSS: '../assets/sass/sprites/_retina-sprites.scss',
    cssTemplate: '../assets/images/spritesheet/template-retina.mustache',
    algorithm: 'binary-tree',
    padding: 2
  }
};


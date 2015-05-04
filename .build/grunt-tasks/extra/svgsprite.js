// SVG sprites ////////////////////////////////////////////////////////
// Creates SVG sprite sheets that work in a similar way to image
// sprites

module.exports = {
  build: {
    src: [ '../assets/svg/sprites' ],
    dest: '../assets/svg-dist/sprites',
    options: {
      render: {
        css: false,
        scss: {
          dest: '../assets/../../sass/modules/_sprites'
        }
      },
      padding: 10,
      keep: true
    }
  }
};





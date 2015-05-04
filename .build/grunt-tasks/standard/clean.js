// Clean //////////////////////////////////////////////////////////////
// All this does is remove trash.  This is a good idea during the build
// process, but not generally necessary during dev (won't hurt anything
// to have crap lying around as long as the necessary JS/CSS is being
// overwritten)

module.exports = {
  options: {
    force: true
  },
  svgs: {
    src: ['../assets/images/svgs/dist/']
  },
  font: {
    src: ['../assets/fonts/icons/dist/']
  },
  images: {
    src: ['../assets/images/*.{png,jpg,gif}']
  },
  retina_images: {
    src: ['../assets/images/normal/']
  },
  spritesheet: {
    src: [
      '../assets/images/spritesheet/normal/',
      '../assets/images/spritesheet/sprites.png',
      '../assets/images/spritesheet/retina-sprites.png'
    ]
  },
  styles: {
    src: ['../assets/styles/*.{css,map}']
  },
  scripts: {
    src: ['../assets/scripts/dist/*.js']
  }
};


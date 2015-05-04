// Image Resize ///////////////////////////////////////////////////////////////
// Scales images.  Useful for creating normal images from retina images on the
// fly

module.exports = {
  retina_images: {
    options: {
      width: '50%',
    },
    src: '../assets/images/retina/*.{jpg,png}',
    dest: '../assets/images/normal/'
  },
  spritesheet: {
    options: {
      width: '50%',
    },
    src: '../assets/images/spritesheet/retina/*.{jpg,png}',
    dest: '../assets/images/spritesheet/normal/'
  }
};


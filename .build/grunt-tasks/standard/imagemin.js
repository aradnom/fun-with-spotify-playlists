// Image minification /////////////////////////////////////////////////
// Compresses images.  Should not be run every time you modify/add an
// image because that's silly.  This is run at build time.

module.exports = {
  spritesheets: {
    options: {
      optimizationLevel: 1
    },
    files: {
      '../assets/images/spritesheet/sprites.png': '../assets/images/spritesheet/sprites.png',
      '../assets/images/spritesheet/retina-sprites.png': '../assets/images/spritesheet/retina-sprites.png'
    }
  },
  // This is for images that have a retina/normal version but are NOT sprites
  // (images that need to scale, repeating backgrounds, etc.)
  retina_images_normal: {
    options: {
      optimizationLevel: 1
    },
    files: [{
      expand: true,
      cwd: '../assets/images/normal',
      src: ['*.{png,jpg,gif}'],
      dest: '../assets/images/normal'
    }]
  },
  retina_images_retina: {
    options: {
      optimizationLevel: 1
    },
    files: [{
      expand: true,
      cwd: '../assets/images/retina',
      src: ['*.{png,jpg,gif}'],
      dest: '../assets/images/retina'
    }]
  },
  // Run if you're just dropping images in the images folder with nothing extra
  images: {
    options:{
      optimizationLevel: 1
    },
    files: [{
      expand: true,
      cwd: '../assets/images',
      src: ['*.{png,jpg,gif}'],
      dest: '../assets/images'
    }]
  }
};


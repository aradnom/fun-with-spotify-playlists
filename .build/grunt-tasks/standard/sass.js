// Sass ///////////////////////////////////////////////////////////////
// This is what Compass uses to do its magic, but vast majority of the
// time you can get by just fine on vanilla Sass and Autoprefixer
// (below) and this will produce less code and is faster

module.exports = {
	application: {
    options: {
      style: 'compact',
      precision: 5
    },
    files: {
      '../assets/styles/application.css': '../assets/sass/application.sass'
    }
  }
};


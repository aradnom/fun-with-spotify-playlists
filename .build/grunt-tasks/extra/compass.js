// Compass ////////////////////////////////////////////////////////////////////
// Extension on top of Sass, takes care of a lot of busy work.  Generally Sass
// + Autoprefixer is preferred these days
// Note there is a dev and build target - this is for generating minified CSS
// because there have been issues with the output from cssmin

module.exports = {
  dev: {
    options: {
      basePath: base_dir,
      sassDir: 'sass',
      cssDir: 'styles',
      javascriptsDir: 'scripts/vendor',
      imagesDir: 'images',
      outputStyle: 'nested',
      // SPECIAL NOTE ON SOURCE MAPS:
      // This package currently has a bug with timestamps.  To use sourcemaps, edit node_modules/grunt-contrib-compass/tasks/compass.js
      // --> line 45 (display compilation time) and comment out the next 3 lines
      raw: 'sass_options = {:sourcemap => true}',
      relativeAssets: true,
      watch: true
    }
  },
  build: {
    options: {
      basePath: base_dir,
      sassDir: 'sass',
      cssDir: 'styles/tmp',
      javascriptsDir: 'scripts/vendor',
      imagesDir: 'images',
      outputStyle: 'compressed',
      relativeAssets: true
    }
  }
};





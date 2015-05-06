// Watch things ///////////////////////////////////////////////////////
// Watch looks for file changes and runs Grunt tasks when they occur

var config = {
  styles: {
    files: ['../assets/sass/**/{*.sass,*.scss}'],
    tasks: ['css'],
    options: {spawn: false}
  },
  scripts: {
    files: [
      '../assets/scripts/app/**/*.js',
      '../assets/scripts/vendor/**/*.js'
    ],
    tasks: ['js'],
    options: {spawn: false}
  },
  assets: {
    files: ['../assets/images/*.{png,jpg,gif}'],
    tasks: ['imgmin'],
    options: {spawn: false}
  }
};

// Create a separate task just for livereload so we can spawn watch tasks
// concurrently but not run into any issues with livereload trying to bind
// to the same port repeatedly
config.reload = {
  files: [].concat(
    config.scripts.files,
    config.assets.files,

    // This can be useful, but will lead to the reload task firing before
    // Sass is done compiling, so keep that in mind if you turn this on
    // over just watching the finished CSS files
    //config.styles.files,
    ['../assets/styles/application.css'],

    // Templates - reload is the only task we need to run on these
    ['../views/**/*.html']
  ),
  options: {
    spawn: false,
    livereload: true
  }
};

module.exports = config;





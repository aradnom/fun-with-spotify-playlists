module.exports = function(grunt) {

  // Keep track of how long Grunt tasks are taking for debugging/fun
  require('time-grunt')(grunt);

  // Config ///////////////////////////////////////////////////////////////////

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Standard grunt tasks ///////////////////////////////////////////////////

    // CSS
    sass:         require('./grunt-tasks/standard/sass'),
    autoprefixer: require('./grunt-tasks/standard/autoprefixer'),
    cssmin:       require('./grunt-tasks/standard/cssmin'),

    // JS
    concat:       require('./grunt-tasks/standard/concat'),
    modernizr:    require('./grunt-tasks/standard/modernizr'),
    uglify:       require('./grunt-tasks/standard/uglify'),
    jshint:       require('./grunt-tasks/standard/jshint'),

    // Assets
    svgmin:       require('./grunt-tasks/standard/svgmin'),
    font:         require('./grunt-tasks/standard/font'),
    sprite:       require('./grunt-tasks/standard/sprite'),
    image_resize: require('./grunt-tasks/standard/image-resize'),
    imagemin:     require('./grunt-tasks/standard/imagemin'),

    // Utility
    clean:        require('./grunt-tasks/standard/clean'),
    watch:        require('./grunt-tasks/standard/watch'),
    concurrent:   require('./grunt-tasks/standard/concurrent'),

    // PHP
    phpcs:        require('./grunt-tasks/standard/phpcs'),

    // These are used in conjunction with wiredep.  Any scripts which should
    // NOT be included in the final vendor.js file should be placed in
    // exclude while any exceptions (i.e. scripts that couldn't be found
    // via bower) should be placed in include.
    deps: {
      exclude: [
        /modernizr/,
        /es5-shim/,
        /json3/,
        /console-polyfill/,
        /html5shiv/,
        /respond/,
      ],
      include: {
        // Will be inserted before bower dependencies
        before: [
          '../assets/scripts/vendor/modernizr.custom.min.js'
        ],

        // Will be inserted after bower dependencies
        after: []
      }
    },
  });

  // Tasks ////////////////////////////////////////////////////////////////////

  // Automatically load default tasks from packages
  require('load-grunt-tasks')(grunt);

  // Build dependencies task
  // This task takes the script dependencies set above and the output from
  // Bower to create the set of vendor files which will be used in the
  // package
  grunt.registerTask( 'vendor', 'Process bower packages and build vendor.js file.', function () {
    var deps_config = grunt.config('deps');
    var final = [];

    // Pull in all The Stuff using wiredep + any extra in the scripts include and - any excludes
    var wiredep_output = require('wiredep')({
      exclude: deps_config.exclude
    });

    if (wiredep_output && (wiredep_output.js || wiredep_output.css)) {
      // Now that we have our lists, check for extra includes as well
      if (deps_config.include && (deps_config.include.before || deps_config.include.after)) {
        if (deps_config.include.before && deps_config.include.before.length) {
          final = deps_config.include.before;
        }

        final = final.concat(wiredep_output.js);

        if (deps_config.include.after && deps_config.include.after.length) {
          final = final.concat(deps_config.include.after);
        }
      } else {
        // Just sent the default bower deps straight on through
        final = wiredep_output.js;
      }

      console.log('Script build order: \n\n', final);

      // Put together the main scripts file/css file using concat
      grunt.config.set('concat.vendor.src', final);
      grunt.task.run('concat:vendor');

      // And finally uglify the resulting file
      grunt.task.run('uglify:vendor');
    }
  });

  // Register custom grunt tasks //////////////////////////////////////////////

  // Dev tasks

  grunt.registerTask('iconfont', [
    'svgmin:font',
    'font',
    'clean:font',
    'sass:application',
    'autoprefixer:application',
    'cssmin'
  ]);

  grunt.registerTask('spritesheet', [
    'clean:spritesheet',
    'image_resize:spritesheet',
    'sprite',
    'imagemin:spritesheets',
    'sass:application',
    'autoprefixer:application',
    'cssmin'
  ]);

  grunt.registerTask('retina_images', [
    'clean:retina_images',
    'image_resize:retina_images',
    'imagemin:retina_images_normal',
    'imagemin:retina_images_retina'
  ]);

  grunt.registerTask('svgs', [
    'clean:svgs',
    'svgmin:svgs'
  ]);

  grunt.registerTask('css', [
    'sass:application',
    'autoprefixer:application',
    'cssmin'
  ]);

  grunt.registerTask('js', [
    'concat:application',
    'uglify:application'
  ]);

  grunt.registerTask('imgmin', [
    'clean:images',
    'imagemin:images'
  ]);

  // Default task - just watches things

  grunt.registerTask('default', [
    'concurrent'
  ]);
};

// Main Gruntfile
// This defines all of the package tasks that can be run on the various theme
// assets.  This file is loosely broken into the following task categories:
// CSS packages, JS pacakges, Asset-handling packages and utility packages.
// It also includes a custom task for automatically building a single
// vendor file containing all scripts from Bower in the correct dependency
// order (plus you can add/exclude your own files from it if necessary).
// There are tasks defined for building CSS, JS, assets (and all of the above)
// in dev and production flavors (dev mainly focused on build speed)

'use strict';
module.exports = function (grunt) {

    // Automagically loads all grunt tasks from package.json file because
    // listing them one by one is a bummer
    require('load-grunt-tasks')(grunt);

    // Keep track of how long Grunt tasks are taking for debugging/fun
    require('time-grunt')(grunt);

    // Set the base directory to use for all of the paths below
    var base_dir = '.';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /**********************************************************************
        ** CSS PACKAGES *******************************************************
        **********************************************************************/

        

        
        // Sass ///////////////////////////////////////////////////////////////
        // This is what Compass uses to do its magic, but vast majority of the
        // time you can get by just fine on vanilla Sass and Autoprefixer
        // (below) and this will produce less code and is faster

        sass: {
            dev: {
                options: {
                    sourcemap: true,
                    trace: true,
                    style: 'expanded',
                    debugInfo: true,
                    lineNumbers: true,
                    banner: '/*! <%= pkg.name %> main CSS - built <%= grunt.template.today("mm-dd-yyyy") %> */\n'
                },
                files: {
                    '<%= base_dir %>/assets/styles/app.css': base_dir + '/assets/sass/app.sass'
                }
            },
            build: {
                options: {
                    sourcemap: false,
                    trace: false,
                    style: 'compressed',
                    debugInfo: false,
                    lineNumbers: false,
                    banner: '/*! <%= pkg.name %> main CSS - built <%= grunt.template.today("mm-dd-yyyy") %> */\n'
                },
                files: {
                    '<%= base_dir %>/assets/styles/app.min.css': base_dir + '/assets/sass/app.sass'
                }
            }
        },
        

        
        // Autoprefixer ///////////////////////////////////////////////////////
        // Autoprefixer does something very simple but cool - it detects CSS
        // that requires vendor prefixes (i.e. -webkit-border-radius) and adds
        // them automatically.  You can specify what browsers it should worry
        // about it and it does the rest - and you're guaranteed it will work
        // on those browsers without added properties you don't need

        autoprefixer: {
            options: {
                browsers: ['> 1%', 'last 3 versions', 'Firefox ESR', 'ie 9'], // How far back we generally support
                map: true
            },
            build: {
                expand: true,
                flatten: true,
                src: base_dir + '/assets/styles/{,*/}*.css',
                dest: base_dir + '/assets/styles/'
            }
        },
        

        /**********************************************************************
        ** THE SCRIPTS OF JAVA ************************************************
        **********************************************************************/

        
        // Modernizr //////////////////////////////////////////////////////////
        // Generates a custom Modernizr build that includes only the tests you
        // reference in your app. You can also specify tests which should always
        // be included

        modernizr: {
            dist: {
                devFile: base_dir + '/assets/bower-components/modernizr/modernizr.js',
                outputFile: base_dir + '/assets/scripts/vendor/modernizr.custom.min.js',
                files: {
                    src: [
                        base_dir + '/assets/scripts/build/{,*/}*.js',
                        base_dir + '/assets/styles/{,*/}*.css',
                    ]
                },
                tests: [ 'csstransitions', 'svg', 'input' ],
                uglify: true
            }
        },
        

        
        // JSHint /////////////////////////////////////////////////////////////
        // Reports JavaScript errors.  Behavior can be modified by editing the
        // file .jshintrc in the package root - full list of available options
        // can be found at http://www.jshint.com/docs/options/

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish'),
                force: true
            },
            dev: [
                base_dir + '/assets/scripts/app/app/*.js',
                base_dir + '/assets/scripts/app/filters/*.js',
                base_dir + '/assets/scripts/app/services/*.js',
                base_dir + '/assets/scripts/app/controllers/*.js',
                base_dir + '/assets/scripts/app/directives/*.js'
            ]
        },
        

        // Script dependencies ////////////////////////////////////////////////

        
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
                /respond/
            ],
            include: {
                // Will be inserted before bower dependencies
                before: [
                    base_dir + '/assets/scripts/custom/grunticon-inline.min.js'
                ],

                // Will be inserted after bower dependencies
                after: []
            }
        },
        

        
        // Concat /////////////////////////////////////////////////////////////
        // Duct tapes files together

        concat: {
            
            // Vendor includes are automatically worked out by wiredeps
            vendor: {
                src: [ /* Filled dynamically by wiredeps */ ],
                dest: base_dir + '/assets/scripts/build/vendor.js',
                nonull: true
            },
            

            
            // App components - built separately from output generated
            // by ngmin to maintain ordering
            app: {
                src: [ base_dir + '/assets/scripts/app/generated/app/**/*.js' ],
                dest: base_dir + '/assets/scripts/app/build/app.js',
                nonull: true
            },

            app_filters: {
                src: [ base_dir + '/assets/scripts/app/generated/filters/**/*.js' ],
                dest: base_dir + '/assets/scripts/app/build/filters.js',
                nonull: true
            },

            app_services: {
                src: [ base_dir + '/assets/scripts/app/generated/services/**/*.js' ],
                dest: base_dir + '/assets/scripts/app/build/services.js',
                nonull: true
            },

            app_controllers: {
                src: [ base_dir + '/assets/scripts/app/generated/controllers/**/*.js' ],
                dest: base_dir + '/assets/scripts/app/build/controllers.js',
                nonull: true
            },

            app_directives: {
                src: [ base_dir + '/assets/scripts/app/generated/directives/**/*.js' ],
                dest: base_dir + '/assets/scripts/app/build/directives.js',
                nonull: true
            },

            // Main app concat - pulls together all of the above into a single
            // file
            app_all: {
                src: [
                    '<%= concat.app.dest %>',
                    '<%= concat.app_filters.dest %>',
                    '<%= concat.app_services.dest %>',
                    '<%= concat.app_controllers.dest %>',
                    '<%= concat.app_directives.dest %>',
                ],
                dest: base_dir + '/assets/scripts/build/app.js',
                nonull: true
            },

            // This combines all Angular app files directly into the build
            // directory (skips ngmin).  Can be faster if ngmin is not needed.
            app_combined: {
                src: [
                    base_dir + '/assets/scripts/app/app/*.js',
                    base_dir + '/assets/scripts/app/filters/*.js',
                    base_dir + '/assets/scripts/app/services/*.js',
                    base_dir + '/assets/scripts/app/controllers/*.js',
                    base_dir + '/assets/scripts/app/directives/*.js'
                ],
                dest: base_dir + '/assets/scripts/build/app.js',
                nonull: true
            },
            
        },
        

        // Uglify /////////////////////////////////////////////////////////////
        // Mashes the duct-taped files from concat into a neat little tape ball

        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*! <%= pkg.name %> main - built with Grunt - DO NOT MODIFY THIS FILE DIRECTLY - built <%= grunt.template.today("mm-dd-yyyy") %> */\n'
            },
            
            vendor: {
                src: [ '<%= concat.vendor.dest %>' ],
                dest: base_dir + '/assets/scripts/release/vendor.min.js'
            },
            
            
            // Use target app_all if using the ngmin version, app_combined
            // if not
            app: {
                src: [ '<%= concat.app_combined.dest %>' ],
                dest: base_dir + '/assets/scripts/release/app.min.js'
            }
            
        },

        
        // Ngmin //////////////////////////////////////////////////////////////
        // Angular preprocessing - Angular files require some special handling
        // to make sure the dependency injections don't break due to mangling.
        // Note that this is NOT NEEDED if you use the array version of Angular
        // components

        ngmin: {
            app: {
                expand: true,
                cwd: base_dir + '/assets/scripts/app',
                src: ['app/**/*.js'],
                dest: base_dir + '/assets/scripts/app/generated'
            },
            filters: {
                expand: true,
                cwd: base_dir + '/assets/scripts/app',
                src: ['filters/**/*.js'],
                dest: base_dir + '/assets/scripts/app/generated'
            },
            services: {
                expand: true,
                cwd: base_dir + '/assets/scripts/app',
                src: ['services/**/*.js'],
                dest: base_dir + '/assets/scripts/app/generated'
            },
            controllers: {
                expand: true,
                cwd: base_dir + '/assets/scripts/app',
                src: ['controllers/**/*.js'],
                dest: base_dir + '/assets/scripts/app/generated'
            },
            directives: {
                expand: true,
                cwd: base_dir + '/assets/scripts/app',
                src: ['directives/**/*.js'],
                dest: base_dir + '/assets/scripts/app/generated'
            }
        },
        

        

        /**********************************************************************
        ** ASSETS *************************************************************
        **********************************************************************/

        
        // Sprites ////////////////////////////////////////////////////////////
        // Standalone spriting - this is unnecessary if you're rolling with
        // compass
        sprite: {
            normal: {
                src: base_dir + '/assets/images/sprite-sheet',
                destImg: base_dir + '/assets/images/sprites.png',
                destCSS: base_dir + '/assets/styles/sprites.css'
            },
            retina: {
                src: base_dir + '/assets/images/sprite-sheet-retina',
                destImg: base_dir + '/assets/images/sprites-retina.png',
                destCSS: base_dir + '/assets/styles/sprites-retina.css'
            }
        },
        

        
        // Image minification /////////////////////////////////////////////////
        // Compresses images.  Should not be run every time you modify/add an
        // image because that's silly.  This is run at build time.

        imagemin: {
            dynamic: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: base_dir + '/assets/images/',
                    src: ['**/*.{png,jpg,gif}'],
                    dest: base_dir + '/assets/images/'
                }]
            }
        },
        

        
        // SVG minification ///////////////////////////////////////////////////
        // Note that the src/dest are the same here because Grunticon will place
        // these in the dist folder

        svgmin: {
            options: {
                plugins: [
                    { removeViewBox: false },
                    { removeUselessStrokeAndFill: false },
                    { removeEmptyAttrs: false },
                    { mergePaths: false },
                    { cleanupIDs: false }
                ]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: base_dir + '/assets/svg/',
                    src: ['**/*.svg'],
                    dest: base_dir + '/assets/svg/',
                    ext: '.svg'
                }]
            }
        },
        

        
        // Grunticon //////////////////////////////////////////////////////////
        // Provides backwards-compatibility support for SVGs

        grunticon: {
            build: {
                files: [{
                    expand: true,
                    cwd: base_dir + '/assets/svg/',
                    src: [ '*.svg', ],
                    dest: base_dir + '/assets/svg-dist/'
                }],
                options: {
                    // This is a custom option used within this gruntfile.
                    // Setting it will trigger and extra script include which
                    // will take grunticon output and inject physical SVGs in
                    // place of backgrounds (this is necessary for 
                    // styling/animating SVGs).  The class 'no-inline' can be
                    // applied to SVGs which should not use this behavior
                    inline: true
                }
            }
        },
        

        
        // Webfont ////////////////////////////////////////////////////////////
        // Make webfonts on the fly from vectors.  Still more convenient for 
        // simple icons over straight SVGs occasionally

        webfont: {
            icons: {
                src: base_dir + '/assets/fonts/icons/svg-min/**/*.svg',
                dest: base_dir + '/assets/fonts/icons/',
                destCss: base_dir + '/assets/sass/fonts/',
                options: {
                    syntax: 'bootstrap',
                    stylesheet: 'scss',
                    htmlDemo: false,
                    relativeFontPath: base_dir + '/assets/../fonts/icons/',
                    template: base_dir + '/assets/fonts/icons/tmpl.css',
                    templateOptions: {
                        classPrefix: 'icon'
                    }
                }
            }
        },

        

        

        
        // HTML Min ///////////////////////////////////////////////////////////
        // Minifies HTML.  This only does any good on flat sites where you're
        // working directly with the HTML files (so CMSs are basically out)

        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                // Add to these are necessary
                files: {
                    'dist/index.html': 'src/index.html'
                }
            }
        },
        

        

        

        

        /**********************************************************************
        ** UTILITY ************************************************************
        **********************************************************************/

        

        
        // Bower install //////////////////////////////////////////////////////
        // This little guy pulls down Bower like normal, but only retains the
        // main files from the package.  Regular bower install can still be
        // used if desired, but this is definitely cleaner.  If a main file
        // can't be found for a package, the entire directory will be used
        // like regular bower (fun quirk though - if the main file path 
        // exists but is wrong it will move nothing)

        bower: {
            install: {
                options: {
                    targetDir: base_dir + '/assets/bower-components',
                    layout: 'byType',
                    install: true,
                    verbose: false,
                    cleanTargetDir: true,
                    cleanBowerDir: true,
                    bowerOptions: {}
                }
            }
        },
        

        // Clean //////////////////////////////////////////////////////////////
        // All this does is remove trash.  This is a good idea during the build
        // process, but not generally necessary during dev (won't hurt anything
        // to have crap lying around as long as the necessary JS/CSS is being
        // overwritten)

        clean: {
            dev: {
                files: [{
                    dot: true,
                    src: [
                        base_dir + '/assets/scripts/build/*',
                        base_dir + '/assets/scripts/app/generated/*',
                        base_dir + '/assets/scripts/app/build/*'
                    ]
                }]
            },
            build: {
                files: [{
                    dot: true,
                    src: [ base_dir + '/assets/scripts/release/*' ]
                }]
            },
            css: {
                files: [{
                    dot: true,
                    src: [ base_dir + '/assets/styles/*.css', base_dir + '/assets/styles/*.map' ]
                }]
            }
        },

        // Watch things ///////////////////////////////////////////////////////
        // Watch looks for file changes and runs Grunt tasks when they occur

        watch: {
            
            vendor: {
                files: [ base_dir + '/assets/bower-components/**/*.js' ],
                tasks: [ 'build-vendor-dev' ],
                options: { livereload: true }
            },
            
            // Add as needed.  Be sure to add these here as well as in the concat task
            app: {
                files: [ base_dir + '/assets/scripts/app/**/*.js' ],
                tasks: [ 'build-app-dev' ],
                options: { livereload: true }
            },
            
            css: {
                files: [ base_dir + '/assets/sass/**/{*.sass,*.scss}' ],
                tasks: [ 'build-css-dev' ],
                options: { livereload: true }
            },
            
            
            views: {
                files: [ base_dir + '/assets/views/**/*.html' ],
                tasks: [],
                options: { livereload: true }
            }
            
        },

        // Concurrent /////////////////////////////////////////////////////////
        // Concurrent allows independent Grunt tasks to run in parallel for
        // speed

        concurrent: {
            clean: {
                tasks: [ 'clean:dev', 'clean:build' ],
                options: { logConcurrentOutput: true }
            },
            
            app_ngmin: {
                tasks: [
                    'ngmin:app',
                    'ngmin:filters',
                    'ngmin:services',
                    'ngmin:controllers',
                    'ngmin:directives'
                ],
                options: { logConcurrentOutput: true }
            },
            app_concat: {
                tasks: [
                    'concat:app',
                    'concat:app_filters',
                    'concat:app_services',
                    'concat:app_controllers',
                    'concat:app_directives'
                ],
                options: { logConcurrentOutput: true }
            },
            
            
            css: {
                tasks: [
                    
                    
                    'sass:dev',
                    'sass:build'
                ],
                options: { logConcurrentOutput: true }
            },
            
            
            assets: {
                tasks: [
                    'imagemin',
                    'svgmin'
                ],
                options: { logConcurrentOutput: true }
            },
            
            build: {
                tasks: [
                    'build-vendor',
                    'build-app',
                    'build-css',
                    'build-assets'
                ],
                options: { logConcurrentOutput: true }
            },
            build_dev: {
                tasks: [
                    'build-vendor-dev',
                    'build-app-dev',
                    'build-css-dev',
                ],
                options: { logConcurrentOutput: true }
            },
            dev: {
                tasks: [ 'watch' ],
                options: {
                    logConcurrentOutput: true
                }
            },
        }
    });

    /**************************************************************************
    ** CUSTOM TASKS ***********************************************************
    **************************************************************************/

    
    // Build dependencies /////////////////////////////////////////////////////
    // This task takes the script dependencies set above and the output from 
    // Bower to create the set of vendor files which will be used in the
    // package
    grunt.registerTask( 'build-deps', 'Process bower packages and build vendor.js file.', function () {
        var deps_config = grunt.config( 'deps' ),
            final = [];

        // Pull in all The Stuff using wiredep + any extra in the scripts include and - any excludes
        var wiredep_output = require( 'wiredep' )({
            exclude: deps_config.exclude
        });

        if ( wiredep_output && ( wiredep_output.js || wiredep_output.css ) ) {
            // Now that we have our lists, check for extra includes as well
            if ( deps_config.include && ( deps_config.include.before || deps_config.include.after ) ) {
                if ( deps_config.include.before && deps_config.include.before.length ) {
                    final = deps_config.include.before;
                }

                final = final.concat( wiredep_output.js );

                if ( deps_config.include.after && deps_config.include.after.length ) {
                    final = final.concat( deps_config.include.after );
                }
            } else {
                // Just sent the default bower deps straight on through
                final = wiredep_output.js;
            }

            console.log( 'Script build order: \n\n', final );

            // Put together the main scripts file/css file using concat
            grunt.config.set( 'concat.vendor.src', final );
            grunt.task.run( 'concat:vendor' );
        }
    });
    

    /**************************************************************************
    ** PACKAGE TASKS **********************************************************
    **************************************************************************/ 

    
    grunt.registerTask( 'build-vendor', [
        'build-deps',
        'uglify:vendor',
        'modernizr'
    ]);
    grunt.registerTask( 'build-vendor-dev', [
        'build-deps',
    ]);
    

    
    grunt.registerTask( 'build-app', [
        //'concurrent:app_ngmin', // Uncomment if using ngmin
        //'concurrent:app_concat', // Uncomment if using ngmin
        //'concat:app_all', // Uncomment if using ngmin
        'concat:app_combined',
        'uglify:app',
        'jshint'
    ]);
    grunt.registerTask( 'build-app-dev', [
        'concat:app_combined',
        'jshint'
    ]);
    

    
    grunt.registerTask('build-css', [
        'clean:css',
        'concurrent:css',
        'autoprefixer',
        
    ]);
    grunt.registerTask('build-css-dev', [
        
        'sass:dev',
        'autoprefixer',
        
    ]);
    

    
    grunt.registerTask('build-assets', [
        'concurrent:assets',
        'sprite',
        'grunticon',
        
    ]);
    

    grunt.registerTask('build', [
        'concurrent:clean',
        'concurrent:build'
    ]);
    grunt.registerTask('build-dev', [
        'concurrent:build_dev'
    ]);

    // Default - just watch things
    grunt.registerTask('default', [
        'watch'
    ]);
};

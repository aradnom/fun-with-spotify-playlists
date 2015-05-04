// Rackspace CDN //////////////////////////////////////////////////////
// Like S3 above, just a different cloud.  So many clouds, so little
// time.  Same story with the config file as S3.

// Place this in the gruntfile if you plan on using this
//rackspace_keys: grunt.file.readJSON( 'keys/rackspace.sample.json' )

module.exports = {
  production: {
    user: '<%= rackspace_keys.user %>',
    key: '<%= rackspace_keys.key %>',
    region: '<%= rackspace_keys.region %>',
    upload: [{
      container: 'container',
      src: 'path/**/*',
      dest: 'remote/path'
    }]
  }
};





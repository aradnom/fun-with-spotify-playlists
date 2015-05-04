// S3 /////////////////////////////////////////////////////////////////
// S3 AWS CDN support.  You know, files in the cloud and all that jazz.
// One important note - this will reference a sample key config file -
// this SHOULD NOT BE IN THE PROJECT REPO.

// Place this in the gruntfile if you're using this
//s3_keys: grunt.file.readJSON( 'keys/s3.sample.json' )

module.exports = {
  // Global options - these can be overridden for each task if needed
  options: {
    key: '<%= s3_keys.user %>',
    secret: '<%= s3_keys.key %>',
    bucket: 'your_bucket',
    access: 'public-read'
  },
  dev: {
    upload: [
      {
        src: '../assets/src/src_file',
        dest: '../assets/dest/dest_file'
      }
    ]
  },
  production: {
    upload: [
      {
        src: '../assets/src/src_file',
        dest: '../assets/dest/dest_file'
      }
    ]
  }
};





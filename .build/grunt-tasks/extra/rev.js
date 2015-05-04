// Rev ////////////////////////////////////////////////////////////////
// Cache-busts files by adding random strings to them.  This requires
// these files to be replaced in the correct template and all that
// jazz, so keep that in mind

module.exports = {
  options: {
    encoding: 'utf8',
    algorithm: 'md5',
    length: 6
  },
  files: {
    assets: [
      '../assets/styles/**/*.css',
      '../assets/scripts/build/**/*.js',
      '../assets/scripts/release/**/*.js'
    ]
  }
};





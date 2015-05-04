// Grunticon //////////////////////////////////////////////////////////////////
// Provides backwards-compatibility support for SVGs

module.exports = {
  build: {
    files: [{
      expand: true,
      cwd: '../assets/svg/',
      src: [ '*.svg', ],
      dest: '../assets/svg-dist/'
    }]
  }
};





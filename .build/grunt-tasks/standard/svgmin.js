// SVG minification ///////////////////////////////////////////////////
// Note that the src/dest are the same here because Grunticon will place
// these in the dist folder

module.exports = {
  options: {
    plugins: [
      { removeViewBox: false },
      { removeUselessStrokeAndFill: false },
      { removeEmptyAttrs: false },
      { mergePaths: false },
      { cleanupIDs: false },
      { collapseGroups: false }
    ]
  },
  font: {
    files: [{
      expand: true,
      cwd: '../assets/fonts/icons/src/',
      src: ['*.svg'],
      dest: '../assets/fonts/icons/dist/',
      ext: '.svg'
    }]
  },
  svgs: {
    files: [{
      expand: true,
      cwd: '../assets/images/svgs/src/',
      src: ['*.svg'],
      dest: '../assets/images/svgs/dist/',
      ext: '.svg'
    }]
  }
};


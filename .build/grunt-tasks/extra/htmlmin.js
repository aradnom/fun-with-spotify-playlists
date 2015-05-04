// HTML Min ///////////////////////////////////////////////////////////
// Minifies HTML.  This only does any good on flat sites where you're
// working directly with the HTML files (so CMSs are basically out for
// the time being, but it's useful for Node)

module.exports = {
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
};





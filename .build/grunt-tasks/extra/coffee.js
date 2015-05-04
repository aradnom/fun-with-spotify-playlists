// CoffeeScript ///////////////////////////////////////////////////////////////
// JS preprocessing

module.exports = {
  build: {
    options: {
      sourceMap: true
    },
    files: {
      // Add required files/directories as needed
      '../assets/scripts/app.js' : '../assets/scripts/src/scripts/app.coffee'
    }
  }
};





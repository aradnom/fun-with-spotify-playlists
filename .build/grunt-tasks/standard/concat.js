// Concat /////////////////////////////////////////////////////////////
// Duct tapes files together

module.exports = {
  vendor: {
    src: [ /* Filled dynamically by wiredeps */ ],
    dest: '../assets/scripts/dist/vendor.js',
    nonull: true
  },
  application: {
    src: [
      '../assets/scripts/app/app.js',
      '../assets/scripts/app/filters/*.js',
      '../assets/scripts/app/services/*.js',
      '../assets/scripts/app/controllers/*.js',
      '../assets/scripts/app/directives/*.js'
    ],
    dest: '../assets/scripts/dist/application.js',
    nonull: true
  }
};


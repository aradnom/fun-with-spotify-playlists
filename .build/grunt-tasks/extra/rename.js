// Rename /////////////////////////////////////////////////////////////////////
// Yup.  Renames files pretty much.

module.exports = {
  css_build: {
    files: [{
      src: [ '../assets/styles/tmp/front-end.css' ],
      dest: '../assets/styles/front-end.min.css'
    },{
      src: [ '../assets/styles/tmp/back-end.css' ],
      dest: '../assets/styles/back-end.min.css'
    },{
      src: [ '../assets/styles/tmp/front-end-prefixed.css' ],
      dest: '../assets/styles/front-end-prefixed.min.css'
    },{
      src: [ '../assets/styles/tmp/back-end-prefixed.css' ],
      dest: '../assets/styles/back-end-prefixed.min.css'
    }]
  }
};





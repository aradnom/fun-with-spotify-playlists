// Autoprefixer ///////////////////////////////////////////////////////
// Autoprefixer does something very simple but cool - it detects CSS
// that requires vendor prefixes (i.e. -webkit-border-radius) and adds
// them automatically.  You can specify what browsers it should worry
// about it and it does the rest - and you're guaranteed it will work
// on those browsers without added properties you don't need

var browsers = ['> 1%', 'last 3 versions', 'Firefox ESR', 'ie 9'];

module.exports = {
  application: {
    options: {
      browsers: browsers,
      map: true
    },
    src: '../assets/styles/application.css',
    dest: '../assets/styles/application.css'
  }
};


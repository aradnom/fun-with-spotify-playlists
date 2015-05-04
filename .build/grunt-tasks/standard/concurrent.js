// Concurrent /////////////////////////////////////////////////////////
// Concurrent allows independent Grunt tasks to run in parallel for
// speed

module.exports = {
  options: {
    logConcurrentOutput: true
  },
  target: {
    tasks: ['watch:styles', 'watch:scripts', 'watch:assets', 'watch:reload']
  }
};


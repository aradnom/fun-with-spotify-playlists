// NGmin //////////////////////////////////////////////////////////////////////
// Angular preprocessing - Angular files require some special handling
// to make sure the dependency injections don't break due to mangling.
// Note that this is NOT NEEDED if you use the array version of Angular
// components

module.exports = {
  app: {
    expand: true,
    cwd: base_dir + '/assets/scripts/app',
    src: ['app/**/*.js'],
    dest: base_dir + '/assets/scripts/app/generated'
  },
  filters: {
    expand: true,
    cwd: base_dir + '/assets/scripts/app',
    src: ['filters/**/*.js'],
    dest: base_dir + '/assets/scripts/app/generated'
  },
  services: {
    expand: true,
    cwd: base_dir + '/assets/scripts/app',
    src: ['services/**/*.js'],
    dest: base_dir + '/assets/scripts/app/generated'
  },
  controllers: {
    expand: true,
    cwd: base_dir + '/assets/scripts/app',
    src: ['controllers/**/*.js'],
    dest: base_dir + '/assets/scripts/app/generated'
  },
  directives: {
    expand: true,
    cwd: base_dir + '/assets/scripts/app',
    src: ['directives/**/*.js'],
    dest: base_dir + '/assets/scripts/app/generated'
  }
};





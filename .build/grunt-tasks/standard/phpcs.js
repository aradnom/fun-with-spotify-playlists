// PHP CodeSniffer ////////////////////////////////////////////////////////////
// This checks PHP files for PSR compliance.  If you're not worried about PSR
// compliance this is probably not going to be your bag.
// This requires a few external things to run:
// Install Composer globally if you don’t already have it:

//    curl -sS https://getcomposer.org/installer | php
//    mv composer.phar /usr/local/bin/composer

// Install PHP CodeSniffer:

//    composer global require "squizlabs/php_codesniffer=*"

// Make sure composer is in your PATH:

//    echo 'export PATH=$PATH:~/.composer/vendor/bin/' >> ~/.bash_profile
//    source ~/.bash_profile

module.exports = {
  application: {
    dir: [
      '../functions.php',
      '../library/NobleStudios/**/*.php',
    ]
  },
  options: {
    standard: 'PSR2',
    ignore: '*.tpl.php',

    // If you don't flip this on Grunt will assume PHPCS exited with an error -
    // this is not actually the case.
    ignoreExitCode: true
  }
};


const fs = require('fs');
const { spawn } = require('child_process');

const mountebankWrapper = {
  record(port) {
    console.log('  Creating traffic directory for Mountebank...');
    fs.mkdirSync('./traffic/mb', { recursive: true });

    console.log(`  Starting Mountebank listening on port ${port} with config file "imposters.ejs"...`);
    const mbOut = fs.openSync('./traffic/logs/mb_out.log', 'a');
    const mbErr = fs.openSync('./traffic/logs/mb_err.log', 'a');
    const mbSubprocess = spawn('npx',
      [
        'mb',
        '--port', `${port}`,
        '--datadir', './traffic/mb',
        '--configfile', './setup/imposters.ejs',
        '--nologfile',
        '&'
      ],
      {
        detached: true,
        stdio: [ 'ignore', mbOut, mbErr ]
      });
    mbSubprocess.unref();
    // Mountebank automatically manages its own pid file
  },

  replay(port) {
    this.restart(port);

    // restart Mountebank in replay mode
    console.log('  Restarting Mountebank in replay mode...');
    return spawn('npx', ['mb', 'replay']);
  },

  restart(port) {
    // start Mountebank if it's not running
    if (!fs.existsSync('mb.pid')) {
      console.log('  Starting Mountebank...');
      const mbOut = fs.openSync('./traffic/logs/mb_out.log', 'a');
      const mbErr = fs.openSync('./traffic/logs/mb_err.log', 'a');

      // don't use configfile here or it will overwrite existing traffic (imposters)!
      const mbSubprocess = spawn('npx',
        [
          'mb',
          '--port', `${port}`,
          '--datadir', './traffic/mb',
          '--nologfile',
          '&'
        ],
        {
          detached: true,
          stdio: [ 'ignore', mbOut, mbErr ]
        });
      mbSubprocess.unref();
      // Mountebank automatically manages its own pid file
    }
  },

  stop() {
    if (fs.existsSync('mb.pid')) {
      console.log('  Stopping Mountebank...');
      spawn('npx', ['mb', 'stop']);
    }
  },
};

module.exports = mountebankWrapper;

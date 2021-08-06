const fs = require('fs');
const { spawn } = require('child_process');

const mountebankWrapper = {
  record(port, directory) {
    if (fs.existsSync('mb.pid')) {
      console.log('  Mountebank appears to already be running. Check pid file.');
      return;
    }

    console.log('  Creating traffic directory for Mountebank...');
    fs.mkdirSync(`${directory}/mb`, { recursive: true });
    fs.mkdirSync(`${directory}/logs`, { recursive: true });

    console.log(`  Starting Mountebank listening on port ${port} with config file "imposters.ejs"...`);
    const mbOut = fs.openSync(`${directory}/logs/mb_out.log`, "a");
    const mbErr = fs.openSync(`${directory}/logs/mb_err.log`, "a");
    const mbSubprocess = spawn('npx',
      [
        "mb",
        "--port", `${port}`,
        "--datadir",
        `${directory}/mb`,
        "--configfile",
        `${directory}/imposters.ejs`,
        "--nologfile",
        "&",
      ],
      {
        detached: true,
        stdio: [ 'ignore', mbOut, mbErr ]
      });
    mbSubprocess.unref();
    // Mountebank automatically manages its own pid file
  },

  replay(port, directory) {
    if (!fs.existsSync(`${directory}/mb`)) {
      console.log(`Missing Mountebank traffic data! Should be in: ${directory}/mb`);
    }

    const mbSubprocess = this.restart(port, directory);
    if (mbSubprocess) {
      mbSubprocess.unref();
      return new Promise(resolve => {
        mbSubprocess.on('spawn', () => {
          // restart Mountebank in replay mode
          console.log('  Restarting Mountebank in replay mode...');
          resolve(spawn('npx', ['mb', 'replay']));
        });
      });
    } else {
      return new Promise(resolve => {
        console.log('  Restarting Mountebank in replay mode...');
        resolve(spawn('npx', ['mb', 'replay']));
      });
    }
  },

  restart(port, directory) {
    // start Mountebank if it's not running
    if (!fs.existsSync('mb.pid')) {
      console.log('  Starting Mountebank...');

      fs.mkdirSync(`${directory}/logs`, { recursive: true });
      console.log(`  Starting Mountebank listening on port ${port} with config file "imposters.ejs"...`);
      const mbOut = fs.openSync(`${directory}/logs/mb_out.log`, "a");
      const mbErr = fs.openSync(`${directory}/logs/mb_err.log`, "a");

      // don't use configfile here or it will overwrite existing traffic (imposters)!
      return spawn('npx',
        [
          "mb",
          "--port", `${port}`,
          "--datadir",
          `${directory}/mb`,
          "--nologfile",
          "&",
        ],
        {
          detached: true,
          stdio: [ 'ignore', mbOut, mbErr ]
        });
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

const fs = require('fs');
const { spawn } = require('child_process');

const collectorWrapper = {
  start() {
    if (!fs.existsSync('collector.pid')) {
      const collectorOut = fs.openSync('./traffic/logs/collector_out.log', 'a');
      const collectorErr = fs.openSync('./traffic/logs/collector_err.log', 'a');
      const collectorSubprocess = spawn('node',
        [ './setup/src/collector.js', '&' ],
        {
          detached: true,
          stdio: [ 'ignore', collectorOut, collectorErr ]
        });
      collectorSubprocess.unref();

      fs.writeFileSync('collector.pid', `${collectorSubprocess.pid}`);
    } else {
      console.log('  Collector appears to already be running. Check pid file.');
    }
  },

  stop() {
    // close Collector if it's still running
    if (fs.existsSync('collector.pid')) {
      console.log('  Stopping Collector...');
      const collectorPid = parseInt(fs.readFileSync('collector.pid'), 10);

      try {
        process.kill(collectorPid);
      }
      catch(err) {
        // attempting to kill the process if it no longer exists raises 'ESRCH';
        // we just care that it's no longer running, so ignore ESRCH
        if (err.code !== 'ESRCH') { throw err }
      }

      fs.rmSync('collector.pid');
    }
  },
};

module.exports = collectorWrapper;

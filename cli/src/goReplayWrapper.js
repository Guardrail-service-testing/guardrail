const fs = require('fs');
const { spawn } = require('child_process');

const goReplayWrapper = {
  record(port) {
    console.log('  Creating traffic directory for GoReplay...');
    fs.mkdirSync('./traffic/gor', { recursive: true });

    console.log(`  Starting GoReplay listening on port ${port} and writing to "./traffic/gor/requests_0.gor"...`);
    const gorOut = fs.openSync('./traffic/logs/gor_out.log', 'a');
    const gorErr = fs.openSync('./traffic/logs/gor_err.log', 'a');
    const gorSubprocess = spawn('gor',
      [
        '--input-raw', `:${port}`,
        '--input-raw-buffer-size', '32mb',
        '--input-raw-track-response',
        '--output-http-track-response',
        '--output-file="./traffic/gor/requests.gor"'
      ],
      {
        shell: true,
        stdio: [ 'ignore', gorOut, gorErr ]
      }
    );

    fs.writeFileSync('gor.pid', `${gorSubprocess.pid}`);
  },

  replay(port) {
    console.log(`  Starting GoReplay in replay mode with input file "./traffic/gor/requests_0.gor" replaying to port ${port}...`);
    const gorOut = fs.openSync('./traffic/logs/gor_out.log', 'a');
    const gorErr = fs.openSync('./traffic/logs/gor_err.log', 'a');
    const gorSubprocess = spawn('gor',
      [
        '--input-file=./traffic/gor/requests_0.gor',
        '--input-raw-buffer-size=32mb',
        '--input-raw-track-response',
        '--output-stdout',
        '--output-http-track-response',
        `--output-http=http://localhost:${port}`,
        '--output-file=./traffic/gor/replayed.gor',
        '--middleware=./setup/src/replayMiddleware.js'
      ],
      {
        shell: true,
        stdio: [ 'ignore', gorOut, gorErr ]
      });

    fs.writeFileSync('gor.pid', `${gorSubprocess.pid}`);
  },

  stop() {
    // close GoReplay if it's still running
    if (fs.existsSync('gor.pid')) {
      console.log('  Stopping GoReplay...');
      const gorPid = parseInt(fs.readFileSync('gor.pid'), 10);

      try {
        process.kill(gorPid);
      }
      catch(err) {
        // attempting to kill the process if it no longer exists raises 'ESRCH';
        // we just care that it's no longer running, so ignore ESRCH
        if (err.code !== 'ESRCH') { throw err }
      }

      fs.rmSync('gor.pid');
    }
  },
};

module.exports = goReplayWrapper;

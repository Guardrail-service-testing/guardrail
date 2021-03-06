const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const goReplayWrapper = {
  record(port, directory) {
    console.log("  Creating traffic directory for GoReplay...");
    fs.mkdirSync(path.join(directory, "gor"), { recursive: true });
    fs.mkdirSync(path.join(directory, "logs"), { recursive: true });

    console.log(
      `  Starting GoReplay listening on port ${port} and writing to "${directory}/gor/requests_0.gor"...`
    );
    const gorOut = fs.openSync(
      path.join(directory, "logs", "gor_out.log"),
      "a"
    );
    const gorErr = fs.openSync(
      path.join(directory, "logs", "gor_err.log"),
      "a"
    );
    const outFile = path.join(directory, "gor", "requests.gor");

    const gorSubprocess = spawn(
      "gor",
      [
        "--input-raw",
        `:${port}`,
        "--input-raw-buffer-size=32768000",
        "--copy-buffer-size=32768000",
        "--input-raw-track-response",
        "--output-http-track-response",
        `--output-file="${outFile}"`,
      ],
      {
        shell: true,
        stdio: ["ignore", gorOut, gorErr],
      }
    );

    fs.writeFileSync("gor.pid", `${gorSubprocess.pid}`);
  },

  replay(port, directory) {
    console.log(
      `  Starting GoReplay in replay mode with input file "${directory}/gor/requests_0.gor" replaying to port ${port}...`
    );
    fs.mkdirSync(path.join(directory, "logs"), { recursive: true });
    const gorOut = fs.openSync(
      path.join(directory, "logs", "gor_out.log"),
      "a"
    );
    const gorErr = fs.openSync(
      path.join(directory, "logs", "gor_err.log"),
      "a"
    );
    const inFile = path.join(directory, "gor", "requests*.gor");
    const outFile = path.join(directory, "gor", "replayed.gor");

    const gorSubprocess = spawn(
      "gor",
      [
        `--input-file=${inFile}`,
        "--input-raw-buffer-size=32768000",
        "--copy-buffer-size=32768000",
        "--input-raw-track-response",
        "--output-stdout",
        "--output-http-track-response",
        `--output-http=http://localhost:${port}`,
        `--output-file=${outFile}`,
        `--middleware=${__dirname}/replayMiddleware.js`,
      ],
      {
        shell: true,
        stdio: ["ignore", gorOut, gorErr],
      }
    );

    fs.writeFileSync("gor.pid", `${gorSubprocess.pid}`);
  },

  stop() {
    // close GoReplay if it's still running
    if (fs.existsSync("gor.pid")) {
      console.log("  Stopping GoReplay...");
      const gorPid = parseInt(fs.readFileSync("gor.pid"), 10);

      try {
        process.kill(gorPid);
      } catch (err) {
        // attempting to kill the process if it no longer exists raises 'ESRCH';
        // we just care that it's no longer running, so ignore ESRCH
        if (err.code !== "ESRCH") {
          throw err;
        }
      }

      fs.rmSync("gor.pid");
    }
  },
};

module.exports = goReplayWrapper;

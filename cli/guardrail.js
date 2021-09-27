#!/usr/bin/env node

const { program } = require("commander");
const fs = require("fs");
const path = require("path");
const waitOn = require("wait-on");
const gor = require(path.join(__dirname, "src", "goReplayWrapper"));
const mb = require(path.join(__dirname, "src", "mountebankWrapper"));
const collector = require(path.join(__dirname, "src", "collectorWrapper"));

const COLLECTOR_PORT = process.env.COLLECTOR_PORT || 9001;
const OUTPUT_DIR = path.join(__dirname, ".guardrail");
const options = program.opts();

program.version("0.0.1");

program
  .option(
    "-g, --gor-port <port>",
    "Specify the port forGoReplay to use.",
    "3000"
  )
  .option(
    "-m, --mb-port <port>",
    "Specify the port Mountebank to use.",
    "2525"
  );

program
  .command("setup-proxies")
  .description("Setup proxies for service virtualization.")
  .action(() => {
    // parse dependencies.json
    const { createImposters } = require(path.join(
      __dirname,
      "src",
      "mountebankHelper"
    ));
    try {
      const dependencies = require(path.join(OUTPUT_DIR, "dependencies.json"));
      const { imposters, proxyList } = createImposters(dependencies);

      // output imposters.ejs
      const imposterFile = path.join(OUTPUT_DIR, "imposters.ejs");
      const imposterData = JSON.stringify({ imposters }, null, 2);
      fs.writeFileSync(imposterFile, imposterData);

      // output proxy-list.json
      const proxyListFile = path.join(OUTPUT_DIR, "proxy-list.json");
      fs.writeFileSync(proxyListFile, JSON.stringify({ proxyList }, null, 2));
    } catch (error) {
      console.error(error.message);
    }
    // start mb with the same imposters.ejs
    try {
      mb.record(options.mbPort, OUTPUT_DIR);
    } catch (error) {
      console.error(error.message);
    }
  });

/*
We're assuming that the developer has already:
- downloaded and installed Guardrail (including running `npm install`)
- edited `dependencies.json` to include all the dependencies for which they wish to capture traffic

As such, we need to (in this order):
- parse dependencies.json
    [
      {
        "varName": "DEPENDENCY_1",
        "destinationURL": "https://downstream-service1",
        "proxyPort": 5002
      },
      {
        "varName": "DEPENDENCY_2",
        "destinationURL": "http://localhost:9000",
        "proxyPort": 5003
      }
    ]
    { protocol, port, varName }
    [{
      url: http://localhost:333,
      varName: DEPENDENCY_1
    }]
- start Mountebank
    - setup imposters
		- this will output a list of environment variables that the user will use
- log a message telling developer to restart application
- start GoReplay

*/

program
  .command("record")
  .description("Start recording to capture upstream and downstream traffic.")
  .action(() => {
    console.log("Getting Guardrail ready to record...");

    gor.record(options.gorPort, OUTPUT_DIR);
    mb.record(options.mbPort, OUTPUT_DIR);

    console.log("  Recording in progress!");
  });

// - Start backend once with `docker-compose up` (see server's README.)
// - Replay Mountebank
//   - start Mountebank if it's not already running (make sure to provide `datadir`)
//   - issue `mb replay` command to restart Mountebank in replay mode
// - Start GoReplay, which will immediately begin replaying captured traffic.
program
  .command("replay")
  .description("Start replaying saved traffic to compare results.")
  .action(() => {
    console.log("Getting Guardrail ready to replay...");

    // close GoReplay if it's still running
    gor.stop();
    if (!process.env.DISABLE_DOCKER_COMPOSE) {
      collector.start(OUTPUT_DIR);
    }

    waitOn({ resources: [`http://localhost:${COLLECTOR_PORT}`] })
      .then(() => {
        mb.replay(options.mbPort, OUTPUT_DIR).then(() =>
          gor.replay(options.gorPort, OUTPUT_DIR)
        );
      })
      .catch(console.error);
  });

program
  .command("stop")
  .description(
    "Close any running recording processes, but leave traffic data intact."
  )
  .action(() => {
    console.log("Stopping...");

    gor.stop();
    mb.stop();

    console.log("  Stopped!");
  });

program
  .command("clean")
  .description(
    "Clean up: close any running recording processes and remove log and traffic data directories."
  )
  .action(() => {
    console.log("Cleaning up...");

    gor.stop();
    mb.stop();

    ["gor", "logs", "mb"].forEach((dirName) => {
      const directory = path.join(OUTPUT_DIR, dirName);
      if (fs.existsSync(directory)) {
        console.log(`  Removing ${dirName} files...`);
        fs.rmSync(directory, { force: true, recursive: true });
      }
    });

    console.log("  Cleaning is finished!");
  });

program.parse(process.argv);

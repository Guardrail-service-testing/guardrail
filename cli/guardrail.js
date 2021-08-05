#!/usr/bin/env node

const { program } = require("commander");
const fs = require("fs");
const gor = require("./src/goReplayWrapper");
const mb = require("./src/mountebankWrapper");

const OUTPUT_FILE_DIR_NAME = `${process.cwd()}/.guardrail`;
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
    const { createImposters } = require("./src/mountebankHelper");
    try {
      const dependencies = require(`${OUTPUT_FILE_DIR_NAME}/dependencies.json`);
      const { imposters, proxyList } = createImposters(dependencies);

      // output imposters.ejs
      const imposterFile = `${OUTPUT_FILE_DIR_NAME}/imposters.ejs`;
      const imposterData = JSON.stringify({ imposters }, null, 2);
      fs.writeFileSync(imposterFile, imposterData);

      // output proxy-list.json
      const proxyListFile = `${OUTPUT_FILE_DIR_NAME}/proxy-list.json`;
      fs.writeFileSync(proxyListFile, JSON.stringify({ proxyList }, null, 2));
    } catch (error) {
      console.error(error.message);
    }
    // start mb with the same imposters.ejs
    try {
      const { spawn } = require("child_process");
      const MOUNTEBANK_PORT = 2525;
      console.log("  Creating traffic directory for Mountebank...");
      fs.mkdirSync(`${OUTPUT_FILE_DIR_NAME}/mb`, { recursive: true });
      fs.mkdirSync(`${OUTPUT_FILE_DIR_NAME}/logs`, { recursive: true });
      console.log(
        `  Starting Mountebank listening on port ${MOUNTEBANK_PORT} with config file "imposters.ejs"...`
      );
      const mbOut = fs.openSync(`${OUTPUT_FILE_DIR_NAME}/logs/mb_out.log`, "a");
      const mbErr = fs.openSync(`${OUTPUT_FILE_DIR_NAME}/logs/mb_err.log`, "a");
      const mbSubprocess = spawn(
        "npx",
        [
          "mb",
          "--port",
          `${MOUNTEBANK_PORT}`,
          "--datadir",
          `${OUTPUT_FILE_DIR_NAME}/mb`,
          "--configfile",
          `${OUTPUT_FILE_DIR_NAME}/imposters.ejs`,
          "--nologfile",
          "&",
        ],
        {
          detached: true,
          stdio: ["ignore", mbOut, mbErr],
        }
      );
      mbSubprocess.unref();
      // Mountebank automatically manages its own pid file
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
    fs.mkdirSync("./traffic/logs", { recursive: true });

    mb.record(options.mbPort);
    console.log();
    gor.record(options.gorPort);

    console.log("  Recording in progress!");
  });

program.parse(process.argv);

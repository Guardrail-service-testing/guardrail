#!/usr/bin/env node

const { program } = require("commander");
const fs = require("fs");
const gor = require("./src/goReplayWrapper");
const mb = require("./src/mountebankWrapper");

const OUTPUT_DIR = `${process.cwd()}/.guardrail`;
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
      const dependencies = require(`${OUTPUT_DIR}/dependencies.json`);
      const { imposters, proxyList } = createImposters(dependencies);

      // output imposters.ejs
      const imposterFile = `${OUTPUT_DIR}/imposters.ejs`;
      const imposterData = JSON.stringify({ imposters }, null, 2);
      fs.writeFileSync(imposterFile, imposterData);

      // output proxy-list.json
      const proxyListFile = `${OUTPUT_DIR}/proxy-list.json`;
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

program
  .command("stop")
  .description("Close any running recording processes, but leave traffic data intact.")
  .action(() => {
    console.log("Stopping...");

    gor.stop();
    mb.stop();

    console.log("  Stopped!");
  });

program.command('clean')
  .description("Clean up: close any running recording processes and remove log and traffic data directories.")
  .action(() => {
    console.log("Cleaning up...");

    gor.stop();
    mb.stop();

    ["gor", "logs", "mb"].forEach(dirname => {
      if (fs.existsSync(`${OUTPUT_DIR}/${dirname}`)) {
        console.log(`  Removing ${dirname} files...`);
        fs.rmSync(`${OUTPUT_DIR}/${dirname}`, { force: true, recursive: true });
      }
    });

    console.log("  Cleaning is finished!");
  });

program.parse(process.argv);

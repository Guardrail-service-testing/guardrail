#!/usr/bin/env node

const { program } = require("commander");
const fs = require("fs");
const gor = require("./src/goReplayWrapper");
const mb = require("./src/mountebankWrapper");
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
      const dependencies = require(`${process.cwd()}/.guardrail/dependencies.json`);
      const { imposters, outputList } = createImposters(dependencies);
      console.log({ imposters, outputList });
    } catch (error) {
      console.error(error);
    }
    // output imposters.ejs
    // start mb with the same imposters.ejs
    // output proxy-list.json
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

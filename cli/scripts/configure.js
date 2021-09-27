#!/usr/bin/env node

"use strict";

const fs = require("fs");
const dir = process.cwd() + "/.guardrail";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

#!/usr/bin/env node
"use strict";

require("dotenv").config();
const gor = require("goreplay_middleware");
const fetch = require("node-fetch");
const http = require("http");
const https = require("https");
const COLLECTOR_PORT = process.env.COLLECTOR_PORT || 9001;

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const requestTypeName = {
  1: "request",
  2: "response",
  3: "replayedResponse",
};

const split = (data) => {
  const [request_type, request_id, timestamp, latency] = data.meta;

  let path;
  let method;
  let headers;
  let body;
  let status;

  if (request_type === "1") {
    path = gor.httpPath(data.http);
    method = gor.httpMethod(data.http);
  } else {
    status = gor.httpStatus(data.http);
  }

  headers = gor.httpHeaders(data.http);
  body = gor.httpBody(data.http);

  return {
    status,
    path,
    method,
    headers,
    body,
    meta: {
      request_type: requestTypeName[request_type],
      request_id,
      timestamp,
      latency,
    },
  };
};

const replaySessionId = Date.now();
const messages = {};

gor.init();

gor.on("message", function (http_message) {
  const data = split(http_message);
  const correlationId = data.headers["x-correlation-id"];

  if (messages[correlationId] === undefined) {
    const triplet = {};
    messages[correlationId] = triplet;
  }

  const messageType = data.meta.request_type;
  messages[correlationId][messageType] = data;

  const gotAllThree = Object.keys(messages[correlationId]).length === 3;
  if (gotAllThree) {
    fetch(`http://localhost:${COLLECTOR_PORT}/triplets`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        replaySessionId,
        correlationId,
        triplets: messages[correlationId],
      }),
      agent: function (_parsedURL) {
        return _parsedURL.protocol == "http:" ? httpAgent : httpsAgent;
      },
    })
      .then(() => {
        delete messages[correlationId];
      })
      .catch(console.error);
  }

  return http_message;
});

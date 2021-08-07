require("dotenv").config({ debug: process.env.DEBUG });
require("colors");
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const { connectDb, db } = require("./db/mongo");
const { Request } = require("./db/models/request");
const { Response } = require("./db/models/response");
const { ReplayedResponse } = require("./db/models/replayedResponse");
const Triplet = require("./db/models/triplet");
const { IgnoredHeader } = require("./db/models/ignoredHeader");

const PORT = process.env.PORT || 9001;
const CLIENT_BUILD_PATH = path.join(__dirname, "../client/build");
const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static(CLIENT_BUILD_PATH));

app.get("/", (req, res) => {
  res.sendFile(path.join(CLIENT_BUILD_PATH, "index.html"));
});

app.post("/triplets", async (req, res, next) => {
  const data = req.body;
  const { replaySessionId, correlationId, triplets } = data;
  const { request, response, replayedResponse } = triplets;
  try {
    const req1 = await Request.create({
      replaySessionId,
      correlationId,
      ...request,
    });
    const res1 = await Response.create({
      replaySessionId,
      correlationId,
      ...response,
    });
    const repl1 = await ReplayedResponse.create({
      replaySessionId,
      correlationId,
      ...replayedResponse,
    });

    Triplet.create({
      replaySessionId,
      correlationId,
      request: req1,
      response: res1,
      replayedResponse: repl1,
    }).then((t) => console.log(t));
  } catch (error) {
    next(error);
  }

  res.end();
});

app.get("/responses", async (req, res) => {
  const responses = await Response.find({});
  res.send(responses);
});

const latestReplaySessionId = async () => {
  const distinctSessions = await Triplet.distinct("replaySessionId");
  return distinctSessions.sort()[distinctSessions.length - 1];
};

app.get("/triplets", async (req, res, next) => {
  Triplet.find({})
    .then((triplets) => res.json(triplets))
    .catch(next);
});

app.get("/triplets/latest", async (req, res, next) => {
  const replaySessionId = await latestReplaySessionId();
  Triplet.find({ replaySessionId })
    .then((triplets) => res.json(triplets))
    .catch(next);
});

app.get("/triplets/:replaySessionId", async (req, res) => {
  const replaySessionId = Number(req.params.replaySessionId);
  const triplets = await Triplet.find({ replaySessionId });
  res.json(triplets);
});

app.get("/triplets/latest/:correlationId", async (req, res) => {
  let { correlationId } = req.params;
  const replaySessionId = await latestReplaySessionId();
  const triplet = await Triplet.findOne({ replaySessionId, correlationId });
  res.json(triplet);
});

app.get("/triplets/:replaySessionId/:correlationId", async (req, res) => {
  let { replaySessionId, correlationId } = req.params;
  const triplet = await Triplet.findOne({ replaySessionId, correlationId });
  res.json(triplet);
});

app.get("/replay-sessions", async (req, res, next) => {
  Triplet.distinct("replaySessionId")
    .then((result) => res.json(result))
    .catch((error) => {
      console.error(error);
      next(error);
    });
});

app.get("/replay-sessions/:replaySessionId", async (req, res, next) => {
  Triplet.find({ replaySessionId: req.params.replaySessionId })
    .then((result) => res.json(result))
    .catch((error) => {
      console.error(error);
      next(error);
    });
});

app.get("/deltas", (req, res) => {
  const Diff = require("diff");
  const {
    pruneResponse,
    convertBodyToText,
    isDifferentBody,
    correlationIdOf,
  } = require("./src/utils");
  const statusAndBodyDiff = triplets.filter(
    ({ request, response, replayedResponse }) => {
      if (response.status !== replayedResponse.status) return true;

      if (isDifferentBody(response, replayedResponse)) return true;

      return false;
    }
  );

  const listOfDeltas = statusAndBodyDiff.map(
    ({ response, replayedResponse }) => {
      const correlationId = correlationIdOf(response);
      const recorded = convertBodyToText(pruneResponse(response));
      const replayed = convertBodyToText(pruneResponse(replayedResponse));
      const delta = Diff.diffJson(recorded, replayed);

      delta.forEach((part) => {
        const color = part.added ? "green" : part.removed ? "red" : "grey";
        process.stderr.write(part.value[color]);
      });

      return { correlationId, delta };
    }
  );
  res.json(listOfDeltas);
});

app.get("/diff", async (req, res, next) => {
  const { isDifferentStatusAndBody, diffTwoResponses } = require("./src/utils");

  const replaySessionId = await latestReplaySessionId();
  const triplets = await Triplet.find({ replaySessionId }).lean();
  const ignoredHeaders = (await IgnoredHeader.find({})) || [];
  const tripletsWithDifferentStatusAndBody = triplets.filter(
    isDifferentStatusAndBody
  );
  try {
    const listOfDeltas = tripletsWithDifferentStatusAndBody.map((triplet) =>
      diffTwoResponses(triplet, ignoredHeaders)
    );
    res.json(listOfDeltas);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.get("/report", async (req, res, next) => {
  const { isDifferentBody } = require("./src/utils");

  const replaySessionId = await latestReplaySessionId();
  const triplets = await Triplet.find({ replaySessionId });

  const recordedLatencies = []; // this should be response time (roundtrip from the recording device, not the end user response time) although goreplay calls it latency
  const replayedLatencies = [];
  const recordedLatenciesWithoutError500 = []; // be careful of integer overflow
  const replayedLatenciesWithoutError500 = [];
  let totalRequests = 0;
  let totalResponses = 0;
  let notError500ButDifferentBody = 0;
  let recordedError500 = 0;
  let replayedError500 = 0;

  triplets.forEach((triplet) => {
    const { response, replayedResponse } = triplet;
    totalRequests += 1;
    if (triplet.replayedResponse !== undefined) {
      totalResponses += 1;
    }

    recordedLatencies.push(response.meta.latency);
    replayedLatencies.push(replayedResponse.meta.latency);

    if (response.status === 500) {
      recordedError500 += 1;
    } else {
      recordedLatenciesWithoutError500.push(response.meta.latency);
    }

    if (replayedResponse.status === 500) {
      replayedError500 += 1;
    } else {
      replayedLatenciesWithoutError500.push(replayedResponse.meta.latency);
    }

    if (isDifferentBody(response, replayedResponse)) {
      notError500ButDifferentBody += 1;
    }
  });

  const average = (arr) => arr.reduce((p, c) => p + c, 0) / arr.length;
  const recordedAverageLatencies = average(recordedLatencies);
  const replayedAverageLatencies = average(replayedLatencies);
  const recordedAverageLatenciesWithoutError500 = average(
    recordedLatenciesWithoutError500
  );
  const replayedAverageLatenciesWithoutError500 = average(
    replayedLatenciesWithoutError500
  );
  const report = {
    replaySessionId,
    totalRequests,
    totalResponses,
    recordedError500,
    replayedError500,
    notError500ButDifferentBody,
    recordedAverageLatencies,
    replayedAverageLatencies,
    recordedAverageLatenciesWithoutError500,
    replayedAverageLatenciesWithoutError500,
  };

  console.log(report);
  res.json(report);
});

connectDb().then(async () => {
  app.listen(PORT, (err) => {
    if (err) console.error(err);
    console.log("Server is listening on PORT ", PORT);
  });
});

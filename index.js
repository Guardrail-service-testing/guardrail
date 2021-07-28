require("dotenv").config({ debug: process.env.DEBUG });
require("colors");
const express = require("express");
const morgan = require("morgan");
const db = require("./db/mongo");
const { Request } = require("./db/models/request");
const { Response } = require("./db/models/response");
const { ReplayedResponse } = require("./db/models/replayedResponse");
const Triplet = require("./db/models/triplet");

const PORT = process.env.PORT || 9001;
const app = express();
app.use(morgan("dev"));
app.use(express.json());

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

  const triplets = await Triplet.find({});
  const tripletsWithDifferentStatusAndBody = triplets.filter(
    isDifferentStatusAndBody
  );
  try {
    const listOfDeltas =
      tripletsWithDifferentStatusAndBody.map(diffTwoResponses);
    res.json(listOfDeltas);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.listen(PORT, (err) => {
  if (err) console.error(err);
  console.log("Server is listening on PORT ", PORT);
});

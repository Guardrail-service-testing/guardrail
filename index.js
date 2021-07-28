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

app.get("/triplets", async (req, res, next) => {
  Triplet.find({})
    .then((triplets) => res.send(triplets))
    .catch(next);
});

app.get("/triplets/:requestSesionId", async (req, res) => {
  const replaySessionId = req.params.replaySessionId;
  const triplets = await Triplet.find({ match: replaySessionId });
  res.json(triplets);
});

app.get("/triplets/:xcid", (req, res) => {
  res.status(501).end();
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
  const {
    pruneResponse,
    convertBodyToText,
    isDifferentBody,
    unifiedDiff,
  } = require("./src/utils");

  const triplets = await Triplet.find({});
  const tripletsWithDifferentStatusAndBody = triplets.filter(
    ({ request, response, replayedResponse }) => {
      try {
        if (response.status !== replayedResponse.status) return true;

        if (isDifferentBody(response, replayedResponse)) return true;

        return false;
      } catch (error) {
        console.error(error);
        next(error);
      }
    }
  );

  const listOfDeltas = tripletsWithDifferentStatusAndBody.map(
    ({ response, replayedResponse }) => {
      try {
        const { correlationId } = response;
        const recorded = convertBodyToText(pruneResponse(response));
        const replayed = convertBodyToText(pruneResponse(replayedResponse));

        const diffUnifiedPatch = unifiedDiff(
          `${correlationId} recorded`,
          `${correlationId} replayed`,
          JSON.stringify(recorded),
          JSON.stringify(replayed)
        );

        return { correlationId, diffUnifiedPatch };
      } catch (error) {
        console.error(error);
        next(error);
      }
    }
  );

  res.json(listOfDeltas);
});

app.listen(PORT, (err) => {
  if (err) console.error(err);
  console.log("Server is listening on PORT ", PORT);
});

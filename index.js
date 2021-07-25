require("dotenv").config({ debug: process.env.DEBUG });
require("colors");
const express = require("express");
const morgan = require("morgan");

const app = express();
app.use(morgan("dev"));
app.use(express.json());

const triplets = [];

app.post("/triplets", (req, res) => {
  const data = req.body
  triplets.push(data)
  res.end();
})

app.get("/triplets", (req, res) => {
  res.json(triplets)
})

app.get("/deltas", (req, res) => {
  const Diff = require('diff')
  const { pruneResponse, convertBodyToText, isDifferentBody, correlationIdOf } = require('./src/utils')
  const statusAndBodyDiff = triplets.filter(({ request, response, replayedResponse }) => {
    if (response.status !== replayedResponse.status) return true;

    if (isDifferentBody(response, replayedResponse)) return true;

    return false
  })

  const listOfDeltas = statusAndBodyDiff.map(({ response, replayedResponse }) => {
    const correlationId = correlationIdOf(response)
    const recorded = convertBodyToText(pruneResponse(response))
    const replayed = convertBodyToText(pruneResponse(replayedResponse))
    const delta = Diff.diffJson(recorded, replayed)

    delta.forEach((part) => {
      const color = part.added ? 'green' :
        part.removed ? 'red' : 'grey';
      process.stderr.write(part.value[color]);
    })

    return { correlationId, delta }
  })
  res.json(listOfDeltas)
})

app.listen(process.env.PORT, (err) => {
  if (err) console.error(err);
  console.log("Server is listening on PORT ", process.env.PORT);
});

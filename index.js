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

app.get("/process", (req, res) => {
  const Diff = require('diff')
  const statusAndBodyDiff = triplets.filter(({ request, response, replayedResponse }) => {
    if (response.status !== replayedResponse.status) return true;

    if (Buffer.compare(
      Buffer.from(response.body),
      Buffer.from(replayedResponse.body)
    ) !== 0) {
      return true
    }
    return false
  })

  const result = statusAndBodyDiff.map(({ response, replayedResponse }) => {

    responseStatus = response.status
    responseHeaders = response.headers
    responseBody = Buffer.from(response.body.data).toString();

    replayedResponseStatus = replayedResponse.status
    replayedResponseHeaders = replayedResponse.headers
    replayedResponseBody = Buffer.from(replayedResponse.body.data).toString();

    const pickedResponse = { status: responseStatus, headers: responseHeaders, body: responseBody }
    const pickedReplayedResponse = { status: replayedResponseStatus, headers: replayedResponseHeaders, body: replayedResponseBody }

    const delta = Diff.diffJson(pickedResponse, pickedReplayedResponse)
    delta.forEach((part) => {
      const color = part.added ? 'green' :
        part.removed ? 'red' : 'grey';
      process.stderr.write(part.value[color]);
    })
    return delta
  })
  res.json(result)
})

app.listen(process.env.PORT, (err) => {
  if (err) console.error(err);
  console.log("Server is listening on PORT ", process.env.PORT);
});

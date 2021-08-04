const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ResponseSchema = new Schema({
  replaySessionId: Number,
  correlationId: String,
  status: Number,
  headers: [{ header: String }],
  body: Buffer,
  meta: {
    request_type: String,
    request_id: String,
    timestamp: Number,
    latency: Number,
  },
});

const Response = mongoose.model("Response", ResponseSchema);
module.exports = { Response, ResponseSchema };

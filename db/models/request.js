const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RequestSchema = new Schema({
  replaySessionId: Number,
  correlationId: String,
  path: String,
  method: String,
  headers: [{ header: String }],
  body: Buffer,
  meta: {
    request_type: String,
    request_id: String,
    timestamp: Number,
    latency: Number,
  },
});

const Request = mongoose.model("Request", RequestSchema);
module.exports = { Request, RequestSchema };

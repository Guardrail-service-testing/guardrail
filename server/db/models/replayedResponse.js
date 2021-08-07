const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReplayedResponseSchema = new Schema({
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

const ReplayedResponse = mongoose.model(
  "ReplayedResponse",
  ReplayedResponseSchema
);
module.exports = { ReplayedResponse, ReplayedResponseSchema };

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const Request = require('./request')
// const Response = require('./response')
// const ReplayedResponse = require('./replayedResponse');
const { RequestSchema } = require("./request");
const { ResponseSchema } = require("./response");
const { ReplayedResponseSchema } = require("./replayedResponse");

const TripletSchema = new Schema({
  replaySessionId: Number,
  correlationId: String,
  request: RequestSchema,
  response: ResponseSchema,
  replayedResponse: [ReplayedResponseSchema],
});

const Triplet = mongoose.model("Triplet", TripletSchema);
module.exports = Triplet;

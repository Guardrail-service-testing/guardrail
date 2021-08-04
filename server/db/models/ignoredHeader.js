const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const IgnoredHeaderSchema = new Schema({
  header: String,
});

const IgnoredHeader = mongoose.model("IgnoredHeader", IgnoredHeaderSchema);
module.exports = { IgnoredHeader, IgnoredHeaderSchema };

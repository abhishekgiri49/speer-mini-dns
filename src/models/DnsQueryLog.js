const mongoose = require("mongoose");

const DnsQueryLogSchema = new mongoose.Schema({
  hostname: { type: String, required: true },
  resolvedAt: { type: Date, default: Date.now },
  recordTypes: [String],
});

module.exports = mongoose.model(
  "DnsQueryLog",
  DnsQueryLogSchema,
  "dns_query_logs"
);

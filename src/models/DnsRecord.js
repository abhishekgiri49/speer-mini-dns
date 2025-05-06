const mongoose = require("mongoose");
const DnsRecordSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["A", "CNAME", "MX", "TXT", "AAAA"],
    required: true,
  },
  hostname: { type: String, required: true },
  value: { type: String, required: true },
  ttl: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

DnsRecordSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { ttl: { $exists: true } } }
);

module.exports = mongoose.model("DnsRecord", DnsRecordSchema, "dns_records");

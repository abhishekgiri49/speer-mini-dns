const DnsRecord = require("../models/DnsRecord");
const redis = require("../utils/redis");
const { queueLog } = require("../jobs/queryLogger");

exports.addRecord = async ({ type, hostname, value, ttl }) => {
  try {
    const existing = await DnsRecord.find({ hostname });

    if (type === "CNAME") {
      if (existing.length > 0) {
        return {
          status: 409,
          data: { error: "Hostname already has other records" },
        };
      } else if (existing.some((r) => r.type === "CNAME")) {
        return {
          status: 409,
          data: { error: "CNAME already exists for this hostname" },
        };
      }
    } else {
      const existing = await DnsRecord.findOne({
        type: type,
        hostname: hostname,
        value: value,
      });

      if (existing) {
        return {
          status: 409,
          data: {
            error: `${type} record already exist. Please try a unique value`,
          },
        };
      }
    }

    const newRecord = new DnsRecord({ type, hostname, value, ttl });
    await newRecord.save();
    await redis.del(hostname);
    queueLog(hostname, newRecord).catch(console.error);
    return { status: 201, data: newRecord };
  } catch (err) {
    if (err.code === 11000) {
      return { status: 409, data: { error: "Duplicate record" } };
    }
    return { status: 500, data: { error: err.message } };
  }
};

exports.resolveHostname = async (hostname) => {
  try {
    const visited = new Set();
    let current = hostname;
    const cnameChain = [];

    const cachedData = await redis.get(hostname);
    if (cachedData) {
      return { status: 200, data: { ...JSON.parse(cachedData), cached: true } };
    }

    while (true) {
      if (visited.has(current))
        return {
          status: 400,
          data: { error: "CNAME circular reference detected" },
        };
      visited.add(current);

      const records = await DnsRecord.find({ hostname: current });
      if (!records || records.length === 0)
        return { status: 404, data: { error: "No records found" } };

      const cname = records.find((r) => r.type === "CNAME");
      if (cname) {
        cnameChain.push(cname.value);
        current = cname.value;
        continue;
      }

      const result = {
        hostname,
        records: records.map((r) => ({ type: r.type, value: r.value })),
        recordType: cnameChain.length > 0 ? "CNAME" : "A/MX/TXT/AAAA",
        pointsTo:
          cnameChain.length > 0 ? cnameChain[cnameChain.length - 1] : undefined,
      };

      await redis.setEx(hostname, 300, JSON.stringify(result));

      queueLog(
        hostname,
        records.map((r) => r.type)
      ).catch(console.error);
      return { status: 200, data: result };
    }
  } catch (err) {
    return { status: 500, data: { error: err.message } };
  }
};

exports.listRecords = async (hostname) => {
  try {
    const records = await DnsRecord.find({ hostname });
    if (!records.length)
      return { status: 404, data: { error: "No records found" } };

    queueLog(
      hostname,
      records.map((r) => r.type)
    ).catch(console.error);

    return {
      status: 200,
      data: {
        hostname,
        records: records.map((r) => ({ type: r.type, value: r.value })),
      },
    };
  } catch (err) {
    return { status: 500, data: { error: err.message } };
  }
};

exports.deleteRecord = async ({ hostname, type, value }) => {
  try {
    const result = await DnsRecord.findOneAndDelete({ hostname, type, value });
    if (!result) return { status: 404, data: { error: "Record not found" } };
    await redis.del(hostname);
    queueLog(hostname, result).catch(console.error);
    return { status: 200, data: { message: "Record deleted successfully" } };
  } catch (err) {
    return { status: 500, data: { error: err.message } };
  }
};

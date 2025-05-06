const { Queue } = require("bullmq");
const redis = require("../utils/redis");

const logQueue = new Queue("background-queue", { redis });

exports.queueLog = async (hostname, recordTypes) => {
  recordTypes =
    typeof recordTypes === "object" ? JSON.stringify(recordTypes) : recordTypes;
  // await logQueue
  //   .add("log-dns-query", { hostname, recordTypes })
  //   .then((job) => console.log(`Job ${job.id} added to queue`))
  //   .catch((err) => console.error("Failed to queue DNS log:", err));
};

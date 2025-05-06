require("dotenv").config();
const { Worker } = require("bullmq");
const Redis = require("ioredis");
const DnsQueryLog = require("../models/DnsQueryLog");
const dbConnection = require("../utils/db");

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
const worker = new Worker(
  "background-queue",
  async (job) => {
    const { hostname, recordTypes } = job.data;
    await dbConnection(process.env.MONGO_URI).then((response) => {
      DnsQueryLog.create({ hostname, recordTypes });
    });
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

// utils/bullBoard.js
const express = require("express");
const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { Queue } = require("bullmq");

function setupBullBoard({
  basePath = "/admin/queues",
  port = process.env.QUEUE_PORT || 3001,
} = {}) {
  const app = express();
  const queues = new Queue("background-queue", {
    connection: { host: process.env.REDIS_URL, port: process.env.REDIS_PORT },
  });
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(basePath);

  const queueAdapters = [queues].map((q) => new BullMQAdapter(q));

  createBullBoard({
    queues: queueAdapters,
    serverAdapter,
  });

  app.use(basePath, serverAdapter.getRouter());

  app.listen(port, () => {
    console.log("-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+");
    console.log(`📊 Bull Board running at http://localhost:${port}${basePath}`);
    console.log("-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+");
  });
}

module.exports = { setupBullBoard };

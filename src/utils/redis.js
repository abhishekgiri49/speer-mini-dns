const { createClient } = require("redis");

const redisClient = createClient({
  url: `${process.env.WORKER_REDIS_URL}`,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;

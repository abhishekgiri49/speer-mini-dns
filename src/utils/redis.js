const { createClient } = require("redis");

const redisClient = createClient({
  url: `${process.env.REDIS_URL}:${process.env.REDIS_PORT}`,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;

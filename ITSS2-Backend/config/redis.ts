import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redis.on("error", (error) => {
  console.warn("Redis connection error:", error.message);
});

export default redis;

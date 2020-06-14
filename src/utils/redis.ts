import Redis from "ioredis";

export const redis = new Redis();

redis.on("error", (error: string) => {
  console.error(error);
});

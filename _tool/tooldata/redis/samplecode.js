import Redis from "ioredis";

const redis = new Redis({
  host: "redis",     // docker service name
  port: 6379
});

await redis.set("hello", "world");
console.log(await redis.get("hello"));

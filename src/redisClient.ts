import { createClient } from "redis";

const redisClient = createClient({
  socket: {
    host: "localhost", 
    port: 6379,       
  },
});

redisClient.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Redis Client Error", err);
});

(async () => {
  await redisClient.connect();
  // eslint-disable-next-line no-console
  console.log("Connected to Redis!");
})();

export default redisClient;

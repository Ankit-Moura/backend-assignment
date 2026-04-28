const  { Redis } =  require("ioredis");


const connection = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    maxRetriesPerRequest: null,
});

connection.on("connect", () => {
    console.log("✅ Redis connected");
});

connection.on("error", (err) => {
    console.error("❌ Redis error:", err);
});


module.exports = connection;
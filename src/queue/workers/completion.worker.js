const { Worker } = require("bullmq");
const connection = require("../connection");
const fs = require("fs");
const path = require("path");


// 🔹 Setup log directory + file
const logDir = path.join(__dirname, "../logs");
const logFile = path.join(logDir, "completed_tasks.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, "");
}

const worker = new Worker(
  "completion-queue",
  async (job) => {
    const data = job.data;

    console.log("Processing completion event:", data);

    // ✅ 1. Log to file
    fs.appendFileSync(
      logFile,
      JSON.stringify({
        ...data,
        loggedAt: new Date().toISOString()
      }) + "\n"
    );
  },
  {
    connection,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    }
  }
);

// 🔹 Events
worker.on("completed", (job) => {
  console.log(`✅ Completion job ${job.id} done`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed after retries`, err.message);
});
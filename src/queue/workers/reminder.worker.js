const { Worker } = require("bullmq");
const connection = require("../connection");

const reminderWorker = new Worker(
  "reminder-queue",
  async (job) => {
    console.log("Processing job:", job.name);
    console.log("Data:", job.data);
  },
  {
    connection,
  }
);

reminderWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

reminderWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
const reminderQueue  = require("../queue/queues/reminder.queue");

const addDelayedJob = async () => {
  await reminderQueue.add(
    "delayed-job",
    { msg: "This runs after 5 seconds" },
    {
      delay: 5000, // 5 seconds
    }
  );

  console.log("Delayed job added");
};

const getJobs = async () => {
  const waiting = await reminderQueue.getJobs(["waiting"]);
  const active = await reminderQueue.getJobs(["active"]);
  const completed = await reminderQueue.getJobs(["completed"]);
  const failed = await reminderQueue.getJobs(["failed"]);
  const delayed = await reminderQueue.getJobs(["delayed"]);

  console.log("Waiting:", waiting.length);
  console.log("Active:", active.length);
  console.log("Delayed:", delayed.length);
  console.log("Completed:", completed.length);
  console.log("Failed:", failed.length);

 for (let job of delayed){
  console.log("Job ID:", job.id, job.data);
}
};

getJobs()

// (async () => {
//   await addDelayedJob();

//   console.log("Immediately after adding:");
//   await getJobs();

//   // wait 2 seconds
//   setTimeout(async () => {
//     console.log("\nAfter 2 seconds:");
//     await getJobs();
//   }, 2000);

//   // wait 6 seconds
//   setTimeout(async () => {
//     console.log("\nAfter 6 seconds:");
//     await getJobs();
//   }, 6000);
// })();
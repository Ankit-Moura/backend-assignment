const { Queue } = require("bullmq");
const connection = require("../connection");

const completionQueue = new Queue("completion-queue", {
  connection,
});

module.exports = completionQueue;
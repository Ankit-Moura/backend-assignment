const { Queue } = require("bullmq");
const connection = require("../connection");

const reminderQueue = new Queue("reminder-queue", {
    connection,
});

module.exports = reminderQueue
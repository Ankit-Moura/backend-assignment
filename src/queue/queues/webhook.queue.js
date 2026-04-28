
const { Queue } = require("bullmq");
const connection = require("../connection");

export const webhookQueue = new Queue("webhook-queue", {
    connection,
});
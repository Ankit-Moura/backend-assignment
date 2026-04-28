const calculateDelay = require("./calculateDelay")
const reminderQueue = require("../queue/queues/reminder.queue")

const schedule_task = async (task, userId) =>{
    if (task.due_date && task.status!=="completed") {
      const delay = calculateDelay(task.due_date);
      console.log("Delay: "+ delay)

      const job = await reminderQueue.add(
        "task-reminder",
        {
          taskId: task.id,
          message: task.title,
          dueDate: task.due_date,
          userId: userId
        },
        {
          delay,
          attempts: 3,
          removeOnComplete: true
        }
      );
      return job.id
    }
    return -1
}

module.exports = schedule_task;
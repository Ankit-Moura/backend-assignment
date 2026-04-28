const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const taskRepo = require("../repositories/taskRepository")
const validate = require("../middleware/validate")
const {createTaskSchema, updateTaskSchema} = require("../validators/taskValidator")
const reminderQueue = require("../queue/queues/reminder.queue")
const calculateDelay = require("../utils/calculateDelay")
const schedule_task = require("../utils/scheduleTask")
const router = express.Router()

const completionQueue = require("../queue/queues/completion.queue")

router.post("/", authMiddleware, validate(createTaskSchema), async (req, res) => {
  try {
    const userId = req.user.userId

    const task = await taskRepo.createTask({
      user_id: userId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      due_date: req.body.due_date,
      
    })

    const job_id = await schedule_task(task, userId)
    let updated_task = null
    if (job_id&&job_id!==-1){
      updated_task = await taskRepo.updateTask(task.id, userId,{
      reminder_job_id: job_id
    });
    return res.json(updated_task)
    }

    return res.json(task)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId

    const tasks = await taskRepo.getTasksByUser(userId)

    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get("/:taskId", authMiddleware, async (req, res) => {
  try {
    const task = await taskRepo.getTaskById(
      req.params.taskId,
      req.user.userId
    )

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json(task)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put("/:taskId", authMiddleware, validate(updateTaskSchema), async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.userId;

    
    const existingTask = await taskRepo.getTaskById(taskId, userId);

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const oldJobId = existingTask.reminder_job_id;
    console.log("updating old job reminder: "+ oldJobId+ " "+ typeof(oldJobId))

    const statusChangedToCompleted =
      req.body.status && req.body.status === "completed" && existingTask.status !== "completed";

    const dueDateChanged =
      req.body.due_date && req.body.due_date !== existingTask.due_date;

    // Cancel old job if needed
    if (oldJobId && (statusChangedToCompleted || dueDateChanged)) {
      const oldJob = await reminderQueue.getJob(oldJobId);
      console.log("cancelling old job")
      if (oldJob) {
        await oldJob.remove();
        await taskRepo.updateTask(taskId, userId, {
        reminder_job_id: null
      })
      }
    }

    

    //  Update task in DB
    const updatedTask = await taskRepo.updateTask(taskId, userId, req.body);

    //  Decide if we need to reschedule
    const shouldSchedule =
      updatedTask.due_date && updatedTask.status !== "completed";

    if (statusChangedToCompleted){
        await completionQueue.add("task-completed", {
          event: "TASK_COMPLETED",
          taskId: updatedTask.id,
          title: updatedTask.title,
          userId: updatedTask.user_id,
          completedAt: new Date().toISOString()
        });
    }

    if (shouldSchedule && (dueDateChanged || !oldJobId)) {
      const delay = calculateDelay(updatedTask.due_date);

      const job = await reminderQueue.add(
        "task-reminder",
        {
          taskId: updatedTask.id,
          message: updatedTask.title||existingTask.title,
          userId: userId
        },
        {
          delay,
          removeOnComplete: true,
          attempts: 3
        }
      );

      // Store new job ID
      await taskRepo.updateTask(updatedTask.id, userId, {
        reminder_job_id: job.id
      });
      console.log("stored new job id: "+ job.id)
    }

    res.json(updatedTask);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:taskId", authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.userId;
    const existingTask = await taskRepo.getTaskById(taskId, userId);

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const oldJobId = existingTask.reminder_job_id;
    if(oldJobId){
      console.log("deleting old job reminder: "+ oldJobId+ " "+ typeof(oldJobId))
       const oldJob = await reminderQueue.getJob(oldJobId);
      console.log("cancelling old job")
      if (oldJob) {
        await oldJob.remove();
      }
    }

    await taskRepo.deleteTask(
      req.params.taskId,
      req.user.userId
    )

    res.json({ message: "Task deleted successfully" })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
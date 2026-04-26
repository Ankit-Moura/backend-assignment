const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const taskRepo = require("../repositories/taskRepository")
const validate = require("../middleware/validate")
const {createTaskSchema, updateTaskSchema} = require("../validators/taskValidator")
const router = express.Router()


router.post("/", authMiddleware, validate(createTaskSchema), async (req, res) => {
  try {
    const userId = req.user.userId

    const task = await taskRepo.createTask({
      user_id: userId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      due_date: req.body.due_date
    })

    res.json(task)
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

router.put("/:taskId", authMiddleware,   validate(updateTaskSchema), async (req, res) => {
  try {
    const updatedTask = await taskRepo.updateTask(
      req.params.taskId,
      req.user.userId,
      req.body
    )

    res.json(updatedTask)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete("/:taskId", authMiddleware, async (req, res) => {
  try {
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
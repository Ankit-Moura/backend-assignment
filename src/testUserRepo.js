require("dotenv").config()

const userRepo = require("./repositories/userRepository")
const taskRepo = require("./repositories/taskRepository")

const { v4: uuidv4 } = require("uuid")
const bcrypt = require("bcrypt")

async function testDeleteTask() {
  try {
    console.log("---- DELETE TASK TEST START ----")

    // 1. Ensure DB ready
    await userRepo.checkDbHealth()

    // 2. Create user
    const user = {
      id: uuidv4(),
      username: "deleteTester",
      email: `delete${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
    }

    const createdUser = await userRepo.createUser(user)

    // 3. Create task
    const task = {
      id: uuidv4(),
      user_id: createdUser.id,
      title: "Task to delete",
      description: "Testing delete",
    }

    const createdTask = await taskRepo.createTask(task)
    console.log("Task created:", createdTask.id)

    // 4. Delete task
    const result = await taskRepo.deleteTask(
      createdTask.id,
      createdUser.id
    )

    console.log("Delete result:", result)

    // 5. Try deleting again (should fail)
    try {
      await taskRepo.deleteTask(createdTask.id, createdUser.id)
    } catch (err) {
      console.log("Expected failure:", err.message)
    }

    console.log("---- DELETE TASK TEST SUCCESS ----")

  } catch (err) {
    console.error("TEST FAILED:", err.message)
  }
}

testDeleteTask()
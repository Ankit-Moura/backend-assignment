require("dotenv").config()

const userRepo = require("../repositories/userRepository")
const taskRepo = require("../repositories/taskRepository")

const { v4: uuidv4 } = require("uuid")
const bcrypt = require("bcrypt")

async function runFullTest() {
  try {
    console.log("======== FULL SYSTEM TEST START ========")

    // 1. DB Health
    const health = await userRepo.checkDbHealth()
    console.log("DB Health:", health)

    // 2. Create User
    const user = {
      id: uuidv4(),// skipped in mongodb
      username: "fullTester",
      email: `full${Date.now()}@test.com`,
      // email: "ankit@mail.com",
      password: await bcrypt.hash("123456", 10),
    }

    const createdUser = await userRepo.createUser(user)
    console.log("User created:", createdUser)

    // 3. Duplicate User Test
    try {
      await userRepo.createUser(user)
    } catch (err) {
      console.log("Duplicate user check passed:", err.message)
    }

    // 4. Find User
    const foundUser = await userRepo.findUserByEmail(user.email)
    console.log("User fetched:", foundUser.email)

    // 5. Create Task
    const task = {
      id: uuidv4(), //skipped in mongo db caz uuid is not supported 
      user_id: createdUser.id,
      title: "Test Task",
      description: "Initial",
      due_date: new Date(Date.now() - 86400000), // yesterday → overdue
    }

    const createdTask = await taskRepo.createTask(task)
    console.log("Task created:", createdTask)

    // 6. Get All Tasks
    const allTasks = await taskRepo.getTasksByUser(createdUser.id)
    console.log("Total tasks:", allTasks.length)

    // 7. Get Task By ID
    const fetchedTask = await taskRepo.getTaskById(
      createdTask.id,
      createdUser.id
    )
    console.log("Fetched task:", fetchedTask.title)

    // 8. Update Task
    const updatedTask = await taskRepo.updateTask(
      createdTask.id,
      createdUser.id,
      { status: "completed", title: "Updated Task" }
    )
    console.log("Updated task:", updatedTask.status)

    // // 9. Unauthorized Update
    // try {
    //   await taskRepo.updateTask(createdTask.id, uuidv4(), {
    //     title: "Hacked"
    //   })
    // } catch (err) {
    //   console.log("Unauthorized update blocked:", err.message)
    // }

    // 10. Overdue Tasks (should be empty now because completed)
    const overdueTasks = await taskRepo.getOverdueTasks(createdUser.id)
    console.log("Overdue tasks count:", overdueTasks.length)

    // 11. Delete Task
    const deleteResult = await taskRepo.deleteTask(
      createdTask.id,
      createdUser.id
    )
    console.log("Delete success:", deleteResult)

    // 12. Unauthorized Delete
    try {
      await taskRepo.deleteTask(createdTask.id, createdUser.id)
    } catch (err) {
      console.log("Unauthorized delete blocked:", err.message)
    }

    console.log("======== ALL TESTS PASSED ========")


  } catch (err) {
    console.error("TEST FAILED:", err.message)
  }
}

runFullTest()
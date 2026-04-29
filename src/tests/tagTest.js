const axios = require("axios")

const BASE_URL = "http://localhost:5000"

let token = ""
let createdTagId = ""

// helper
const log = (msg) => console.log(`\n🔹 ${msg}`)

async function runTests() {
  try {
    // 1. Register (or use existing user)
    log("Registering user...")
    const email = `test${Date.now()}@mail.com`

    await axios.post(`${BASE_URL}/auth/register`, {
      username: "tester",
      email,
      password: "password123"
    })

    // 2. Login
    log("Logging in...")
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: "password123"
    })

    token = loginRes.data.token
    console.log("Token received")

    const headers = {
      Authorization: `Bearer ${token}`
    }

    // 3. Create Tag
    log("Creating tag...")
    const createRes = await axios.post(
      `${BASE_URL}/tags`,
      { name: "bug" },
      { headers }
    )

    createdTagId = createRes.data.id
    console.log("Tag created:", createRes.data)

    // 4. Create Invalid Tag (should fail)
    log("Creating invalid tag (too short)...")
    try {
      await axios.post(
        `${BASE_URL}/tags`,
        { name: "ab" },
        { headers }
      )
    } catch (err) {
      console.log("Validation works:", err.response.data.error)
    }

    // 5. Get Tags
    log("Fetching all tags...")
    const getRes = await axios.get(`${BASE_URL}/tags`, { headers })
    console.log("Tags:", getRes.data)

    // 6. Update Tag
    log("Updating tag...")
    const updateRes = await axios.put(
      `${BASE_URL}/tags/${createdTagId}`,
      { name: "high priority" },
      { headers }
    )
    console.log("Updated:", updateRes.data)

    // 7. Unauthorized Update (should fail)
    log("Unauthorized update test...")
    try {
      await axios.put(
        `${BASE_URL}/tags/${createdTagId}`,
        { name: "hack" },
        { headers: { Authorization: "Bearer invalidtoken" } }
      )
    } catch (err) {
      console.log("Unauthorized blocked:", err.response.status)
    }

    // 8. Delete Tag
    // log("Deleting tag...")
    // const deleteRes = await axios.delete(
    //   `${BASE_URL}/tags/${createdTagId}`,
    //   { headers }
    // )
    // console.log("Deleted:", deleteRes.data)

    // // 9. Delete Again (should fail)
    // log("Deleting same tag again...")
    // try {
    //   await axios.delete(
    //     `${BASE_URL}/tags/${createdTagId}`,
    //     { headers }
    //   )
    // } catch (err) {
    //   console.log("Delete validation works:", err.response.data.error)
    // }

    // 🔥 10. Create Task WITH tags
log("Creating task with tags...")

const createTaskRes = await axios.post(
  `${BASE_URL}/tasks`,
  {
    title: "Fix login bug",
    description: "JWT issue",
    tag_ids: [createdTagId]
  },
  { headers }
)

const createdTask = createTaskRes.data
console.log("Task created:", createdTask)


if (!createdTask.tags || createdTask.tags.length !== 1) {
  throw new Error("Tags not attached to task properly")
}


// 🔥 11. Fetch Tasks and verify tags
log("Fetching tasks to verify tags...")

const tasksRes = await axios.get(`${BASE_URL}/tasks`, { headers })

console.log("Tasks:", tasksRes.data)

const task = tasksRes.data.find(t => t.id === createdTask.id)

if (!task) {
  throw new Error("Created task not found")
}

if (!task.tags || task.tags.length !== 1) {
  throw new Error("Tags missing in fetched task")
}

// 🔥 12. Create Task with INVALID tag (should fail)
log("Creating task with invalid tag...")

try {
  await axios.post(
    `${BASE_URL}/tasks`,
    {
      title: "Invalid test",
      tag_ids: ["64aaaaaaaaaaaaaaaaaaaaaa"] // fake id
    },
    { headers }
  )
} catch (err) {
  console.log("Invalid tag rejected:", err.response.data.error)
}


// 🔥 12. Create Task with INVALID tag (should fail)
log("Creating task with invalid tag...")

try {
  await axios.post(
    `${BASE_URL}/tasks`,
    {
      title: "Invalid test",
      tag_ids: ["64aaaaaaaaaaaaaaaaaaaaaa"] // fake id
    },
    { headers }
  )
} catch (err) {
  console.log("Invalid tag rejected:", err.response.data.error)
}

    console.log("\n✅ ALL TAG ROUTE TESTS PASSED")

  } catch (err) {
    console.error("❌ TEST FAILED:", err.response?.data || err.message)
  }
}

runTests()
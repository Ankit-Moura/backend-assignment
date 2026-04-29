const axios = require("axios")

const BASE_URL = "http://localhost:5000"

let token
let headers

let tag1
let tag2
let taskId

function log(msg) {
  console.log(`\n🔹 ${msg}`)
}

async function runTests() {
  try {
    // -------------------------
    // 1. Register + Login
    // -------------------------
    log("Registering user...")

    let email = `filter${Date.now()}@test.com`

    await axios.post(`${BASE_URL}/auth/register`, {
      username: "filterTester",
      email: email,
      password: "123456"
    })

    log("Logging in...")

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: email, // adjust if needed
      password: "123456"
    })

    token = loginRes.data.token
    headers = { Authorization: `Bearer ${token}` }

    log("Token received")

    // -------------------------
    // 2. Create Tags
    // -------------------------
    log("Creating tags...")

    const t1 = await axios.post(
      `${BASE_URL}/tags`,
      { name: "bug" },
      { headers }
    )

    const t2 = await axios.post(
      `${BASE_URL}/tags`,
      { name: "urgent" },
      { headers }
    )

    tag1 = t1.data.id
    tag2 = t2.data.id

    console.log("Tags:", tag1, tag2)

    // -------------------------
    // 3. Create Task with tags
    // -------------------------
    log("Creating task with both tags...")

    const taskRes = await axios.post(
      `${BASE_URL}/tasks`,
      {
        title: "Fix API",
        tag_ids: [tag1, tag2]
      },
      { headers }
    )

    taskId = taskRes.data.id

    console.log("Task created:", taskRes.data)

    // -------------------------
    // 4. GET tasks WITHOUT filter
    // -------------------------
    log("Fetching all tasks...")

    const allTasks = await axios.get(`${BASE_URL}/tasks`, { headers })

    if (!allTasks.data.length) {
      throw new Error("No tasks returned")
    }

    console.log("All tasks OK")

    // -------------------------
    // 5. Filter by SINGLE tag
    // -------------------------
    log("Filtering by single tag...")

    const singleTagRes = await axios.get(
      `${BASE_URL}/tasks?tags=${tag1}`,
      { headers }
    )

    if (!singleTagRes.data.length) {
      throw new Error("Single tag filter failed")
    }

    console.log("Single tag filter OK")

    // -------------------------
    // 6. Filter by MULTIPLE tags (ANY)
    // -------------------------
    log("Filtering by multiple tags (ANY)...")

    const multiAny = await axios.get(
      `${BASE_URL}/tasks?tags=${tag1},${tag2}`,
      { headers }
    )

    if (!multiAny.data.length) {
      throw new Error("Multi-tag ANY filter failed")
    }

    console.log("Multi-tag ANY filter OK")

    // -------------------------
    // 7. Filter by MULTIPLE tags (ALL)
    // -------------------------
    log("Filtering by multiple tags (ALL)...")

    const multiAll = await axios.get(
      `${BASE_URL}/tasks?tags=${tag1},${tag2}&matchAll=true`,
      { headers }
    )

    if (!multiAll.data.length) {
      throw new Error("Multi-tag ALL filter failed")
    }

    console.log("Multi-tag ALL filter OK")

    // -------------------------
    // SUCCESS
    // -------------------------
    console.log("\n✅ ALL FILTER TESTS PASSED")

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.response?.data || err.message)
  }
}

runTests()
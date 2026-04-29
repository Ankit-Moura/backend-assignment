const { ObjectId } = require("mongodb")
const connectDB = require("../../config/mongo")
let initialized = false


let db
let usersCollection
let tasksCollection
let tagsCollection


async function init() {
    if (initialized)return
  const db = await connectDB()
  tagsCollection = db.collection("tags")

  usersCollection = db.collection("users")

  await usersCollection.createIndex(
    { email: 1 },
    { unique: true }
  )

  tasksCollection = db.collection("tasks")

    // Indexes (mirror PG)
    await tasksCollection.createIndex({ user_id: 1 })
    await tasksCollection.createIndex({ user_id: 1, status: 1 })

  // enforce uniqueness per user
  await tagsCollection.createIndex(
    { user_id: 1, name: 1 },
    { unique: true }
  )
  initialized = true;
}


// ---------- Repository ----------
class MongoTaskRepository {

  async createTask(task) {
    try {
      await init() 
      const userId = new ObjectId(task.user_id)

      // 🔥 STEP 1 — extract tag_ids safely
      const tagIds = task.tag_ids || []

      let tagObjectIds = []

      if (tagIds.length > 0) {
        tagObjectIds = tagIds.map(id => new ObjectId(id))

        // 🔥 STEP 2 — validate ownership
        const validCount = await tagsCollection.countDocuments({
          _id: { $in: tagObjectIds },
          user_id: userId
        })

        if (validCount !== tagObjectIds.length) {
          throw new Error("Invalid or unauthorized tag_ids")
        }
      }

      // 🔥 STEP 3 — build document
      const doc = {
        user_id: userId,
        title: task.title,
        description: task.description || null,
        status: task.status || "pending",
        due_date: task.due_date ? new Date(task.due_date) : null,
        category: task.category || null,
        tags: tagObjectIds, // ✅ NEW FIELD
        created_at: new Date()
      }

      // 🔥 STEP 4 — insert
      const result = await tasksCollection.insertOne(doc)

      // 🔥 STEP 5 — clean response
      return {
        id: result.insertedId.toString(),
        user_id: doc.user_id.toString(),
        title: doc.title,
        description: doc.description,
        status: doc.status,
        due_date: doc.due_date,
        category: doc.category,
        tags: doc.tags.map(t => t.toString()), // ✅ return as strings
        created_at: doc.created_at
      }

    } catch (err) {
      console.error("createTask Error:", err.message)
      throw err
    }
  }

  async getTasksByUser(userId) {
    try {
     await init() 

      const tasks = await tasksCollection
        .find({ user_id: new ObjectId(userId) })
        .sort({ created_at: -1 })
        .toArray()

      return tasks.map(t => ({
        id: t._id.toString(),
        user_id: t.user_id.toString(),
        title: t.title,
        description: t.description,
        status: t.status,
        due_date: t.due_date,
        reminder_job_id: t.reminder_job_id,
        category: t.category,
        tags: t.tags.map(t => t.toString()),
        created_at: t.created_at
      }))

    } catch (err) {
      console.error("getTasksByUser Error:", err.message)
      throw err
    }
  }

  async getTaskById(taskId, userId) {
    try {
      await init() 

      const task = await tasksCollection.findOne({
        _id: new ObjectId(taskId),
        user_id: new ObjectId(userId)
      })

      if (!task) return null

      return {
        id: task._id.toString(),
        user_id: task.user_id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        due_date: task.due_date,
        reminder_job_id: task.reminder_job_id,
        category: task.category,
         tags: task.tags.map(t => t.toString()),
        created_at: task.created_at
      }

    } catch (err) {
      console.error("getTaskById Error:", err.message)
      throw err
    }
  }

async updateTask(taskId, userId, updates) {
  try {
    await init()

    const allowedFields = ["title", "description", "status", "due_date", "reminder_job_id"]

    const updateData = {}

    // 🔹 Normal fields
    for (let key of allowedFields) {
      if (updates[key] !== undefined) {
        updateData[key] =
          key === "due_date" ? new Date(updates[key]) : updates[key]
      }
    }

    // 🔥 NEW: handle tag_ids
    if (updates.tag_ids !== undefined) {
      const tagIds = updates.tag_ids.map(id => new ObjectId(id))

      const validCount = await tagsCollection.countDocuments({
        _id: { $in: tagIds },
        user_id: new ObjectId(userId)
      })

      if (validCount !== tagIds.length) {
        throw new Error("Invalid or unauthorized tag_ids")
      }

      updateData.tags = tagIds
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update")
    }

    // 🔥 Use updateOne (cleaner than findOneAndUpdate issues)
    const result = await tasksCollection.updateOne(
      {
        _id: new ObjectId(taskId),
        user_id: new ObjectId(userId)
      },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      throw new Error("Task not found or unauthorized")
    }

    // 🔥 Fetch updated task manually
    const t = await tasksCollection.findOne({
      _id: new ObjectId(taskId)
    })

    return {
      id: t._id.toString(),
      user_id: t.user_id.toString(),
      title: t.title,
      description: t.description,
      status: t.status,
      due_date: t.due_date,
      reminder_job_id: t.reminder_job_id,
      category: t.category,
      tags: t.tags ? t.tags.map(tag => tag.toString()) : [], // ✅ IMPORTANT
      created_at: t.created_at
    }

  } catch (err) {
    console.error("updateTask Error:", err.message)
    throw err
  }
}
  async deleteTask(taskId, userId) {
    try {
      await init() 

      const result = await tasksCollection.findOneAndDelete({
        _id: new ObjectId(taskId),
        user_id: new ObjectId(userId)
      })

      if (!result) {
        throw new Error("Task not found or unauthorized")
      }

      return {
        success: true,
        deletedTaskId: result._id.toString()
      }

    } catch (err) {
      console.error("deleteTask Error:", err.message)
      throw err
    }
  }

  async getOverdueTasks(userId) {
    try {
      await init() 

      const tasks = await tasksCollection.find({
        user_id: new ObjectId(userId),
        due_date: { $ne: null, $lt: new Date() },
        status: { $ne: "completed" }
      })
      .sort({ due_date: 1 })
      .toArray()

      return tasks.map(t => ({
        id: t._id.toString(),
        user_id: t.user_id.toString(),
        title: t.title,
        description: t.description,
        status: t.status,
        due_date: t.due_date,
        reminder_job_id: task.reminder_job_id||null,
        created_at: t.created_at
      }))

    } catch (err) {
      console.error("getOverdueTasks Error:", err.message)
      throw err
    }
  }

async getTasksByTags(userId, options = {}) {
  await init()

  const { tagIds = [], matchAll = false } = options

  const query = {
    user_id: new ObjectId(userId)
  }

  // 🔥 Apply tag filtering only if provided
  if (tagIds.length > 0) {
    const objectIds = tagIds.map(id => new ObjectId(id))

    query.tags = matchAll
      ? { $all: objectIds }   // must contain ALL tags
      : { $in: objectIds }    // contains ANY tag
  }

  const tasks = await tasksCollection
    .find(query)
    .sort({ created_at: -1 })
    .toArray()

  return tasks.map(t => ({
    id: t._id.toString(),
    user_id: t.user_id.toString(),
    title: t.title,
    description: t.description,
    status: t.status,
    due_date: t.due_date,
    category: t.category,
    tags: t.tags ? t.tags.map(tag => tag.toString()) : [],
    created_at: t.created_at
  }))
}
}

module.exports = new MongoTaskRepository()
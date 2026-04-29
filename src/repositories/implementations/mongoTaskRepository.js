const { MongoClient, ObjectId } = require("mongodb")
require("dotenv").config()

const uri = process.env.MONGO_URI
const client = new MongoClient(uri)

let db
let tasksCollection

// ---------- Internal ----------
async function connectDB() {
  if (!db) {
    await client.connect()
    db = client.db("taskdb")
    tasksCollection = db.collection("tasks")

    // Indexes (mirror PG)
    await tasksCollection.createIndex({ user_id: 1 })
    await tasksCollection.createIndex({ user_id: 1, status: 1 })

    console.log("MongoDB (tasks) connected")
  }
}

// ---------- Repository ----------
class MongoTaskRepository {

  async createTask(task) {
    try {
      await connectDB()

      const doc = {
        
        user_id: new ObjectId(task.user_id),

        title: task.title,
        description: task.description || null,
        status: task.status || "pending",
        due_date: task.due_date ? new Date(task.due_date) : null,
        category: task.category || null,
        created_at: new Date()
      }

      const result = await tasksCollection.insertOne(doc)

      return {
        id: result.insertedId.toString(),
        user_id: doc.user_id.toString(),
        title: doc.title,
        description: doc.description,
        status: doc.status,
        due_date: doc.due_date,
        reminder_job_id: doc.reminder_job_id,
        category: doc.category,
        created_at: doc.created_at
      }

    } catch (err) {
      console.error("createTask Error:", err.message)
      throw err
    }
  }

  async getTasksByUser(userId) {
    try {
      await connectDB()

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
        created_at: t.created_at
      }))

    } catch (err) {
      console.error("getTasksByUser Error:", err.message)
      throw err
    }
  }

  async getTaskById(taskId, userId) {
    try {
      await connectDB()

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
        created_at: task.created_at
      }

    } catch (err) {
      console.error("getTaskById Error:", err.message)
      throw err
    }
  }

  async updateTask(taskId, userId, updates) {
    try {
      await connectDB()

      const allowedFields = ["title", "description", "status", "due_date", "reminder_job_id"]

      const updateData = {}

      for (let key of allowedFields) {
        if (updates[key] !== undefined) {
          updateData[key] = key === "due_date"
            ? new Date(updates[key])
            : updates[key]
        }
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("No valid fields to update")
      }

      const result = await tasksCollection.findOneAndUpdate(
        {
          _id: new ObjectId(taskId),
          user_id: new ObjectId(userId)
        },
        { $set: updateData },
        { returnDocument: "after" }
      )

      if (!result) {
        throw new Error("Task not found or unauthorized")
        }

        const t = result

      return {
        id: t._id.toString(),
        user_id: t.user_id.toString(),
        title: t.title,
        description: t.description,
        status: t.status,
        due_date: t.due_date,
        reminder_job_id: t.reminder_job_id,
        category: t.category,
        created_at: t.created_at
      }

    } catch (err) {
      console.error("updateTask Error:", err.message)
      throw err
    }
  }

  async deleteTask(taskId, userId) {
    try {
      await connectDB()

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
      await connectDB()

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
}

module.exports = new MongoTaskRepository()
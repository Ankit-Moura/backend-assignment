const { MongoClient, ObjectId } = require("mongodb")
require("dotenv").config()

const uri = process.env.MONGO_URI
const client = new MongoClient(uri)

let db
let usersCollection

// ---------- Internal helper ----------
async function connectDB() {
  if (!db) {
    await client.connect()
    db = client.db("taskdb") // keep same logical DB name
    usersCollection = db.collection("users")

    // Create index (equivalent to PG unique constraint)
    await usersCollection.createIndex(
      { email: 1 },
      { unique: true }
    )

    console.log("MongoDB connected")
  }
}

// ---------- Repository ----------
class MongoUserRepository {

  async checkDbHealth() {
    try {
      await connectDB()

      // Basic ping
      await db.command({ ping: 1 })

      // Ensure collection exists (Mongo creates on first insert, but we force index)
      await usersCollection.createIndex(
        { email: 1 },
        { unique: true }
      )

      return true

    } catch (err) {
      console.error("Mongo DB Health Check Failed:", err.message)
      throw err
    }
  }

  async createUser(user) {
    try {
      await connectDB()

      const doc = {
        username: user.username || null,
        email: user.email,
        password: user.password,
        created_at: new Date()
      }

      const result = await usersCollection.insertOne(doc)

      return {
        id: result.insertedId.toString(),
        username: doc.username,
        email: doc.email,
        created_at: doc.created_at
      }

    } catch (err) {
      // Duplicate email
      if (err.code === 11000) {
        throw new Error("Username or email already exists")
      }

      console.error("createUser Error:", err.message)
      throw err
    }
  }

  async findUserByEmail(email) {
    try {
      await connectDB()

      const user = await usersCollection.findOne({ email })

      if (!user) return null

      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        password: user.password,
        created_at: user.created_at
      }

    } catch (err) {
      console.error("findUserByEmail Error:", err.message)
      throw err
    }
  }
}

module.exports = new MongoUserRepository()
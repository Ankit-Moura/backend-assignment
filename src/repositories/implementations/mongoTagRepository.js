const { ObjectId } = require("mongodb")
const connectDB = require("../../config/mongo")
let initialized = false
let tagsCollection

async function init() {
    if (initialized)return
  const db = await connectDB()
  tagsCollection = db.collection("tags")

  // enforce uniqueness per user
  await tagsCollection.createIndex(
    { user_id: 1, name: 1 },
    { unique: true }
  )
  initialized = true;
}

module.exports = {
  async createTag(userId, name) {
    await init()

    const doc = {
      user_id: new ObjectId(userId),
      name: name.trim(),
      created_at: new Date()
    }

    try {
      const res = await tagsCollection.insertOne(doc)

      return {
        id: res.insertedId.toString(),
        name: doc.name
      }
    } catch (err) {
      // duplicate key error
      if (err.code === 11000) {
        throw new Error("Tag already exists for this user")
      }
      throw err
    }
  },

  async getTagsByUser(userId) {
    await init()

    const tags = await tagsCollection
      .find({ user_id: new ObjectId(userId) })
      .sort({ name: 1 })
      .toArray()

    return tags.map(t => ({
      id: t._id.toString(),
      name: t.name
    }))
  },

    async updateTag(tagId, userId, name) {
        await init()

        try {

        
      const res = await tagsCollection.findOneAndUpdate(
        {
          _id: new ObjectId(tagId),
          user_id: new ObjectId(userId)
        },
        {
          $set: { name: name.trim() }
        },
        { returnDocument: "after" }
      )

      if (!res) {
        throw new Error("Tag not found or unauthorized")
      }

      return {
        id: res._id.toString(),
        name: res.name
      }

    } catch (err) {
      if (err.code === 11000) {
        throw new Error("Tag already exists for this user")
      }
      throw err
    }
  },

  async deleteTag(tagId, userId) {
    await init()

    const res = await tagsCollection.deleteOne({
      _id: new ObjectId(tagId),
      user_id: new ObjectId(userId)
    })

    if (res.deletedCount === 0) {
      throw new Error("Tag not found or unauthorized")
    }

    return { success: true }
  }
}
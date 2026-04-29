const express = require("express")
const router = express.Router()

const tagRepo = require("../repositories/tagRepository")
const auth = require("../middleware/authMiddleware")
const { createTagSchema, updateTagSchema } = require("../validators/tagValidator")

// Create tag
router.post("/", auth, async (req, res) => {
  try {
    const data = createTagSchema.parse(req.body)
    const tag = await tagRepo.createTag(req.user.userId, data.name)
    res.status(201).json(tag)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Get all tags
router.get("/", auth, async (req, res) => {
  try {
    const tags = await tagRepo.getTagsByUser(req.user.userId)
    res.json(tags)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update tag
router.put("/:id", auth, async (req, res) => {
  try {
    const data = updateTagSchema.parse(req.body)
    const tag = await tagRepo.updateTag(
      req.params.id,
      req.user.userId,
      data.name
    )
    res.json(tag)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Delete tag
router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await tagRepo.deleteTag(
      req.params.id,
      req.user.userId
    )
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
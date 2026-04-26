const express = require("express")
const authService = require("../services/authService")

const router = express.Router()

router.post("/register", async (req, res) => {
  try {
    const user = await authService.register(req.body)
    res.json(user)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post("/login", async (req, res) => {
  try {
    const result = await authService.login(req.body)
    res.json(result)
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
})

module.exports = router
const express = require("express")
const authService = require("../services/authService")
const validate = require("../middleware/validate")
const router = express.Router()
const {registerSchema} = require("../validators/userValidator")

router.post("/register", validate(registerSchema), async (req, res) => {
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
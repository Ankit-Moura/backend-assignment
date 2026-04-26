const { z } = require("zod")

const registerSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email(),
  password: z.string().min(6)
})

module.exports = { registerSchema }
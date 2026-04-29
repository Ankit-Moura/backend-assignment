const { z } = require("zod")

const createTagSchema = z.object({
  name: z.string().min(3, "Tag name must be at least 3 characters")
})

const updateTagSchema = z.object({
  name: z.string().min(3).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Provide at least one field to update"
})

module.exports = { createTagSchema, updateTagSchema }
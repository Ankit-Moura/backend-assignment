const { z } = require("zod")

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["pending", "completed"]).optional(),
  category: z.enum(["personal", "work", "urgent"]).optional(),
  due_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  })
})

const updateTaskSchema = createTaskSchema.partial()

module.exports = {
  createTaskSchema,
  updateTaskSchema
}
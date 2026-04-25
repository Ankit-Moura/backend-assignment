
const { pool } = require("../config/postgres")

class TaskRepository{
async createTask(task) {
  try {
    const query = `
      INSERT INTO tasks (id, user_id, title, description, status, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `

    const values = [
      task.id,
      task.user_id,
      task.title,
      task.description || null,
      task.status || "pending",
      task.due_date || null
    ]

    const result = await pool.query(query, values)
    return result.rows[0]

  } catch (err) {
    console.error("CreateTask Error:", err.message)
    throw err
  }
}

async updateTask(taskId, userId, updates) {
  try {
    const fields = []
    const values = []
    let index = 1

    for (const key in updates) {
      fields.push(`${key} = $${index}`)
      values.push(updates[key])
      index++
    }

    if (fields.length === 0) {
      throw new Error("No fields to update")
    }

    // Add conditions
    values.push(taskId)
    values.push(userId)

    const query = `
      UPDATE tasks
      SET ${fields.join(", ")}
      WHERE id = $${index} AND user_id = $${index + 1}
      RETURNING *;
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      throw new Error("Task not found or unauthorized")
    }

    return result.rows[0]

  } catch (err) {
    console.error("UpdateTask Error:", err.message)
    throw err
  }
}

async deleteTask(taskId, userId) {
  try {
    const query = `
      DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `

    const values = [taskId, userId]

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      throw new Error("Task not found or unauthorized")
    }

    return { success: true, deletedTaskId: result.rows[0].id }

  } catch (err) {
    console.error("DeleteTask Error:", err.message)
    throw err
  }
}
}

module.exports = new TaskRepository()
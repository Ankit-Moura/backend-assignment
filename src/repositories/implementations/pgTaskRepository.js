const { v4: uuidv4 } = require("uuid");
const { pool } = require("../../config/postgres")

class TaskRepository{
async createTask(task) {
  try {
    const query = `
      INSERT INTO tasks (id, user_id, title, description, status, due_date, reminder_job_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `

    const values = [
      uuidv4(),
      task.user_id,
      task.title,
      task.description || null,
      task.status || "pending",
      task.due_date || null,
      task.reminder_job_id || null
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

async getTasksByUser(userId) {
  try {
    const query = `
      SELECT *
      FROM tasks
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `

    const result = await pool.query(query, [userId])

    return result.rows   // empty array if no tasks (correct behavior)

  } catch (err) {
    console.error("getTasksByUser Error:", err.message)
    throw err
  }
}

async getTaskById(taskId, userId) {
  try {
    const query = `
      SELECT *
      FROM tasks
      WHERE id = $1 AND user_id = $2
      LIMIT 1;
    `

    const values = [taskId, userId]

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return null   // IMPORTANT: not an error
    }

    return result.rows[0]

  } catch (err) {
    console.error("getTaskById Error:", err.message)
    throw err
  }
}

async getTasksByUserAndStatus(userId, status) {
  try {
    const allowedStatus = ["pending", "completed"]

    if (!allowedStatus.includes(status)) {
      throw new Error("Invalid status value")
    }

    const query = `
      SELECT id, title, description, status, due_date, created_at
      FROM tasks
      WHERE user_id = $1 AND status = $2
      ORDER BY created_at DESC;
    `

    const values = [userId, status]

    const result = await pool.query(query, values)

    return result.rows

  } catch (err) {
    console.error("getTasksByUserAndStatus Error:", err.message)
    throw err
  }
}

async getOverdueTasks(userId) {
  try {
    const query = `
      SELECT id, title, description, status, due_date, created_at
      FROM tasks
      WHERE user_id = $1
        AND due_date IS NOT NULL
        AND due_date < NOW()
        AND status != 'completed'
      ORDER BY due_date ASC;
    `

    const result = await pool.query(query, [userId])

    return result.rows   // [] if none → correct behavior

  } catch (err) {
    console.error("getOverdueTasks Error:", err.message)
    throw err
  }
}
}

module.exports = new TaskRepository()
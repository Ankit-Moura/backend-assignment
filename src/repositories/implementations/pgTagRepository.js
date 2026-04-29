const { pool } = require("../../config/postgres")
const { v4: uuidv4 } = require("uuid")

module.exports = {
  async createTag(userId, name) {
    const id = uuidv4()
    const q = `
      INSERT INTO tags (id, user_id, name)
      VALUES ($1, $2, $3)
      RETURNING id, name
    `
    const { rows } = await pool.query(q, [id, userId, name])
    return rows[0]
  },

  async getTagsByUser(userId) {
    const { rows } = await pool.query(
      `SELECT id, name FROM tags WHERE user_id = $1 ORDER BY name`,
      [userId]
    )
    return rows
  },

  async updateTag(tagId, userId, name) {
    const { rows } = await pool.query(
      `UPDATE tags
       SET name = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, name`,
      [name, tagId, userId]
    )
    if (rows.length === 0) throw new Error("Tag not found or unauthorized")
    return rows[0]
  },

  async deleteTag(tagId, userId) {
    const { rowCount } = await pool.query(
      `DELETE FROM tags
       WHERE id = $1 AND user_id = $2`,
      [tagId, userId]
    )
    if (rowCount === 0) throw new Error("Tag not found or unauthorized")
    return { success: true }
  }
}
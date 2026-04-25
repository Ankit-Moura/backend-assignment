
const { pool } = require("../config/postgres")

class UserRepository {
 async checkDbHealth() {
  try {
    // 1. Check DB connection
    await pool.query("SELECT 1")

    // 2. Create users table FIRST
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 3. Create tasks table (depends on users)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)

    // 4. Verify BOTH tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('users', 'tasks');
    `)

    const tables = result.rows.map(r => r.table_name)

    if (!tables.includes("users") || !tables.includes("tasks")) {
      throw new Error("Required tables not created properly")
    }

    return true

  } catch (err) {
    console.error("DB Health Check Failed:", err.message)
    throw err
  }
}
 async createUser(user) {
    try {
      const query = `
        INSERT INTO users (id, username, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, created_at;
      `

      const values = [
        user.id,
        user.username,
        user.email,
        user.password
      ]

      const result = await pool.query(query, values)

      return result.rows[0]

    } catch (err) {
      if (err.code === "23505") {
        throw new Error("Email already exists")
      }

      console.error("CreateUser Error:", err.message)
      throw err
    }
}
}

module.exports = new UserRepository()
const { pool } = require("../config/postgres")

class UserRepository {
  async checkDbHealth() {
    let client

    try {
      client = await pool.connect()

      // 1. Check DB connection
      await client.query("SELECT 1")

      // 2. Create users table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // 3. Verify table exists (strict check)
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        );
      `)

      if (!result.rows[0].exists) {
        throw new Error("Users table creation failed")
      }

      return true
    } catch (err) {
      console.error("DB Health Check Failed:", err.message)
      throw err   // never suppress
    } finally {
      if (client) client.release()
    }
  }
}

module.exports = new UserRepository()
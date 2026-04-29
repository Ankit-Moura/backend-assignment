const { v4: uuidv4 } = require("uuid");
const { pool } = require("../../config/postgres")

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
        reminder_job_id VARCHAR(255),
        category VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)
      // create tags table
      await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        name TEXT NOT NULL,
        UNIQUE(user_id, name),

        FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `)

    //create task_tag table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_tags (
        task_id UUID NOT NULL,
        tag_id UUID NOT NULL,
        PRIMARY KEY (task_id, tag_id),

        FOREIGN KEY (task_id)
          REFERENCES tasks(id)
          ON DELETE CASCADE,

        FOREIGN KEY (tag_id)
          REFERENCES tags(id)
          ON DELETE CASCADE
      );
    `)

    // 4. Verify all tables exist
    const requiredTables = ['users', 'tasks', 'tags', 'task_tags']
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('users', 'tasks', 'tags', 'task_tags');
    `)

    const existingTables = result.rows.map(r => r.table_name)

    const missing = requiredTables.filter(t => !existingTables.includes(t))

    if (missing.length > 0) {
      throw new Error(`Missing tables: ${missing.join(", ")}`)
    }

    // Indexes
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id_id ON tasks(user_id, id);
    `) 

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
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
        uuidv4(),
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

async findUserByEmail(email) {
  try {
    const query = `
      SELECT id, username, email, password, created_at
      FROM users
      WHERE email = $1
      LIMIT 1;
    `

    const result = await pool.query(query, [email])

    if (result.rows.length === 0) {
      return null   // IMPORTANT: don't throw here
    }

    return result.rows[0]

  } catch (err) {
    console.error("findUserByEmail Error:", err.message)
    throw err
  }
}
}

module.exports = new UserRepository()
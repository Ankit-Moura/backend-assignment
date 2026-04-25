const { Pool } = require("pg")

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
})

pool.on("connect", () => {
  console.log("PostgreSQL connected")
})

pool.on("error", (err) => {
  console.error("Unexpected Postgres error:", err.message)
})

module.exports = {pool}
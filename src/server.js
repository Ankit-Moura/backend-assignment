require("dotenv").config()
console.log("DB URL:", process.env.POSTGRES_URL)
const app = require("./app")
const connectMongo = require("./config/mongo")
const pool = require("./config/postgres")
const PORT = 5000


// connect Mongo
connectMongo()

// test Postgres connection
pool.query("SELECT 1")
  .then(() => console.log("PostgreSQL ready"))
  .catch(err => {
    console.error("Postgres error:", err.message)
    process.exit(1)
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
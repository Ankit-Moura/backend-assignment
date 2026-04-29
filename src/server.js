require("dotenv").config()

const app = require("./app")
const UserRepo = require("./repositories/userRepository")
// const connectMongo = require("./config/mongo")
// const {pool} = require("./config/postgres")
const PORT = 5000

async function startServer() {
  try {
    await UserRepo.checkDbHealth()

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

  } catch (err) {
    console.error("Failed to start server:", err.message)
    process.exit(1)
  }
}

startServer()
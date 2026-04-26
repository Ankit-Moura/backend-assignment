require("dotenv").config()

const app = require("./app")

// const connectMongo = require("./config/mongo")
// const {pool} = require("./config/postgres")
const PORT = 5000



// // connect Mongo
// connectMongo()






app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
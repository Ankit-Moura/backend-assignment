const dbType = require("../config/dbType")

let repo

if (dbType === "mongo") {
  repo = require("../repositories/implementations/mongoUserRepository")
} else if (dbType === "pg") {
  repo = require("../repositories/implementations/pgUserRepository")
} else {
  throw new Error("Invalid DB type configured")
}

module.exports = repo
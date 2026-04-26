const express = require("express")
const authRoutes = require("./routes/authRoutes")
const app = express()

app.use(express.json())

app.use("/auth", authRoutes)
// test route
app.get("/", (req, res) => {
  res.send("Server is running")
})

module.exports = app
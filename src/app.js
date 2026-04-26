const express = require("express")
const authRoutes = require("./routes/authRoutes")
const taskRoutes = require("./routes/taskRoutes")
const app = express()

app.use(express.json())

//routes
app.use("/auth", authRoutes)
app.use("/tasks", taskRoutes)

app.get("/", (req, res) => {
  res.send("Server is running")
})

module.exports = app
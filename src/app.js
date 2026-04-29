const express = require("express")
const authRoutes = require("./routes/authRoutes")
const taskRoutes = require("./routes/taskRoutes")
const tagRoutes = require("./routes/tagRoutes")
const app = express()

app.use(express.json())



//routes
app.use("/auth", authRoutes)
app.use("/tasks", taskRoutes)
app.use("/tags", tagRoutes)


app.get("/", (req, res) => {
  res.send("Server is running")
})

module.exports = app
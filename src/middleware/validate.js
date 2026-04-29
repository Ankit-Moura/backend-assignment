function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body)
      next()
    } catch (err) {
      console.log("VALIDATION ERROR:", err)
     return res.status(400).json({
        error: "Data Validation failed",
        details: err
      })
    }
  }
}

module.exports = validate
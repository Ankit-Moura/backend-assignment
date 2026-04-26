function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body)
      next()
    } catch (err) {
     return res.status(400).json({
        error: "Data Validation failed",
        details: err.errors
      })
    }
  }
}

module.exports = validate
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const userRepo = require("../repositories/userRepository")

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"

class AuthService {
  async register({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await userRepo.createUser({
      username,
      email,
      password: hashedPassword
    })

    return {
      id: user.id,
      username: user.username,
      email: user.email
    }
  }

  async login({ email, password }) {
    const user = await userRepo.findUserByEmail(email)

    if (!user) {
      throw new Error("Invalid credentials")
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      throw new Error("Invalid credentials")
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    )

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }
  }
}

module.exports = new AuthService()
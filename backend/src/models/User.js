import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true }
  },
  { timestamps: true }
)

userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export const User = mongoose.model('User', userSchema)



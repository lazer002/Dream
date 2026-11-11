import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });

// Mongo deletes codes an hour after they expire.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 });
otpSchema.index({ email: 1, createdAt: -1 });

// Method to verify OTP
otpSchema.methods.verifyOtp = async function(otp) {
  return bcrypt.compare(otp, this.otpHash);
};

export const OTP = mongoose.model('OTP', otpSchema);

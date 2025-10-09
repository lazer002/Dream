import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    console.log("Backend response:", req.body);

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Missing Google token" });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        provider: "google",
        role: "user",
      });
    }

    // Payload for JWT tokens
    const payload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    };

    // Generate tokens
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Send consistent response
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

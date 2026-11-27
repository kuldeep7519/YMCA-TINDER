import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  try {
    // 1. Must have an authenticated session cookie
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({
        message: "Admin authentication required. Please log in with an authorized admin account.",
      });
    }

    // 2. Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ message: "Admin user not found" });
    }

    // 3. Strict identity check: Only founder/admin accounts are allowed
    const isAuthorized =
      user.role === "admin" ||
      user.email === "kuldeeprao9812@gmail.com" ||
      user.email === "1kuldeeprao9812@gmail.com" ||
      user.email === process.env.EMAIL_USER;

    if (!isAuthorized) {
      return res.status(403).json({
        message: "Access denied. Only authorized YMCA Match administrators can perform this action.",
      });
    }

    // 4. Verification passed: caller is verified founder/admin
    req.user = user;
    req.isAdmin = true;
    next();
  } catch (err) {
    res.status(401).json({ message: "Admin authorization error: " + err.message });
  }
};

export default adminAuth;

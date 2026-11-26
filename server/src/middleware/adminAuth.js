import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  try {
    const adminKey = req.headers["x-admin-key"] || req.query.adminKey;
    const realPasscode = process.env.ADMIN_PASSCODE || "Kuldeep@YMCA#2026!Admin";

    // Master secret passcode for direct developer access (Must match secret passcode, NOT decoy)
    if (adminKey && adminKey === realPasscode) {
      req.isAdmin = true;
      return next();
    }

    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({
        message: "Admin authentication required. Enter admin passcode or log in with an admin account.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isAuthorized =
      user.role === "admin" ||
      user.email === "kuldeeprao9812@gmail.com" ||
      user.email === process.env.EMAIL_USER;

    if (!isAuthorized) {
      return res.status(403).json({
        message: "Access denied. Only YMCA Match admins can access this dashboard.",
      });
    }

    req.user = user;
    req.isAdmin = true;
    next();
  } catch (err) {
    res.status(401).json({ message: "Admin authorization error: " + err.message });
  }
};

export default adminAuth;

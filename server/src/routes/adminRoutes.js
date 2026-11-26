import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import Report from "../models/reportModel.js";
import User from "../models/userModel.js";
import connectionModel from "../models/connectionModel.js";
import Chat from "../models/chatModel.js";

const adminRouter = express.Router();

// POST /admin/verify-passcode - Verify master admin passcode
adminRouter.post("/admin/verify-passcode", (req, res) => {
  const { passcode } = req.body;
  const realPasscode = process.env.ADMIN_PASSCODE || "Kuldeep@YMCA#2026!Admin";
  if (passcode && passcode.trim() === realPasscode) {
    return res.status(200).json({ success: true, message: "Admin access granted" });
  }
  return res.status(401).json({ success: false, message: "Invalid admin passcode" });
});

// GET /admin/stats - Overview metrics for moderation dashboard
adminRouter.get("/admin/stats", adminAuth, async (req, res) => {
  try {
    const [
      totalReports,
      pendingReports,
      reviewedReports,
      dismissedReports,
      totalUsers,
      bannedUsers,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "reviewed" }),
      Report.countDocuments({ status: "dismissed" }),
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalReports,
        pendingReports,
        reviewedReports,
        dismissedReports,
        totalUsers,
        bannedUsers,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error loading admin stats: " + err.message });
  }
});

// GET /admin/reports - Fetch all reports with reporter & reported user details
adminRouter.get("/admin/reports", adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate("reporterId", "firstName lastName email photoUrl branch year")
      .populate("reportedUserId", "firstName lastName email photoUrl branch year isBanned banReason")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ message: "Error loading reports: " + err.message });
  }
});

// PATCH /admin/report/:reportId/status - Update report status (reviewed / dismissed)
adminRouter.patch("/admin/report/:reportId/status", adminAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!["pending", "reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({ message: "Invalid report status" });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status },
      { new: true }
    )
      .populate("reporterId", "firstName lastName email photoUrl branch year")
      .populate("reportedUserId", "firstName lastName email photoUrl branch year isBanned banReason");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({ success: true, message: `Report marked as ${status}`, report });
  } catch (err) {
    res.status(500).json({ message: "Error updating report: " + err.message });
  }
});

// POST /admin/user/:userId/ban - Ban or unban a user
adminRouter.post("/admin/user/:userId/ban", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBanned, banReason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBanned = Boolean(isBanned);
    user.banReason = isBanned ? (banReason || "Violating campus safety guidelines") : "";
    await user.save();

    // If banned, mark any pending reports against this user as reviewed
    if (isBanned) {
      await Report.updateMany(
        { reportedUserId: userId, status: "pending" },
        { status: "reviewed" }
      );
    }

    res.status(200).json({
      success: true,
      message: isBanned
        ? `${user.firstName} has been suspended.`
        : `${user.firstName} has been reinstated.`,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        isBanned: user.isBanned,
        banReason: user.banReason,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating user ban state: " + err.message });
  }
});

// DELETE /admin/user/:userId - Permanently delete a rogue / fake account
adminRouter.delete("/admin/user/:userId", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Protection: Never allow deleting an admin or founder account
    if (user.role === "admin" || user.email === "kuldeeprao9812@gmail.com") {
      return res.status(403).json({ message: "Protected account: Administrator profiles cannot be deleted." });
    }

    // Clean up related connections, chats, and reports
    await Promise.all([
      User.findByIdAndDelete(userId),
      connectionModel.deleteMany({
        $or: [{ fromuserid: userId }, { touserid: userId }],
      }),
      Chat.deleteMany({ participants: userId }),
      Report.deleteMany({
        $or: [{ reporterId: userId }, { reportedUserId: userId }],
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Account for ${user.firstName} ${user.lastName || ""} has been permanently deleted.`,
    });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user account: " + err.message });
  }
});

// GET /admin/users - Search or view students (including banned)
adminRouter.get("/admin/users", adminAuth, async (req, res) => {
  try {
    const { search, bannedOnly } = req.query;
    const filter = {};

    if (bannedOnly === "true") {
      filter.isBanned = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { branch: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("firstName lastName email photoUrl branch year gender age role isBanned banReason createdAt")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ message: "Error loading users: " + err.message });
  }
});

export default adminRouter;

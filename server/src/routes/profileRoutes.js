import express from "express";
import auth from "../middleware/auth.js";

const ProfileRoute = express.Router();

ProfileRoute.get("/profile/view", auth, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).send(user);
  } catch (err) {
    res.status(401).send(err.message);
  }
});

ProfileRoute.patch("/profile/edit", auth, async (req, res) => {
  try {
    const user = req.user;
    const AllowedUpdates = [
      "firstName",
      "lastName",
      "bio",
      "gender",
      "age",
      "year",
      "photoUrl",
      "branch",
      "interest",
      "isPaused",
    ];
    const isUpdateAllowed = Object.keys(req.body).every((key) => {
      return AllowedUpdates.includes(key);
    });

    if (!isUpdateAllowed) {
      return res.status(400).send("Update for one or more fields is not allowed");
    }

    Object.keys(req.body).forEach((key) => {
      user[key] = req.body[key];
    });

    await user.save();
    res.json({
      message: `${user.firstName}, your profile was updated successfully!`,
      data: user,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

ProfileRoute.post("/logout", (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("Logout successful");
});

export default ProfileRoute;

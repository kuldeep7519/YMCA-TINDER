import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/userModel.js";

const YMCA_STUDENTS = [
  {
    firstName: "Aarav",
    lastName: "Sharma",
    email: "aarav.ce@jcboseust.ac.in",
    password: "Password@123",
    age: 21,
    gender: "male",
    branch: "Computer Engineering (CE)",
    year: "3rd Year (Junior)",
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
    bio: "Full stack dev & hackathon enthusiast. Will debug your code if you buy me canteen chai! ☕💻",
    interest: ["💻 Coding", "🚀 Hackathons", "☕ Chai Pe Charcha", "🏸 Badminton"],
  },
  {
    firstName: "Ananya",
    lastName: "Verma",
    email: "ananya.it@jcboseust.ac.in",
    password: "Password@123",
    age: 20,
    gender: "female",
    branch: "Information Technology (IT)",
    year: "2nd Year (Sophomore)",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600",
    bio: "Obsessed with UI/UX, indie music, and campus sunsets near the mechanical workshop. ✨",
    interest: ["📸 Photography", "🎧 EDM / Indie Music", "✨ Anime", "☕ Chai Pe Charcha"],
  },
  {
    firstName: "Rohan",
    lastName: "Yadav",
    email: "rohan.me@jcboseust.ac.in",
    password: "Password@123",
    age: 22,
    gender: "male",
    branch: "Mechanical Engineering (ME)",
    year: "4th Year (Final Year)",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    bio: "Automobile nerd, gym regular, and proud senior. Looking for someone to explore Sector 15 cafes with. 🏋️‍♂️",
    interest: ["🏋️ Gym & Fitness", "🍜 Maggi Points", "🎮 Gaming", "🌙 Campus Walks"],
  },
  {
    firstName: "Priya",
    lastName: "Gupta",
    email: "priya.ece@jcboseust.ac.in",
    password: "Password@123",
    age: 21,
    gender: "female",
    branch: "Electronics & Communication (ECE)",
    year: "3rd Year (Junior)",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
    bio: "Robotics club by day, Netflix & chill by night. Always down for library study dates! 📚",
    interest: ["📚 Library Vibes", "💡 Startups & Tech", "🍿 Binge Watching", "🏸 Badminton"],
  },
  {
    firstName: "Kabir",
    lastName: "Malhotra",
    email: "kabir.ai@jcboseust.ac.in",
    password: "Password@123",
    age: 20,
    gender: "male",
    branch: "Robotics & Artificial Intelligence",
    year: "2nd Year (Sophomore)",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
    bio: "Training neural networks and skipping 8:30 AM lectures. Coffee addict. 🤖",
    interest: ["💻 Coding", "☕ Chai Pe Charcha", "✨ Anime", "🎮 Gaming"],
  },
  {
    firstName: "Diya",
    lastName: "Choudhary",
    email: "diya.ee@jcboseust.ac.in",
    password: "Password@123",
    age: 21,
    gender: "female",
    branch: "Electrical Engineering (EE)",
    year: "3rd Year (Junior)",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
    bio: "Badminton player for college team. Let's play a match at the sports complex! 🏸",
    interest: ["🏸 Badminton", "🏋️ Gym & Fitness", "🌙 Campus Walks", "🎧 EDM / Indie Music"],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to MongoDB for seeding...");

    for (const student of YMCA_STUDENTS) {
      const exists = await User.findOne({ email: student.email });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(student.password, 10);
        await User.create({
          ...student,
          password: hashedPassword,
        });
        console.log(`✅ Seeded student: ${student.firstName} (${student.branch})`);
      } else {
        console.log(`ℹ️ Already exists: ${student.firstName}`);
      }
    }

    console.log("🎉 Seeding complete! All demo students are ready.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedDB();

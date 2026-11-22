import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/userModel.js";

const YMCA_STUDENTS = [

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

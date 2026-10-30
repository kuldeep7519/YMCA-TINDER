export const BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "/api");

export const YMCA_BRANCHES = [
  "Computer Engineering (CE)",
  "Information Technology (IT)",
  "Electronics & Communication (ECE)",
  "Electrical Engineering (EE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE-Civil)",
  "Robotics & Artificial Intelligence",
  "Data Science & Analytics",
  "MCA / BCA",
  "MBA / BBA",
  "Applied Sciences / Humanities",
];

export const YEARS = [
  "1st Year (Fresher)",
  "2nd Year (Sophomore)",
  "3rd Year (Junior)",
  "4th Year (Final Year)",
  "Postgraduate",
];

export const INTEREST_TAGS = [
  "💻 Coding",
  "🚀 Hackathons",
  "☕ Chai Pe Charcha",
  "🏋️ Gym & Fitness",
  "🎮 Gaming",
  "📸 Photography",
  "🎧 EDM / Indie Music",
  "🍿 Binge Watching",
  "🍜 Maggi Points",
  "🏸 Badminton",
  "🌙 Campus Walks",
  "✨ Anime",
  "📚 Library Vibes",
  "💡 Startups & Tech",
];

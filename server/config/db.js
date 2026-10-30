import mongoose from "mongoose";

export async function connectDB() {
  const { DB_USER, DB_PASS, DB_HOST, DB_NAME } = process.env;

  // Report which variables are missing, without printing any values
  const missing = ["DB_USER", "DB_PASS", "DB_HOST", "DB_NAME"].filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    console.error("Missing values in server/.env:", missing.join(", "));
    process.exit(1);
  }

  // encodeURIComponent makes special characters in the password safe
  const uri = `mongodb+srv://${encodeURIComponent(DB_USER)}:${encodeURIComponent(
    DB_PASS
  )}@${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`;

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
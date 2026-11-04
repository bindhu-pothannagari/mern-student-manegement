import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimiters.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import requireAuth from "./middleware/requireAuth.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api", apiLimiter);
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/students", requireAuth, studentRoutes);
app.use("/api/courses", requireAuth, courseRoutes);
app.use("/api/instructors", requireAuth, instructorRoutes);
app.use("/api/users", requireAuth, userRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
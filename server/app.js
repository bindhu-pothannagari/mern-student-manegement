import express from "express";
import cors from "cors";
import studentRoutes from "./routes/studentRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api/students", studentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

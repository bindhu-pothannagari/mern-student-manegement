import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/tokens.js";

export default async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError("Authentication required", 401);
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Session expired", 401);
    }
    throw new AppError("Invalid token", 401);
  }

  const user = await User.findById(payload.sub).select("+tokenVersion");
  if (!user || user.tokenVersion !== payload.tv) {
    throw new AppError("Session is no longer valid. Please log in again", 401);
  }

  req.user = user;
  next();
}
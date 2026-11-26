import { rateLimit } from "express-rate-limit";

// Per-IP limits for auth endpoints. In-memory store: fine for a single instance,
// counters reset when the server restarts.
const tooMany = (message) => ({
  standardHeaders: "draft-7", // RateLimit headers tell the client when to retry
  legacyHeaders: false,
  message: { message },
});

// Brute-force protection: only failed logins count, so real users aren't locked out.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  ...tooMany("Too many failed login attempts. Please wait 15 minutes and try again."),
});

// Stops scripted mass account creation.
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  ...tooMany("Too many accounts created from this network. Please try again in an hour."),
});

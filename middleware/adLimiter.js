const rateLimit = require("express-rate-limit");

exports.adLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 sec
  max: 10,
  message: "Too many ad requests, slow down",
});

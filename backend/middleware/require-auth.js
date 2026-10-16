const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Sign in to continue." });
  }

  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ message: "Your session expired. Sign in again." });
  }
}

module.exports = requireAuth;

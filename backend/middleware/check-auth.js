const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const checkAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await jwt.verify(token, JWT_SECRET);
    req.userData = decodedToken;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
module.exports = checkAuth;

require("dotenv").config();
const accessTokenSecret =
  process.env.NODE_ENV === "development"
    ? process.env.JWT_SECRET_DEV
    : process.env.JWT_SECRET_PROD;
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const authenticateJWTAdmin = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    next();
  } else {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];

      jwt.verify(token, accessTokenSecret, (err, user) => {
        if (err) {
          return res.status(403).json({ message: "Not Authorized" });
        }
        if (user.isAdmin) {
          console.log("IS ADMIN");
          req.user = user;
          next();
        } else {
          console.log("IS NOT ADMIN");
          return res.status(403).json({ message: "Not Authorized" });
        }
      });
    } else {
      res.sendStatus(401);
    }
  }
};

module.exports = { authenticateJWT, authenticateJWTAdmin };

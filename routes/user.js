const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { authenticateJWTAdmin } = require("../middleware/auth");

let refreshTokens = [];
/**
 * Sign Up User
 */

router.post("/signup", (req, res, next) => {
  /** Steps
   * 1. First Find Whether Email Already Exists
   * 2. If User Exists Send a Message that Email already Exists
   * 3. Else Create a New User with Email and Hashed PWD
   */

  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length >= 1) {
        return res.status(409).json({
          message: "Email Already Exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
            });
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash,
              isAdmin: false,
            });
            user
              .save()
              .then((result) => {
                console.log("USER", result);
                res.status(201).json({
                  message: "User Created",
                });
              })
              .catch((err) => {
                console.log(err);
                res.status(500).json({
                  error: err,
                });
              });
          }
        });
      }
    });
});

/**
 * Add Admin User
 */

router.post("/add_admin", authenticateJWTAdmin, (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length >= 1) {
        return res.status(409).json({
          message: "Email Already Exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
            });
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash,
              isAdmin: req.body.isAdmin,
            });
            user
              .save()
              .then((result) => {
                console.log("USER", result);
                res.status(201).json({
                  message: "User Created",
                  user: result,
                });
              })
              .catch((err) => {
                console.log(err);
                res.status(500).json({
                  error: err,
                });
              });
          }
        });
      }
    });
});
router.post("/login", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      let jwtKey =
        process.env.NODE_ENV === "development"
          ? process.env.JWT_SECRET_DEV
          : process.env.JWT_SECRET_PROD;

      if (user.length < 1) {
        return res.send(401).json({
          message: "Auth Failed",
        });
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.send(401).json({
            message: "Auth Failed",
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              email: user[0].email,
              userID: user[0]._id,
              isAdmin: user[0].isAdmin,
            },
            jwtKey,
            {
              expiresIn: "1m",
            }
          );

          const refreshToken = jwt.sign(
            {
              email: user[0].email,
              userID: user[0]._id,
              isAdmin: user[0].isAdmin,
            },
            process.env.JWT_REFRESH_SECRET
          );
          refreshTokens.push(refreshToken);
          return res.status(200).json({
            message: "Auth Sucessfull",
            token: token,
            refreshToken: refreshToken,
          });
        }
        return res.send(401).json({
          message: "Auth Failed",
        });
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.post("/decode", (req, res, next) => {
  const { token } = req.body;
  let jwtKey =
    process.env.NODE_ENV === "development"
      ? process.env.JWT_SECRET_DEV
      : process.env.JWT_SECRET_PROD;
  if (!token) {
    console.log("Not Token");
    return res.sendStatus(401);
  }
  jwt.verify(token, jwtKey, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Please Login Again As Token Has Expired" });
    }

    res.json({
      user,
    });
  });
});

router.post("/token", (req, res) => {
  const { token } = req.body;
  let jwtKey =
    process.env.NODE_ENV === "development"
      ? process.env.JWT_SECRET_DEV
      : process.env.JWT_SECRET_PROD;
  if (!token) {
    return res.status(401).json({
      message: "JSON TOKEN NOT VALID",
    });
  }

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
    console.log("USER", user);
    if (err) {
      console.log("ERROR", JSON.stringify(err, null, 3));
      return res.status(403).json({
        message: err.message,
      });
    }

    const accessToken = jwt.sign(
      {
        email: user.email,
        userID: user.userID,
        isAdmin: user.isAdmin,
      },
      jwtKey,
      { expiresIn: "20m" }
    );

    res.json({
      token: accessToken,
    });
  });
});

router.post("/logout", (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.status(200).json({ message: "Logout successful" });
});

module.exports = router;

require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const users = require("./data");
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
console.log("PROCE ENV", process.env.NODE_ENV);
const accessTokenSecret =
  process.env.NODE_ENV === "development"
    ? process.env.JWT_SECRET_DEV
    : process.env.JWT_SECRET_PROD;
app.post("/login", (req, res) => {
  // Read username and password from request body
  const { username, password } = req.body;

  // Filter user from the users array by username and password
  const user = users.find((u) => {
    return u.username === username && u.password === password;
  });

  if (user) {
    // Generate an access token
    const accessToken = jwt.sign(
      { username: user.username, role: user.role },
      accessTokenSecret
    );

    res.json({
      accessToken,
    });
  } else {
    res.send("Username or password incorrect");
  }
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

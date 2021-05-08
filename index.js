require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { users, books } = require("./data");
const authenticateJWT = require("./middleware/auth");
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
console.log("PROCE ENV", process.env.NODE_ENV);
const accessTokenSecret =
  process.env.NODE_ENV === "development"
    ? process.env.JWT_SECRET_DEV
    : process.env.JWT_SECRET_PROD;

const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
const refreshTokens = [];

app.get("/", (req, res) => {
  res.status(200).json({
    messsage: "Welcome To Auth API",
    resources: [
      { method: "GET", path: "/" },
      {
        method: "POST",
        path: "/login",
        message: "Takes Username and Password",
      },
      {
        method: "GET",
        path: "/books",
        message: "Needs an Auth Token to get the list of books",
      },
    ],
  });
});

app.post("/login", (req, res) => {
  // read username and password from request body
  const { username, password } = req.body;

  // filter user from the users array by username and password
  const user = users.find((u) => {
    return u.username === username && u.password === password;
  });

  if (user) {
    // generate an access token
    const accessToken = jwt.sign(
      { username: user.username, role: user.role },
      accessTokenSecret,
      { expiresIn: "20m" }
    );
    const refreshToken = jwt.sign(
      { username: user.username, role: user.role },
      refreshTokenSecret
    );

    refreshTokens.push(refreshToken);

    res.json({
      accessToken,
      refreshToken,
      role: user.role,
    });
  } else {
    res.status(400).json({
      message: "Incorrect Credentials",
    });
  }
});

app.post("/token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.sendStatus(401);
  }

  if (!refreshTokens.includes(token)) {
    return res.sendStatus(403);
  }

  jwt.verify(token, refreshTokenSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const accessToken = jwt.sign(
      { username: user.username, role: user.role },
      accessTokenSecret,
      { expiresIn: "20m" }
    );

    res.json({
      accessToken,
    });
  });
});

app.get("/books", authenticateJWT, (req, res) => {
  res.status(200).json(books);
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

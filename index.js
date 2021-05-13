require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { users, books } = require("./data");
const authenticateJWT = require("./middleware/auth");

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/uploads`);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

let upload = multer({ storage: storage });

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.use(express.static(`${__dirname}/uploads`));
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

app.post("/profile", upload.single("avatar"), function (req, res, next) {
  if (req.file) {
    console.log(req.file);
    res.status(200).json({
      message: "Uploded",
      url: req.file.path,
    });
  } else {
    res.status(404).json({ message: "avatar field not given" });
  }
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
});

app.get("/user/:uid", (req, res) => {
  const uid = req.params.uid;
  const user = users.find((u) => {
    return u.id === Number(uid);
  });
  if (user) {
    res.status(200).json({
      username: user.username,
      role: user.role,
      password: "****",
    });
  } else {
    res.status(404).json({
      message: "User Not Found",
    });
  }
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
      username: username,
      id: user.id,
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

require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const morgan = require("morgan");
const cors = require("cors");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const colors = require("colors");
const port = process.env.PORT || 3000;
const { users, books } = require("./data");
const authenticateJWT = require("./middleware/auth");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

let s3 = new aws.S3();

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "my-food-blog-images",
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
}).single("avatar");

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

app.post("/profile", function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log(err.message);
      return res.status(500).json({
        error: err.message,
      });
    } else if (err) {
      console.log(err.message);
      return res.status(404).json({
        error: err.message,
      });
    } else {
      // Everything went fine.
      if (req.file) {
        res.status(200).json({
          message: "Uploded",
          url: req.file.location,
        });
      } else {
        res.status(404).json({ message: "avatar field not given" });
      }
    }
  });
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
  console.log(`Example app listening at http://localhost:${port}`.yellow.bold);
});

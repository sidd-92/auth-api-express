require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const colors = require("colors");
const port = process.env.PORT || 3000;
const connectDB = require("./config/db");
const uploadRoute = require("./routes/upload");
const userRoute = require("./routes/user");
const imageRoute = require("./routes/image");
const recipieRoute = require("./routes/recipie");
const categoryRoute = require("./routes/categories");
connectDB();

const isDev = process.env.NODE_ENV === "development" ? true : false;

const app = express();
app.use(express.json());
app.use(isDev ? morgan("dev") : morgan("common"));
app.use(cors());

app.use("/api/upload", uploadRoute);
app.use("/api/user", userRoute);
app.use("/api/image", imageRoute);
app.use("/api/recipies", recipieRoute);
app.use("/api/category", categoryRoute);

app.get("/", (req, res) => {
  res.status(200).json({
    messsage: "Welcome To Auth API",
    resources: [
      { method: "GET", path: "/" },
      {
        method: "POST",
        path: "/login",
        message: "Takes Email and Password",
      },
      {
        method: "POST",
        path: "/signup",
        message: "Register a User",
      },
    ],
  });
});

/* 
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
*/
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`.yellow.bold);
});

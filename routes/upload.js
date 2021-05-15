const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const colors = require("colors");
const aws = require("aws-sdk");
const router = express.Router();

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

router.post("/", function (req, res) {
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

module.exports = router;

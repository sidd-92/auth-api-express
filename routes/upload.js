const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const colors = require("colors");
const aws = require("aws-sdk");
const router = express.Router();
const { authenticateJWTAdmin } = require("../middleware/auth");

aws.config.update({
	secretAccessKey: process.env.AWS_SECRET_KEY,
	accessKeyId: process.env.AWS_ACCESS_KEY,
	region: process.env.AWS_REGION,
});

let s3 = new aws.S3();

var upload = multer({
	storage: multerS3({
		s3: s3,
		bucket: process.env.AWS_S3_BUCKET,
		acl: "public-read",
		key: function (req, file, cb) {
			cb(null, file.originalname);
		},
	}),
}).single("avatar");

router.get("/all", authenticateJWTAdmin, (req, res, next) => {
	s3.listObjectsV2({ Bucket: process.env.AWS_S3_BUCKET }, (err, data) => {
		if (err) {
			console.log("Error", err);
			return res.status(404).json({
				message: "No Objects Found",
				detail: err,
			});
		} else {
			//https://my-food-blog-images.s3.ap-south-1.amazonaws.com
			const contents = data.Contents;
			for (let index = 0; index < contents.length; index++) {
				if ("Key" in contents[index]) {
					contents[index]["URL"] =
						"https://my-food-blog-images.s3.ap-south-1.amazonaws.com/" + contents[index]["Key"];
				}
			}

			console.log("Data", data);
			return res.status(200).json({
				message: "Objects Found",
				data: contents,
			});
		}
	});
});

router.post("/remove", authenticateJWTAdmin, (req, res, next) => {
	let key = req.body.key;
	s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key }, (err, data) => {
		if (err) {
			return res.status(404).json({
				message: "No Objects Found",
				detail: err,
			});
		} else {
			return res.status(200).json({
				message: "Object Deleted From S3",
			});
		}
	});
});

router.post("/", authenticateJWTAdmin, function (req, res) {
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
				console.log("REQ FILE", req.file);
				res.status(200).json({
					message: "Uploded",
					url: req.file.location,
					key: req.file.key,
				});
			} else {
				res.status(404).json({ message: "avatar field not given" });
			}
		}
	});
});
/* 
router.post("/remove", function (req, res) {
  let filename = req.body;
  let params = {
    Key: `${filename}`,
    Bucket: process.env.AWS_S3_BUCKET,
  };
  if (!filename) {
    res.status(404).json({
      message: "File Name Not Provided",
    });
  } else {
    s3.deleteObject(params, function (err, data) {
      if (err) console.log(err, err.stack);
      // an error occurred
      else res.status(200).json({ data: data }); // successful response
    });
  }
}); */

module.exports = router;

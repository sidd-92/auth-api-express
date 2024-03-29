const express = require("express");
const mongoose = require("mongoose");
const Images = require("../models/image");
const router = express.Router();
const { authenticateJWTAdmin, authenticateJWT } = require("../middleware/auth");

router.get("/all", (req, res, next) => {
	Images.find()
		.sort({ updatedAt: -1 })
		.select()
		.exec()
		.then((result) => {
			const response = [...result];
			res.status(200).json(response);
		})
		.catch((err) => console.log(err));
});

//Add Image
router.post("/add", authenticateJWTAdmin, (req, res, next) => {
	Images.exists({ key: req.body.key }).then((result) => {
		console.log("Result", result);
		if (result) {
			return res.status(400).json({
				message: "Image Already Exists in DB",
				error: "Duplicate Image",
			});
		} else {
			const image = new Images({
				_id: new mongoose.Types.ObjectId(),
				caption: req.body.caption,
				url: req.body.url,
				updatedAt: new Date(),
				key: req.body.key,
			});
			image
				.save()
				.then((result) => {
					res.status(201).json({
						message: "Image Uploaded",
						info: {
							...result._doc,
						},
					});
				})
				.catch((err) => {
					console.log(JSON.stringify(err));
					res.status(500).json({
						error: err,
					});
				});
		}
	});
});

//Delete Image - TEST ONLY
router.delete("/remove/:id", authenticateJWTAdmin, (req, res, next) => {
	let id = req.params.id;
	Images.deleteOne({ _id: id })
		.exec()
		.then((result) => {
			res.status(200).json({ message: "Image Deleted" });
		})
		.catch((err) => {
			res.status(500).json({ message: "Server Error" });
		});
});

module.exports = router;

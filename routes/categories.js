const express = require("express");
const mongoose = require("mongoose");
const Category = require("../models/category");
const router = express.Router();
const { authenticateJWTAdmin, authenticateJWT } = require("../middleware/auth");

router.get("/all", authenticateJWT, (req, res, next) => {
	Category.find()
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
	const category = new Category({
		_id: new mongoose.Types.ObjectId(),
		category: req.body.category,
	});
	category
		.save()
		.then((result) => {
			res.status(201).json({
				message: "Created Category",
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
});

module.exports = router;

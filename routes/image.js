const express = require("express");
const mongoose = require("mongoose");
const Images = require("../models/image");
const router = express.Router();
const { authenticateJWTAdmin } = require("../middleware/auth");

router.get("/all", (req, res, next) => {
  Images.find()
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
  const image = new Images({
    _id: new mongoose.Types.ObjectId(),
    caption: req.body.caption,
    url: req.body.url,
  });
  image
    .save()
    .then((result) => {
      res.status(201).json({
        message: "Image Uploaded",
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

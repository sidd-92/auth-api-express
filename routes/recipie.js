const express = require("express");
const mongoose = require("mongoose");
const Recipie = require("../models/recipie");
const Images = require("../models/image");
const router = express.Router();
const { authenticateJWTAdmin, authenticateJWT } = require("../middleware/auth");

router.get("/all", (req, res, next) => {
	Recipie.find()
		.populate("recipieImage")
		.sort({ updatedAt: -1 })
		.select()
		.exec()
		.then((result) => {
			const response = [...result];
			res.status(200).json(response);
		})
		.catch((err) => console.log(err));
});

router.post("/add", authenticateJWTAdmin, (req, res, next) => {
	let imageId = req.body.recipieImage;
	Images.findById(imageId)
		.exec()
		.then((image) => {
			if (!image) {
				return res.status(404).json({
					message: "Image Not Found",
				});
			}
			const recipie = new Recipie({
				_id: new mongoose.Types.ObjectId(),
				recipieName: req.body.recipieName,
				recipieDescription_Text: req.body.recipieDescription_Text,
				recipieDescription_HTML: req.body.recipieDescription_HTML,
				recipieTotalTime: req.body.recipieTotalTime,
				recipieIngredients: req.body.recipieIngredients,
				recipieImage: req.body.recipieImage,
			});
			return recipie.save();
		})
		.then((result) => {
			console.log(result);
			res.status(201).json({
				message: "Recipie Created",
				createdRecipie: {
					...result._doc,
				},
			});
		})
		.catch((error) => {
			console.log(err);
			res.status(500).json({
				error: err,
			});
		});
});

router.delete("/remove/:id", authenticateJWTAdmin, (req, res, next) => {
	let id = req.params.id;
	Recipie.remove({ _id: id })
		.exec()
		.then((result) => {
			res.status(200).json({ message: "Recipie Deleted" });
		})
		.catch((err) => {
			console.log("Err", err);
			res.status(500).json({ message: "Server Error" });
		});
});
/* 
exports.orders_create = (req, res, next) => {
  Product.findById(req.body.productID)
    .exec()
    .then((product) => {
      if (!product) {
        return res.status(404).json({
          message: "Product Not Found",
        });
      }
      const orders = new Order({
        _id: new mongoose.Types.ObjectId(),
        quantity: req.body.quantity,
        product: req.body.productID,
      });
      return orders.save();
    })
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Order Stored",
        createdOrder: {
          _id: result._id,
          product: result.product,
          quantity: result.quantity,
        },
        request: {
          type: "GET",
          url: `http://localhost:3000/orders/${result._id}`,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
}; */
module.exports = router;

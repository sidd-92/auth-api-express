const mongoose = require("mongoose");

//Dependent Models
// 1. Images
// 2. Category
const recipieSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  recipieName: { type: String, required: true },
  recipieDescription: { type: String, required: true },
  recipieTotalTime: { type: String, required: true, default: "5 Min" },
  recipieIngredients: { type: Array, required: true },
  recipieImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Images",
    required: true,
  },
});

module.exports = mongoose.model("Recipies", recipieSchema);

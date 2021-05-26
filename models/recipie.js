const mongoose = require("mongoose");

//Dependent Models
// 1. Images
// 2. Category
const recipieSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  recipieName: { type: String, required: true },
  recipieDescription_HTML: { type: String },
  recipieDescription_Text: { type: String },
  recipieTotalTime: { type: String, default: "5 Min" },
  recipieIngredients: { type: Array, required: true },
  recipieImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Images",
  },
});

module.exports = mongoose.model("Recipies", recipieSchema);

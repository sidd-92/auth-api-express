const mongoose = require("mongoose");
const imageSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	caption: { type: String, required: true },
	url: { type: String, required: true },
	updatedAt: { type: Date, required: true },
	key: { type: String, required: true },
});

module.exports = mongoose.model("Images", imageSchema);

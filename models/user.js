const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	email: { type: String, required: true },
	password: { type: String, required: true },
	isAdmin: { type: Boolean, required: true, default: false },
	browserLoggedIn: { type: String, default: null },
	isLoggedIn: { type: Boolean, default: false },
	lastLoggedIn: { type: Date, default: null },
});

module.exports = mongoose.model("User", userSchema);

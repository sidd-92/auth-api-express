const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { authenticateJWTAdmin, authenticateJWT } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");

let refreshTokens = [];
const oAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "postmessage");
/**
 * Instead of specifying the type of client you'd like to use (JWT, OAuth2, etc)
 * this library will automatically choose the right client based on the environment.
 */

router.post("/auth/google", async (req, res) => {
	let jwtKey = process.env.NODE_ENV === "development" ? process.env.JWT_SECRET_DEV : process.env.JWT_SECRET_PROD;
	const tokens = await oAuth2Client.getToken(req.body.code); // exchange code for tokens
	const verify = oAuth2Client
		.verifyIdToken({
			idToken: tokens.tokens.id_token,
			audience: process.env.GOOGLE_CLIENT_ID,
		})
		.then((data) => {
			let details = data.getPayload();
			let userIsAdmin = false;
			//Find User with email in DB - create user if doesnt exist
			User.find({ email: details.email })
				.exec()
				.then((user) => {
					if (user.length < 1) {
						//Create New User in DB
						const user = new User({
							_id: new mongoose.Types.ObjectId(),
							email: details.email,
							password: null,
							isAdmin: false,
							googleSignUp: true,
						});
						user.save()
							.then((result) => {
								console.log("USER", result);
							})
							.catch((err) => {
								console.log(err);
								res.status(500).json({
									error: err,
								});
							});
					} else {
						// Get the Admin Details from DB
						userIsAdmin = user[0].isAdmin;
					}
				});
			//Sign JWT token
			const token = jwt.sign(
				{
					email: details.email,
					userID: details.sub,
					isAdmin: userIsAdmin,
				},
				jwtKey,
				{
					expiresIn: "2h",
				}
			);
			// create refresh token
			const refreshToken = jwt.sign(
				{
					email: details.email,
					userID: details.sub,
					isAdmin: userIsAdmin,
				},
				process.env.JWT_REFRESH_SECRET
			);
			refreshTokens.push(refreshToken);
			return res.status(200).json({
				message: "Auth Sucessfull",
				token: token,
				refreshToken: refreshToken,
			});
		})
		.catch((error) => {
			res.status(401).json({ err: error });
		});
});

/**
 * GET ALL USERS
 */
router.get("/all", authenticateJWTAdmin, (req, res, next) => {
	User.find()
		.exec()
		.then((user) => {
			return res.status(200).json({ users: user });
		})
		.catch((error) => {
			return res.status(404).json({ error: error });
		});
});

/**
 * GET SINGLE USER
 */
router.get("/all/:id", authenticateJWT, (req, res, next) => {
	let id = req.params.id;
	User.findById(id)
		.exec()
		.then((user) => {
			return res.status(200).json(user);
		})
		.catch((error) => {
			return res.status(404).json({ error: error });
		});
});

/**
 * Sign Up User ( NON - ADMIN )
 */
router.post("/signup", (req, res, next) => {
	/** Steps
	 * 1. First Find Whether Email Already Exists
	 * 2. If User Exists Send a Message that Email already Exists
	 * 3. Else Create a New User with Email and Hashed PWD
	 */

	User.find({ email: req.body.email })
		.exec()
		.then((user) => {
			if (user.length >= 1) {
				return res.status(409).json({
					message: "Email Already Exists",
				});
			} else {
				bcrypt.hash(req.body.password, 10, (err, hash) => {
					if (err) {
						return res.status(500).json({
							error: err,
						});
					} else {
						const user = new User({
							_id: new mongoose.Types.ObjectId(),
							email: req.body.email,
							password: hash,
							isAdmin: false,
						});
						user.save()
							.then((result) => {
								console.log("USER", result);
								res.status(201).json({
									message: "User Created",
								});
							})
							.catch((err) => {
								console.log(err);
								res.status(500).json({
									error: err,
								});
							});
					}
				});
			}
		});
});

/**
 * Add Admin User
 * 1. Find all users by email id
 * 2. If user is existing, update the existing user with admin as true
 * 3. If user doesn't exist then give an error to user that they need to sign up
 */

router.post("/add_admin", authenticateJWTAdmin, (req, res, next) => {
	User.findOneAndUpdate({ email: req.body.email }, { $set: { isAdmin: true } })
		.exec()
		.then((user) => {
			return res.status(201).json({ Message: "User is Updated" });
		})
		.catch((error) => {
			return res.status(409).json({
				message: "User doesn't exist, please sign up",
				error: error,
			});
		});
});

/**
 * DELETE USER
 */

router.delete("/remove/:id", authenticateJWTAdmin, (req, res, next) => {
	User.deleteOne({ _id: req.params.id })
		.exec()
		.then((user) => {
			return res.status(200).json({ message: "User Deleted", user });
		})
		.catch((error) => {
			return res.status(409).json({
				message: "User doesn't exist, please sign up",
				error: error,
			});
		});
});

/**
 * LOGIN USER
 */
router.post("/login", (req, res, next) => {
	User.find({ email: req.body.email })
		.exec()
		.then((user) => {
			console.log("USER LOGIN", user);
			let jwtKey =
				process.env.NODE_ENV === "development" ? process.env.JWT_SECRET_DEV : process.env.JWT_SECRET_PROD;

			if (user.length < 1) {
				return res.status(401).json({
					message: "Auth Failed",
				});
			}
			if (
				user[0].password == null ||
				user[0].password == "" ||
				req.body.password == null ||
				req.body.password == "" ||
				user[0].googleSignUp == true
			) {
				return res.status(401).json({
					message: "Auth Failed: Use Google Sign In ",
				});
			}
			bcrypt.compare(req.body.password, user[0].password, (err, result) => {
				if (err) {
					console.log("ERROR BCRYPT", err);
					return res.status(401).json({
						message: "Auth Failed",
						detail: err.message,
					});
				}
				if (result) {
					const token = jwt.sign(
						{
							email: user[0].email,
							userID: user[0]._id,
							isAdmin: user[0].isAdmin,
						},
						jwtKey,
						{
							expiresIn: "2h",
						}
					);

					const refreshToken = jwt.sign(
						{
							email: user[0].email,
							userID: user[0]._id,
							isAdmin: user[0].isAdmin,
						},
						process.env.JWT_REFRESH_SECRET
					);
					refreshTokens.push(refreshToken);
					return res.status(200).json({
						message: "Auth Sucessfull",
						token: token,
						refreshToken: refreshToken,
					});
				}
				return res.status(401).json({
					message: "Auth Failed",
				});
			});
		})
		.catch((err) => {
			console.log(err);
			res.status(500).json({
				error: err,
			});
		});
});

/**
 * DECODE JWT
 */
router.post("/decode", authenticateJWT, (req, res, next) => {
	const { token } = req.body;
	let jwtKey = process.env.NODE_ENV === "development" ? process.env.JWT_SECRET_DEV : process.env.JWT_SECRET_PROD;
	if (!token) {
		console.log("Not Token");
		return res.sendStatus(401);
	}
	jwt.verify(token, jwtKey, (err, user) => {
		if (err) {
			return res.status(403).json({ message: "Please Login Again As Token Has Expired" });
		}

		res.json({
			user,
		});
	});
});

/**
 * REFRESH TOKEN
 */
router.post("/token", (req, res) => {
	const { token } = req.body;
	let jwtKey = process.env.NODE_ENV === "development" ? process.env.JWT_SECRET_DEV : process.env.JWT_SECRET_PROD;
	if (!token) {
		return res.status(401).json({
			message: "JSON TOKEN NOT VALID",
		});
	}

	jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
		console.log("USER", user);
		if (err) {
			console.log("ERROR", JSON.stringify(err, null, 3));
			return res.status(403).json({
				message: err.message,
			});
		}

		const accessToken = jwt.sign(
			{
				email: user.email,
				userID: user.userID,
				isAdmin: user.isAdmin,
			},
			jwtKey,
			{ expiresIn: "2h" }
		);

		res.json({
			token: accessToken,
		});
	});
});

/**
 * LOGOUT USER
 */
router.post("/logout", (req, res) => {
	const { token } = req.body;
	refreshTokens = refreshTokens.filter((t) => t !== token);
	res.status(200).json({ message: "Logout successful" });
});

module.exports = router;

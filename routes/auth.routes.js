const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

// ℹ️ Handles password encryption
const jwt = require("jsonwebtoken");

// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Conexión a DB — se llama en cada handler para garantizar conexión en Vercel
const { connectDB } = require("../db");

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// POST /auth/signup  - Creates a new user in the database
router.post("/signup", async (req, res, next) => {
  try {
    await connectDB();

    const { email, password, name } = req.body;

    // Check if email or password or name are provided as empty strings
    if (email === "" || password === "" || name === "") {
      return res.status(400).json({ message: "Provide email, password and name" });
    }

    // This regular expression check that the email is of a valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Provide a valid email address." });
    }

    // This regular expression checks password for special characters and minimum length
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
      });
    }

    // Check the users collection if a user with the same email already exists
    const foundUser = await User.findOne({ email });

    if (foundUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // If email is unique, proceed to hash the password
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create the new user in the database
    const createdUser = await User.create({ email, password: hashedPassword, name });

    // Create a new object that doesn't expose the password
    const user = { email: createdUser.email, name: createdUser.name, _id: createdUser._id, role: createdUser.role };

    res.status(201).json({ user: user });
  } catch (err) {
    console.error("Error en signup:", err.message);
    next(err);
  }
});

// POST  /auth/login - Verifies email and password and returns a JWT
router.post("/login", async (req, res, next) => {
  try {
    await connectDB();

    const { email, password } = req.body;

    if (email === "" || password === "") {
      return res.status(400).json({ message: "Provide email and password." });
    }

    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      return res.status(401).json({ message: "User not found." });
    }

    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

    if (passwordCorrect) {
      const { _id, email, name, role } = foundUser;
      const payload = { _id, email, name, role };

      const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "6h",
      });

      res.status(200).json({ authToken: authToken });
    } else {
      res.status(401).json({ message: "Unable to authenticate the user" });
    }
  } catch (err) {
    console.error("Error en login:", err.message);
    next(err);
  }
});

// GET  /auth/verify  -  Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  console.log(`req.payload`, req.payload);
  res.status(200).json(req.payload);
});

module.exports = router;

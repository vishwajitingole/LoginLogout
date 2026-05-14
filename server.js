// server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();

// ===================================
// CORS
// ===================================

app.use(cors({
    origin: true,
    credentials: true,
}));

app.get("/docs", (req, res) => {
    res.sendFile(path.join(__dirname, "page.html"));
});

// ===================================
// MIDDLEWARE
// ===================================

app.use(express.json());

// ===================================
// SWAGGER CONFIG
// ===================================

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API",
            version: "1.0.0",
        },
    },
    apis: [path.join(__dirname, "server.js")],
};

const swaggerSpec = swaggerJsdoc(options);

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

// ===================================
// MONGODB
// ===================================

mongoose
    .connect(
        "mongodb+srv://invishwn:invishwn@cluster0.kmytaq4.mongodb.net/?appName=Cluster0"
    )
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.log(err);
    });

// ===================================
// USER SCHEMA
// ===================================

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model("User", userSchema);

// ===================================
// AUTH MIDDLEWARE
// ===================================

function isLoggedIn(req, res, next) {

    const token = req.headers.authorization;

    if (token !== "Bearer mytoken") {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    next();
}

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login User
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Login successful
 */

// ===================================
// LOGIN
// ===================================

app.post("/login", async(req, res) => {

    const { username, password } = req.body;

    const user = await User.findOne({
        username,
        password,
    });

    if (!user) {
        return res.status(401).json({
            message: "Invalid credentials",
        });
    }

    res.json({
        message: "Login Successful",
        token: "mytoken",
    });
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Protected Products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Success
 */

// ===================================
// PRODUCTS
// ===================================

app.get("/products", isLoggedIn, (req, res) => {

    res.json([{
            id: 1,
            name: "iPhone 15",
            price: 80000,
        },
        {
            id: 2,
            name: "Samsung S24",
            price: 70000,
        },
    ]);
});

/**
 * @swagger
 * /create-user:
 *   get:
 *     summary: Create Demo User
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User created
 */

// ===================================
// CREATE USER
// ===================================

app.get("/create-user", async(req, res) => {

    const existingUser = await User.findOne({
        username: "admin",
    });

    if (existingUser) {
        return res.json({
            message: "User already exists",
        });
    }

    const user = await User.create({
        username: "admin",
        password: "1234",
    });

    res.json(user);
});

// ===================================
// HOME
// ===================================

app.get("/", (req, res) => {
    res.json({
        message: "API Running",
    });
});

// ===================================
// EXPORT
// ===================================

module.exports = app;
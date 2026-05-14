// server.js

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");


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

// ===================================
// MIDDLEWARE
// ===================================

app.use(express.json());

app.use(
    session({
        secret: "secretkey",
        resave: false,
        saveUninitialized: false,
    })
);

// ===================================
// SWAGGER CONFIG
// ===================================

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Auth API",
            version: "1.0.0",
            description: "Login Logout API Documentation",
        },
        servers: [{
            url: "https://login-logout-alpha.vercel.app/api-docs/",
        }, ],
    },
    apis: ["./server.js"],
};

const swaggerSpec = swaggerJsdoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===================================
// MONGODB CLOUD CONNECTION
// ===================================

mongoose
    .connect(
        "mongodb+srv://invishwn:<db_password>@cluster0.kmytaq4.mongodb.net/?appName=Cluster0"
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
    if (!req.session.user) {
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */

// ===================================
// LOGIN API
// ===================================

app.post("/login", async(req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({
            username,
            password,
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }

        req.session.user = {
            id: user._id,
            username: user.username,
        };

        res.json({
            message: "Login Successful",
            user: req.session.user,
        });
    } catch (err) {
        res.status(500).json({
            message: "Server Error",
        });
    }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout User
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout successful
 */

// ===================================
// LOGOUT API
// ===================================

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                message: "Logout Failed",
            });
        }

        res.json({
            message: "Logout Successful",
        });
    });
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get Protected Products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Protected products data
 */

// ===================================
// PROTECTED PRODUCTS ROUTE
// ===================================

app.get("/products", isLoggedIn, (req, res) => {
    const products = [{
            id: 1,
            name: "iPhone 15",
            price: 80000,
        },
        {
            id: 2,
            name: "Samsung S24",
            price: 70000,
        },
        {
            id: 3,
            name: "MacBook Air",
            price: 120000,
        },
    ];

    res.json({
        message: "Protected Products Data",
        loggedInUser: req.session.user,
        products,
    });
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
 *         description: Demo user created
 */

// ===================================
// CREATE DEMO USER
// ===================================

app.get("/create-user", async(req, res) => {
    try {
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

        res.json({
            message: "User created",
            user,
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

// ===================================
// SERVER
// ===================================

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
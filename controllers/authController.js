const db = require("../config/db");
const bcrypt = require("bcrypt");
const e = require("express");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    const {username, name, email, password} = req.body;

    if (!username || !name || !email || !password) {
        return res.status(400).json({message: "All field are required" });
    }

    try {
        const [existing_user_email] = await db.query("SELECT id FROM users WHERE email = ? ", [email]);
        

        if (existing_user_email.length > 0) {
            return res.status(409).json({message: "Email already registered" });
        }
// Added comment
        const [existing_username] = await db.query("SELECT id FROM users WHERE username = ? ", [username]);

        if (existing_username.length > 0) {
            return res.status(409).json({message: "Username already registered" });
        }

         if (password.trim().length < 6) {
            return res.status(400).json({message: "password should contain morethan 6 characters"})
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO users (username, name, email, password) values (?, ?, ?, ?)",
            [username, name, email, hashedPassword]
        );

        res.status(201).json({message: "User registered successfully"});

    } catch(err) {
        console.error("register Error:", err);
        return res.status(500).json({message: "Server error"})        ;
    }
};

exports.login = async (req, res) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(400).json({message: "Email and password required" });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });

    res.status(200).json({
        message: "Login successful",
        token,
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            }
        });
    } catch(err) {
        console.error("Login Error", err);
        return res.status(500).json({message: "Server error"});
    }    
};
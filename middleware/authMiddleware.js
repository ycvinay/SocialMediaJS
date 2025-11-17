const jwt = require("jsonwebtoken");
const db = require("../config/db"); // Adjust path as needed to your DB connection

const authenticationToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. Token missing.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await db.query("SELECT id, username, email, avatar FROM users WHERE id = ?", [decoded.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        req.user = rows[0]; // Now req.user has id, username, email, avatar
        next();
    } catch (err) {
        console.error("Auth error:", err);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authenticationToken;

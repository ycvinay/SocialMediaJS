const db = require("../config/db");

exports.sendFriendRequest = async (req, res) => {
    const senderId = req.user.id;
    const { receiverId } = req.params;

    if (parseInt(senderId) === parseInt(receiverId)) {
        return res.status(400).json({ message: "You cannot send a request to yourself." });
    }

    try {
        // Check if they are already friends
        const [existingFriends] = await db.query(
            `
            SELECT * FROM friends 
            WHERE (user1_id = ? AND user2_id = ?) 
               OR (user1_id = ? AND user2_id = ?)
            `,
            [senderId, receiverId, receiverId, senderId]
        );

        if (existingFriends.length > 0) {
            return res.status(400).json({ message: "You are already friends." });
        }

        // Check if request already exists in either direction
        const [existingRequest] = await db.query(
            `
            SELECT * FROM friend_requests 
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
            `,
            [senderId, receiverId, receiverId, senderId]
        );

        if (existingRequest.length > 0) {
            return res.status(400).json({ message: "Friend request already sent or received." });
        }

        // Insert new friend request
        await db.query(
            `INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)`,
            [senderId, receiverId]
        );

        const [sender] = await db.query(`SELECT username FROM users WHERE id = ?`, [senderId]);

        await db.query(
            `INSERT INTO notifications (user_id, type, source_id, message) VALUES (?, 'friend_request', ?, ?)`,
            [
                receiverId,
                senderId,
                `${sender[0].username} sent you a friend request.`
            ]
        );

        res.status(201).json({ message: "Friend request sent." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


exports.respondToRequest = async (req, res) => {
    const receiverId = req.user.id;
    const {senderId, action} = req.body;

    if (!['accepted', 'rejected'].includes(action)) {
        return res.status(400).json({message: "Invalid action."});
    }

    try {

        const [request] = await db.query(
            `SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ?`, [senderId, receiverId]
        );

        if (request.length === 0) {
            return res.status(404).json({ message: "Friend request not found."});
        }

        await db.query(
            `UPDATE friend_requests SET status = ? WHERE sender_id = ? AND receiver_id = ?`,
            [action, senderId, receiverId]
        );

        if (action === 'accepted') {
            const [user1, user2] = [senderId, receiverId].sort((a, b) => a - b);
            await db.query(
                `INSERT IGNORE INTO friends (user1_id, user2_id) VALUES(?, ?)`,
            [user1, user2]
            );
        }

        await db.query(
            `DELETE FROM friend_requests WHERE sender_id = ? AND receiver_id = ?`,
            [senderId, receiverId]
        );

        res.status(200).json({ message: `Friend request ${action}`});

    } catch(err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
};  


exports.cancelRequest = async (req, res) => {
    const senderId = req.user.id;
    const receiverId = req.params.receiverId;

    try {
        const [existing] = await db.query(
            `SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`,
            [senderId, receiverId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "No pending request to cancel." });
        }

        await db.query(
            `DELETE FROM friend_requests WHERE sender_id = ? AND receiver_id = ?`,
            [senderId, receiverId]
        );

        res.status(200).json({ message: "Friend request cancelled successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
};


exports.getFriendRequests = async (req, res) => {
    const userId = req.user.id;
    try {
        const [requests] = await db.query(
            `SELECT fr.id, fr.sender_id, u.username,u.name, u.avatar, fr.status, fr.created_at
            FROM friend_requests fr
            JOIN users u ON fr.sender_id = u.id
            WHERE fr.receiver_id = ? AND fr.status = 'pending'
            ORDER BY fr.created_at DESC`,
            [userId]
        );

        res.status(200).json(requests);
    } catch(err) {
        console.error("Get friend requests error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

exports.getFriends = async (req, res) => {
    const userId = req.user.id;

    try {
        const [friends] = await db.query(
            `SELECT u.id, u.username, u.name, u.avatar
             FROM friends f
             JOIN users u ON 
                (u.id = f.user1_id AND f.user2_id = ?) OR 
                (u.id = f.user2_id AND f.user1_id = ?)
             WHERE u.id != ?`,
            [userId, userId, userId]
        );
        

        res.status(200).json(friends);
    } catch (err) {
        console.error("Get friends error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


exports.removeFriend = async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.params;

    try {

        const [request] = await db.query(
            `SELECT * FROM friends
        WHERE (user1_id = ? AND user2_id = ?) OR
                (user2_id = ? AND user1_id = ?)`,
        [userId, friendId, friendId, userId]
        );

        if (request.length === 0) {
            return res.status(404).json({ message: "You both are not friends."});
        }

        await db.query(
            `DELETE FROM friends
             WHERE (user1_id = ? AND user2_id = ?) OR
                   (user2_id = ? AND user1_id = ?)`,
            [userId, friendId, friendId, userId]
        );


        await db.query(
            `
        DELETE FROM friend_requests
        WHERE (sender_id = ? AND receiver_id = ?) OR
                (receiver_id = ? AND sender_id = ?)`,
        [userId, friendId, friendId, userId]
        );

        res.status(200).json({ message: "Freind removed successfully"});
    } catch(err) {
        console.error("Removed friend error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
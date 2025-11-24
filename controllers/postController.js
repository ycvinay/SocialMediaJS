const db = require("../config/db");
const path = require('path');
const fs = require('fs');

exports.createPost = async (req, res) => {
    const userId = req.user.id;
    const { content } = req.body;
    const image = req.file ? req.file.filename : null;

    try {
        // Insert the post into the database
        const [result] = await db.query(
            'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)', 
            [userId, content, image]
        );

        // Optional: Fetch the inserted post if needed for response
        const [post] = await db.query(`
            SELECT 
                p.id, p.content, p.image, p.created_at, 
                u.username, u.avatar, u.bio
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [result.insertId]);

        res.status(201).json({ 
            message: 'Post created successfully',
            post: post[0] // sending the created post data (optional)
        });
    } catch (err) {
        console.error('Create post error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getFeedPosts = async (req, res) => {
    const userId = req.user.id;

    try {
        const [posts] = await db.query(
            `SELECT 
               posts.id, posts.content, posts.image, posts.created_at,
               users.username, users.avatar, users.name,
               (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) AS likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comments_count,
               (SELECT COUNT(*) FROM likes WHERE post_id = posts.id AND user_id = ?) AS liked_by_user
             FROM posts
             JOIN users ON posts.user_id = users.id
             WHERE posts.user_id = ? 
                OR posts.user_id IN 
                    (SELECT user2_id 
                     FROM friends 
                     WHERE user1_id = ? 
                     UNION
                     SELECT user1_id 
                     FROM friends 
                     WHERE user2_id = ?)
             ORDER BY posts.created_at DESC
             LIMIT 10`,
            [userId, userId, userId, userId]  // params: userId for likes_count and friend check
        );

        res.status(200).json(posts);
    } catch (err) {
        console.error('Fetch feed error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.editPost = async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.params;
    const { content } = req.body;
    const image = req.file ? req.file.filename : null;

    try {
        const [post] = await db.query('SELECT * FROM posts WHERE id = ?', [postId]);
        if (post.length === 0) return res.status(404).json({ message: 'Post not found' });
        if (post[0].user_id !== userId) return res.status(403).json({ message: 'Unauthorized' });

        let updateQuery = 'UPDATE posts SET ';
        const params = [];

        if (content) {
            updateQuery += 'content = ?, ';
            params.push(content);
        }

        if (image) {
            // Optionally delete old image file
            const oldImagePath = `uploads/posts/${post[0].image}`;
            if (post[0].image && fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }

            updateQuery += 'image = ?, ';
            params.push(image);
        }

        updateQuery = updateQuery.slice(0, -2); // Remove trailing comma
        updateQuery += ' WHERE id = ?';
        params.push(postId);

        await db.query(updateQuery, params);
        res.status(200).json({ message: 'Post updated successfully' });

    } catch (err) {
        console.error('Edit post error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserPosts = async (req, res) => {
    const userId = req.user.id;

    try {
        const [posts] = await db.query(
            `SELECT 
               posts.id, posts.content, posts.image, posts.created_at,
               users.username, users.avatar, users.name,
               (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) AS likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comments_count,
               (SELECT COUNT(*) FROM likes WHERE post_id = posts.id AND user_id = ?) AS liked_by_user
             FROM posts
             JOIN users ON posts.user_id = users.id
             WHERE posts.user_id = ? 
             ORDER BY posts.created_at DESC
             LIMIT 10`,
            [userId, userId]  // params: userId for likes_count and fetching only user's posts
        );

        res.status(200).json(posts);
    } catch (err) {
        console.error('Fetch user posts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getOtherUserPosts = async (req, res) => {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    try {
        const [posts] = await db.query(
            `SELECT 
               posts.id, posts.content, posts.image, posts.created_at,
               users.username, users.avatar, users.name,
               (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) AS likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comments_count,
               EXISTS (
                 SELECT 1 FROM likes 
                 WHERE post_id = posts.id AND user_id = ?
               ) AS liked_by_user
             FROM posts
             JOIN users ON posts.user_id = users.id
             WHERE posts.user_id = ?
             ORDER BY posts.created_at DESC
             LIMIT 10`,
            [currentUserId, targetUserId]
        );

        res.status(200).json(posts);
    } catch (err) {
        console.error('Fetch other user posts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};



exports.deletePost = async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.params;

    try {
        const [existing_post] = await db.query("SELECT * FROM posts WHERE id = ? AND user_id = ?", [postId, userId]);
        

        if (existing_post.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (existing_post[0].image) {
            const imagePath = path.join(__dirname, '..', 'uploads', 'posts', existing_post[0].image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await db.query(`DELETE FROM posts WHERE id = ?`, [postId]);

        res.status(200).json({ message: "Post deleted successfully" });

    } catch (err) {
        console.error("Delete post error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


exports.likePost = async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.body;

    try {
        // Step 1: Check if the user has already liked the post
        const [existing] = await db.query(
            'SELECT * FROM likes WHERE post_id = ? AND user_id = ?', 
            [postId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'You already liked this post.' });
        }

        // Step 2: Insert the like into the database
        await db.query(
            `INSERT INTO likes (post_id, user_id) VALUES (?, ?)`, [postId, userId]
        );

        const [post] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);

        if (post.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const postOwnerId = post[0].user_id;

        if (postOwnerId !== userId) {
            const notifyMsg = `${req.user.username} ❤️ liked your post!`;
          
            await db.query(
              `INSERT INTO notifications (user_id, type, source_id, message)
               VALUES (?, 'like', ?, ?)`,
              [postOwnerId, postId, notifyMsg]
            );
          }
          

        res.status(200).json({ message: 'Post liked successfully.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.unlikePost = async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.body;

    try {
        const [existing] = await db.query(
            'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existing.length === 0) {
            return res.status(400).json({ message: 'You have not liked this post.' });
        }

        const [post] = await db.query(
            'SELECT user_id FROM posts WHERE id = ?',
            [postId]
        );

        if (post.length === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const postOwnerId = post[0].user_id;

        await db.query(
            'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        await db.query(
            'DELETE FROM notifications WHERE type = ? AND user_id = ? AND source_id = ?',
            ['like', postOwnerId, postId]
        );

        res.status(200).json({ message: 'Post unliked.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUsersWhoLiked = async (req, res) => {
    const postId = req.params.postId;

    try {
        const [users] = await db.query(
            `SELECT u.id, u.username, u.name, u.avatar 
             FROM likes l JOIN users u ON l.user_id = u.id 
             WHERE l.post_id = ?`,
            [postId]
        );

        res.status(200).json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addComment = async (req, res) => {
    const userId = req.user.id;
    const { postId, comment } = req.body;

    try {
        await db.query(
            `INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)`,
            [postId, userId, comment]
        );

        // Get post owner
        const [post] = await db.query(
            `SELECT user_id FROM posts WHERE id = ?`,
            [postId]
        );

        if (post.length > 0 && post[0].user_id !== userId) {
            const postOwnerId = post[0].user_id;

            const [user] = await db.query(
                `SELECT username FROM users WHERE id = ?`,
                [userId]
            );

            const username = user[0]?.username || 'Someone';
            
            if (postOwnerId !== userId) {
                await db.query(
                  `INSERT INTO notifications (user_id, type, source_id, message)
                   VALUES (?, 'comment', ?, ?)`,
                  [postOwnerId, postId, `${req.user.username} 💬 commented on your post.`]
                );
              }
              
        }

        res.status(201).json({ message: "Comment added successfully." });
    } catch (err) {
        console.error("Add comment error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getComments = async (req, res) => {
    const { postId } = req.params;

    try {
        const [comments] = await db.query(
            `SELECT c.*, u.username, u.avatar 
             FROM comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.post_id = ? ORDER BY c.created_at DESC`,
            [postId]
        );
        res.status(200).json(comments);
    } catch (err) {
        console.error("Fetch comments error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getLikes = async (req, res) => {
    const { postId } = req.params;

    try {
        const [likes] = await db.query(
            `SELECT l.*, u.username, u.avatar 
             FROM likes l 
             JOIN users u ON l.user_id = u.id 
             WHERE l.post_id = ? ORDER BY l.created_at DESC`,
            [postId]
        );
        res.status(200).json({ likes });
    } catch (err) {
        console.error("Fetch likes error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                n.message, 
                n.created_at, 
                u.username, 
                u.avatar 
             FROM notifications n
             JOIN users u ON n.source_id = u.id
             WHERE n.user_id = ?
             ORDER BY n.created_at DESC`,
            [req.user.id]
        );

        // Map to include image path
        const notifications = rows.map(row => ({
            message: row.message,
            createdAt: row.created_at,
            username: row.username,
            avatar: `/uploads/${row.profile_image}`
        }));

        res.status(200).json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch notifications.' });
    }
};




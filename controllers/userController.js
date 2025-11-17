const db = require('../config/db');

exports.getMyProfile = async (req, res) => {
    try {
        const id = req.user.id;
        const [rows] = await db.query('SELECT id, name, email, avatar, bio FROM users WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
          }
        res.status(200).json({user: rows[0]});


    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ message: 'Server error' });
      }
};

// Route: /api/user/profile (GET)
exports.getOtherUserProfile = async (req, res) => {
  const currentUserId = req.user.id;
  const { userId } = req.params; // The ID of the user being viewed

  try {
    // 1. Fetch user profile
    const [userRows] = await db.query(
      `SELECT id, username, email, avatar, bio FROM users WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // 2. Check if current user is already friends
    const [friendCheck] = await db.query(
      `SELECT * FROM friends 
       WHERE (user1_id = ? AND user2_id = ?) 
          OR (user1_id = ? AND user2_id = ?)`,
      [currentUserId, userId, userId, currentUserId]
    );

    const isFriend = friendCheck.length > 0;

    // 3. Check if a friend request exists between users
    const [requestStatus] = await db.query(
      `SELECT sender_id, receiver_id, status 
       FROM friend_requests 
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)`,
      [currentUserId, userId, userId, currentUserId]
    );

    let isRequestSent = false;
    let hasIncomingRequest = false;

    if (requestStatus.length > 0) {
      const request = requestStatus[0];
      if (request.status === 'pending') {
        if (request.sender_id === currentUserId) {
          isRequestSent = true;
        } else if (request.receiver_id === currentUserId) {
          hasIncomingRequest = true;
        }
      }
    }

    // 4. Count total friends for this profile user
    const [friendCountResult] = await db.query(
      `SELECT COUNT(*) AS friendCount 
       FROM friends 
       WHERE user1_id = ? OR user2_id = ?`,
      [userId, userId]
    );

    const friendCount = friendCountResult[0].friendCount;

    // 5. Get posts by the user
    // const [posts] = await db.query(
    //   `SELECT id, content, image, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC`,
    //   [userId]
    // );

    // 6. Respond with all data
    res.status(200).json({
      user,
      isFriend,
      isRequestSent,
      hasIncomingRequest,
      friendCount,
      // posts
    });

  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error while fetching profile." });
  }
};


exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const {name, username, bio } = req.body;
    const avatar = req.file ? req.file.filename: null;

    try {
        if (username) {
            const [existing_user] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
            if (existing_user.length > 0) {
                return res.status(400).json({ message: 'Username is already taken' });
              }
        }
        let query = 'UPDATE users SET ';
        const params = [];

        if (name) {
            query += 'name = ?, ';
            params.push(name);
        }

        if (username) {
            query += 'username = ?, ';
            params.push(username);
        }

        if (bio) {
            query += 'bio = ?, ';
            params.push(bio);
        }

        if (avatar) {
            query += 'avatar = ?, ';
            params.push(avatar);
        }

        query = query.slice(0, -2);
        query += 'WHERE id = ?';
        params.push(userId);

        await db.query(query, params);

        const [rows] = await db.query(
            'SELECT id, name, username, bio, avatar FROM users WHERE id = ?',
            [userId]
          );
          const updatedUser = rows[0];
      
          res.status(200).json({
            message: 'Profile updated successfully',
            profile: updatedUser,
          });
    } catch(err){
        console.error('Update error:', err);
    res.status(500).json({ message: 'Server error' });
    }
};

exports.searchByUsername = async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim() == "") {
        return res.status(400).json({ message: "Search query is required."});
    }

    try {
        const [results] = await db.query(
            `SELECT id, username, avatar, bio 
             FROM users 
             WHERE username LIKE ?`,
            [`%${query}%`]
          );
      
          res.status(200).json(results);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ message: "Server error while searching." });
      }
};


// Add this route to your `friends.js` or `user.js` route file

// Fetch users who are not friends with the current user
exports.explore =  async (req, res) => {
    const userId = req.user.id;  // The current logged-in user

    // Set a limit for the number of users to fetch (e.g., 10 users)
    const limit = 10;

    try {
        // Get users who are not in the friend list and exclude the current user
        const [users] = await db.query(
            `
            SELECT 
                u.id, 
                u.name, 
                u.username, 
                u.avatar, 
                u.bio, 
                IFNULL(fr.status, 'none') AS requestStatus
            FROM users u
            LEFT JOIN friend_requests fr 
                ON (fr.sender_id = ? AND fr.receiver_id = u.id) 
                OR (fr.sender_id = u.id AND fr.receiver_id = ?)
            WHERE u.id != ?
            AND u.id NOT IN (
                SELECT user2_id FROM friends WHERE user1_id = ?
                UNION
                SELECT user1_id FROM friends WHERE user2_id = ?
            )
            LIMIT ?
            `,
            [userId, userId, userId, userId, userId, limit]
        );

        // Add 'isRequestSent' field based on the request status
        users.forEach(user => {
            if (user.requestStatus === 'pending') {
                user.isRequestSent = true;
            } else {
                user.isRequestSent = false;
            }
        });

        res.status(200).json({ users });
    } catch (err) {
        console.error("Error fetching non-friend users:", err);
        res.status(500).json({ message: "Server error" });
    }
};
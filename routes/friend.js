const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const friendController = require('../controllers/friendController');

router.post('/send-request/:receiverId', auth, friendController.sendFriendRequest);
router.post('/respond-request', auth, friendController.respondToRequest);
router.delete('/cancel-request/:receiverId', auth, friendController.cancelRequest);

router.get('/requests', auth, friendController.getFriendRequests);
router.get('/list', auth, friendController.getFriends);
router.delete('/remove/:friendId', auth, friendController.removeFriend);

module.exports = router;
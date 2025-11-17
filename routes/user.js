const express = require('express');
const router = express.Router();
const multer = require("multer");
const auth = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const postController = require("../controllers/postController");

const storage = multer.diskStorage({
    destination: (req, res, cb) => cb(null, 'uploads/avatars'),
    filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({storage});



router.get('/me', auth, userController.getMyProfile);
router.get('/profile/:userId', auth, userController.getOtherUserProfile);
router.put('/update-profile', auth, upload.single('avatar'), userController.updateProfile);
router.get('/notifications', auth, postController.getNotifications);
router.get('/search',  userController.searchByUsername);
router.get('/explore', auth, userController.explore);

module.exports = router;


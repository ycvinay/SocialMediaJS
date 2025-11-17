const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');

const postDir = path.join(__dirname, '..', 'uploads', 'posts');
if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, {recursive: true});
}

const storage = multer.diskStorage({
    destination: (req, res, cb) => cb(null, "uploads/posts"),
    filename: (req, file, cb) => cb(null, Date.now()+ '_' + file.originalname),
});

const upload = multer({storage});

router.post('/create', auth, upload.single('image'), postController.createPost);
router.put("/edit/:postId", auth, upload.single('image'),postController.editPost);
router.delete('/delete/:postId', auth, postController.deletePost)

router.get('/feed', auth, postController.getFeedPosts);
router.get('/myPosts', auth, postController.getUserPosts);

router.get('/user/posts/:id', auth, postController.getOtherUserPosts);

router.post('/like', auth, postController.likePost);
router.post('/unlike', auth, postController.unlikePost);
router.get('/:postId/liked-users', postController.getUsersWhoLiked);

router.post("/comments/add", auth, postController.addComment);
router.get("/comments/:postId",auth, postController.getComments);
router.get("/likes/:postId", auth, postController.getLikes);

module.exports = router;

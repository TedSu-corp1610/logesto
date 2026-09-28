const express = require('express');

const router = express.Router();

const ChatController =
    require('../controllers/chatController');

const { auth } =
    require('../middleware/auth');

router.get(
    '/chat',
    auth,
    ChatController.index
);

router.get(
    '/chat/conversation/:userId',
    auth,
    ChatController.conversation
);

module.exports = router;
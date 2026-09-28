const express = require('express');

const router = express.Router();

const ProfileController =
    require('../controllers/profileController');

const { auth } =
    require('../middleware/auth');

router.get(
    '/profile',
    auth,
    ProfileController.index
);

router.post(
    '/profile',
    auth,
    ProfileController.update
);

router.post(
    '/profile/password',
    auth,
    ProfileController.updatePassword
);

module.exports = router;
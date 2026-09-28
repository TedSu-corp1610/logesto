const express = require('express');
const router = express.Router();

const DashboardController =
    require('../controllers/dashboardController');

const { auth } =
    require('../middleware/auth');

router.get(
    '/dashboard',
    auth,
    DashboardController.index
);

module.exports = router;
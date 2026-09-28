const express = require('express');

const router = express.Router();

const StockController =
    require('../controllers/stockController');

const { auth } = require('../middleware/auth');
const {
    requirePermission
} = require('../middleware/requirePermission');

router.get(
    '/stock',
    auth,
    requirePermission('stock.view'),
    StockController.index
);

router.get(
    '/stock/movement',
    auth,
    requirePermission('stock.manage'),
    StockController.movementForm
);

router.post(
    '/stock/movement',
    auth,
    requirePermission('stock.manage'),
    StockController.movement
);

module.exports = router;
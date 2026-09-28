const express = require('express');

const router = express.Router();

const StockTransferController =
    require('../controllers/stockTransferController');

const { auth } =
    require('../middleware/auth');

const {
    requirePermission
} = require('../middleware/requirePermission');

router.get(
    '/stock-transfers',
    auth,
    requirePermission('stock.transfers.view'),
    StockTransferController.index
);

router.get(
    '/stock-transfers/create',
    auth,
    requirePermission('stock.transfers.manage'),
    StockTransferController.createForm
);

router.post(
    '/stock-transfers/create',
    auth,
    requirePermission('stock.transfers.manage'),
    StockTransferController.create
);

router.post(
    '/stock-transfers/:id/complete',
    auth,
    requirePermission('stock.transfers.manage'),
    StockTransferController.complete
);

router.post(
    '/stock-transfers/:id/cancel',
    auth,
    requirePermission('stock.transfers.manage'),
    StockTransferController.cancel
);

module.exports = router;
const express = require('express');

const router = express.Router();

const InventoryController =
    require('../controllers/inventoryController');

const { auth } =
    require('../middleware/auth');

const {
    requirePermission
} = require('../middleware/requirePermission');

router.get(
    '/inventory',
    auth,
    requirePermission('stock.inventory'),
    InventoryController.index
);

router.get(
    '/inventory/create',
    auth,
    requirePermission('stock.inventory'),
    InventoryController.createForm
);

router.post(
    '/inventory/create',
    auth,
    requirePermission('stock.inventory'),
    InventoryController.create
);

router.get(
    '/inventory/:id/count',
    auth,
    requirePermission('stock.inventory'),
    InventoryController.countForm
);

router.post(
    '/inventory/:id/items/:itemId',
    auth,
    requirePermission('stock.inventory'),
    InventoryController.updateCount
);

router.post(
    '/inventory/:id/complete',
    auth,
    requirePermission('stock.inventory'),
    InventoryController.complete
);

router.post(
    '/inventory/:id/cancel',
    auth,
    requirePermission('stock.inventory'),
    InventoryController.cancel
);

module.exports = router;
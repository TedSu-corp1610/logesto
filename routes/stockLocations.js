const express = require('express');

const router = express.Router();

const StockLocationController =
    require('../controllers/stockLocationController');

const { auth } =
    require('../middleware/auth');
 
const { requirePermission } =
    require('../middleware/requirePermission');


router.get(
    '/stock-locations',
    auth,
    requirePermission('locations.view'),
    StockLocationController.index
);


router.get(
    '/stock-locations/create',
    auth,
    requirePermission('locations.manage'),
    StockLocationController.createForm
);


router.post(
    '/stock-locations/create',
    auth,
    requirePermission('locations.manage'),
    StockLocationController.create
);


router.get(
    '/stock-locations/:id/edit',
    auth,
    requirePermission('locations.manage'),
    StockLocationController.editForm
);


router.post(
    '/stock-locations/:id/edit',
    auth,
    requirePermission('locations.manage'),
    StockLocationController.update
);


router.post(
    '/stock-locations/:id/delete',
    auth,
    requirePermission('locations.manage'),
    StockLocationController.delete
);


module.exports = router;
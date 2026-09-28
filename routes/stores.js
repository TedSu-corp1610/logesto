const express = require('express');

const router = express.Router();

const StoreController =
    require('../controllers/storeController');

const { auth } =
    require('../middleware/auth');

const { requirePermission } =
    require('../middleware/requirePermission');


router.get(
    '/stores',
    auth,
    //requirePermission('stores.view'),
    StoreController.index
);


router.get(
    '/stores/create',
    auth,
    requirePermission('stores.manage'),
    StoreController.createForm
);


router.post(
    '/stores/create',
    auth,
    requirePermission('stores.manage'),
    StoreController.create
);


router.get(
    '/stores/:id/edit',
    auth,
    requirePermission('stores.manage'),
    StoreController.editForm
);


router.post(
    '/stores/:id/edit',
    auth,
    requirePermission('stores.manage'),
    StoreController.update
);


router.post(
    '/stores/:id/delete',
    auth,
    requirePermission('stores.manage'),
    StoreController.delete
);


module.exports = router;
const express = require('express');

const router = express.Router();

const SupplierController =
    require('../controllers/supplierController');

const { auth } = require('../middleware/auth');
const {
    requirePermission
} = require('../middleware/requirePermission');

router.get(
    '/suppliers',
    auth,
    requirePermission('suppliers.view'),
    SupplierController.index
);

router.get(
    '/suppliers/create',
    auth,
    requirePermission('suppliers.manage'),
    SupplierController.createForm
);

router.post(
    '/suppliers/create',
    auth,
    requirePermission('suppliers.manage'),
    SupplierController.create
);

router.get(
    '/suppliers/:id/edit',
    auth,
    requirePermission('suppliers.manage'),
    SupplierController.editForm
);

router.post(
    '/suppliers/:id/edit',
    auth,
    requirePermission('suppliers.manage'),
    SupplierController.update
);

router.post(
    '/suppliers/:id/delete',
    auth,
    requirePermission('suppliers.manage'),
    SupplierController.delete
);

module.exports = router;
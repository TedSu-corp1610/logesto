const express = require('express');

const router = express.Router();

const PermissionController =
    require('../controllers/permissionController');

const { auth } =
    require('../middleware/auth');

const { requirePermission } =
    require('../middleware/requirePermission');


router.get(
    '/permissions',
    auth,
    requirePermission('permissions.view'),
    PermissionController.index
);


router.get(
    '/permissions/create',
    auth,
    requirePermission('permissions.manage'),
    PermissionController.createForm
);


router.post(
    '/permissions/create',
    auth,
    requirePermission('permissions.manage'),
    PermissionController.create
);


router.get(
    '/permissions/:id/edit',
    auth,
    requirePermission('permissions.manage'),
    PermissionController.editForm
);


router.post(
    '/permissions/:id/edit',
    auth,
    requirePermission('permissions.manage'),
    PermissionController.update
);


router.post(
    '/permissions/:id/delete',
    auth,
    requirePermission('permissions.manage'),
    PermissionController.delete
);


module.exports = router;
const express = require('express');

const router = express.Router();

const RoleController =
    require('../controllers/roleController');

const { auth } =
    require('../middleware/auth');

const { requirePermission } =
    require('../middleware/requirePermission');


router.get(
    '/roles',
    auth,
    requirePermission('roles.view'),
    RoleController.index
);


router.get(
    '/roles/create',
    auth,
    requirePermission('roles.manage'),
    RoleController.createForm
);


router.post(
    '/roles/create',
    auth,
    requirePermission('roles.manage'),
    RoleController.create
);


router.get(
    '/roles/:id/edit',
    auth,
    requirePermission('roles.manage'),
    RoleController.editForm
);


router.post(
    '/roles/:id/edit',
    auth,
    requirePermission('roles.manage'),
    RoleController.update
);


router.post(
    '/roles/:id/delete',
    auth,
    requirePermission('roles.manage'),
    RoleController.delete
);


module.exports = router;
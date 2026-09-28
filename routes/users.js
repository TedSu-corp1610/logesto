const express = require('express');

const router = express.Router();

const UserController = require(
    '../controllers/userController'
);

const { auth } = require('../middleware/auth');

const {
    requirePermission
} = require('../middleware/requirePermission');


router.get(
    '/users',
    auth,
    requirePermission('users.view'),
    UserController.index
);


router.get(
    '/users/create',
    auth,
    requirePermission('users.create'),
    UserController.showCreate
);


router.post(
    '/users',
    auth,
    requirePermission('users.create'),
    UserController.create
);


router.get(
    '/users/:id/edit',
    auth,
    requirePermission('users.edit'),
    UserController.showEdit
);


router.post(
    '/users/:id/edit',
    auth,
    requirePermission('users.edit'),
    UserController.update
);


router.post(
    '/users/:id/delete',
    auth,
    requirePermission('users.delete'),
    UserController.delete
);


module.exports = router;
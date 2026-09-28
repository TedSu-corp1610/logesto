const express = require('express');

const router = express.Router();

const CategoryController = require('../controllers/categoryController');

const { auth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');

router.get(
    '/categories',
    auth,
    requirePermission('categories.view'),
    CategoryController.index
);

router.get(
    '/categories/create',
    auth,
    requirePermission('categories.manage'),
    CategoryController.createForm
);

router.post(
    '/categories/create',
    auth,
    requirePermission('categories.manage'),
    CategoryController.create
);

router.get(
    '/categories/:id/edit',
    auth,
    requirePermission('categories.manage'),
    CategoryController.editForm
);

router.post(
    '/categories/:id/edit',
    auth,
    requirePermission('categories.manage'),
    CategoryController.update
);

router.post(
    '/categories/:id/delete',
    auth,
    requirePermission('categories.manage'),
    CategoryController.delete
);

module.exports = router;
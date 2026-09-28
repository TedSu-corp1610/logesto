const express = require('express');

const router = express.Router();

const ProductController =
    require('../controllers/productController');

const { auth } = require('../middleware/auth');
const {
    requirePermission
} = require('../middleware/requirePermission');

router.get(
    '/products',
    auth,
    requirePermission('products.view'),
    ProductController.index
);

router.get(
    '/products/create',
    auth,
    requirePermission('products.manage'),
    ProductController.createForm
);

router.post(
    '/products/create',
    auth,
    requirePermission('products.manage'),
    ProductController.create
);

router.get(
    '/products/:id/edit',
    auth,
    requirePermission('products.manage'),
    ProductController.editForm
);

router.post(
    '/products/:id/edit',
    auth,
    requirePermission('products.manage'),
    ProductController.update
);

router.post(
    '/products/:id/delete',
    auth,
    requirePermission('products.manage'),
    ProductController.delete
);

module.exports = router;
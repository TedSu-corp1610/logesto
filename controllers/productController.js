const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');

class ProductController {
    static index(req, res) {
        Product.findAll((err, products) => {
            if (err) {
                console.error(
                    'Erreur chargement produits:',
                    err
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message: 'Impossible de charger les produits.'
                });
            }

            res.render('products/index', {
                title: 'Produits',
                products
            });
        });
    }

    static createForm(req, res) {
        Category.findAll((categoryErr, categories) => {
            if (categoryErr) {
                console.error(
                    'Erreur chargement catégories:',
                    categoryErr
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de charger les catégories.'
                });
            }

            Supplier.findAll((supplierErr, suppliers) => {
                if (supplierErr) {
                    console.error(
                        'Erreur chargement fournisseurs:',
                        supplierErr
                    );

                    return res.status(500).render('error', {
                        title: 'Erreur',
                        message:
                            'Impossible de charger les fournisseurs.'
                    });
                }

                res.render('products/create', {
                    title: 'Nouveau produit',
                    categories,
                    suppliers
                });
            });
        });
    }

    static create(req, res) {
        const categoryId =
            req.body.category_id
                ? Number(req.body.category_id)
                : null;

        const sku = String(req.body.sku || '')
            .trim()
            .toUpperCase();

        const name = String(req.body.name || '').trim();

        const description = String(
            req.body.description || ''
        ).trim();

        const purchasePrice = Number(
            req.body.purchase_price || 0
        );

        const salePrice = Number(
            req.body.sale_price || 0
        );

        const minimumStock = Number(
            req.body.minimum_stock || 0
        );

        const unit = String(
            req.body.unit || 'piece'
        ).trim();

        const supplierIds = Array.isArray(
            req.body.supplier_ids
        )
            ? req.body.supplier_ids
            : req.body.supplier_ids
                ? [req.body.supplier_ids]
                : [];

        const form = {
            category_id: categoryId,
            sku,
            name,
            description,
            purchase_price: purchasePrice,
            sale_price: salePrice,
            minimum_stock: minimumStock,
            unit,
            supplier_ids: supplierIds
        };

        if (!sku || !name) {
            return ProductController.renderCreateError(
                res,
                'Le SKU et le nom du produit sont obligatoires.',
                form
            );
        }

        if (
            !Number.isFinite(purchasePrice) ||
            purchasePrice < 0
        ) {
            return ProductController.renderCreateError(
                res,
                'Le prix d’achat doit être un nombre positif ou nul.',
                form
            );
        }

        if (
            !Number.isFinite(salePrice) ||
            salePrice < 0
        ) {
            return ProductController.renderCreateError(
                res,
                'Le prix de vente doit être un nombre positif ou nul.',
                form
            );
        }

        if (
            !Number.isFinite(minimumStock) ||
            minimumStock < 0
        ) {
            return ProductController.renderCreateError(
                res,
                'Le stock minimum doit être un nombre positif ou nul.',
                form
            );
        }

        Product.findBySku(sku, (err, existingProduct) => {
            if (err) {
                console.error(
                    'Erreur vérification SKU:',
                    err
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de vérifier le SKU.'
                });
            }

            if (existingProduct) {
                return ProductController.renderCreateError(
                    res,
                    'Ce SKU existe déjà.',
                    form
                );
            }

            Product.create(
                categoryId,
                sku,
                name,
                description,
                purchasePrice,
                salePrice,
                minimumStock,
                unit,
                (createErr, product) => {
                    if (createErr) {
                        console.error(
                            'Erreur création produit:',
                            createErr
                        );

                        return res.status(500).render('error', {
                            title: 'Erreur',
                            message:
                                'Impossible de créer le produit.'
                        });
                    }

                    Product.setSuppliers(
                        product.id,
                        supplierIds,
                        setSupplierErr => {
                            if (setSupplierErr) {
                                console.error(
                                    'Erreur association fournisseurs:',
                                    setSupplierErr
                                );

                                return res.status(500).render(
                                    'error',
                                    {
                                        title: 'Erreur',
                                        message:
                                            'Le produit a été créé, mais ses fournisseurs n’ont pas pu être associés.'
                                    }
                                );
                            }

                            res.redirect('/products');
                        }
                    );
                }
            );
        });
    }

    static renderCreateError(res, error, form) {
        Category.findAll((categoryErr, categories) => {
            if (categoryErr) {
                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de charger les catégories.'
                });
            }

            Supplier.findAll((supplierErr, suppliers) => {
                if (supplierErr) {
                    return res.status(500).render('error', {
                        title: 'Erreur',
                        message:
                            'Impossible de charger les fournisseurs.'
                    });
                }

                return res.status(400).render(
                    'products/create',
                    {
                        title: 'Nouveau produit',
                        error,
                        form,
                        categories,
                        suppliers
                    }
                );
            });
        });
    }

    static editForm(req, res) {
        const { id } = req.params;

        Product.findById(id, (err, product) => {
            if (err) {
                console.error(
                    'Erreur chargement produit:',
                    err
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de charger le produit.'
                });
            }

            if (!product) {
                return res.status(404).render('error', {
                    title: 'Produit introuvable',
                    message:
                        'Ce produit n’existe pas.'
                });
            }

            Category.findAll(
                (categoryErr, categories) => {
                    if (categoryErr) {
                        return res.status(500).render(
                            'error',
                            {
                                title: 'Erreur',
                                message:
                                    'Impossible de charger les catégories.'
                            }
                        );
                    }

                    Supplier.findAll(
                        (supplierErr, suppliers) => {
                            if (supplierErr) {
                                return res.status(500).render(
                                    'error',
                                    {
                                        title: 'Erreur',
                                        message:
                                            'Impossible de charger les fournisseurs.'
                                    }
                                );
                            }

                            Product.getSupplierIds(
                                id,
                                (
                                    supplierIdsErr,
                                    supplierIds
                                ) => {
                                    if (supplierIdsErr) {
                                        return res
                                            .status(500)
                                            .render(
                                                'error',
                                                {
                                                    title:
                                                        'Erreur',
                                                    message:
                                                        'Impossible de charger les fournisseurs du produit.'
                                                }
                                            );
                                    }

                                    product.supplier_ids =
                                        supplierIds;

                                    res.render(
                                        'products/edit',
                                        {
                                            title:
                                                'Modifier le produit',
                                            product,
                                            categories,
                                            suppliers
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    }

    static update(req, res) {
        const { id } = req.params;

        const categoryId =
            req.body.category_id
                ? Number(req.body.category_id)
                : null;

        const sku = String(req.body.sku || '')
            .trim()
            .toUpperCase();

        const name = String(req.body.name || '').trim();

        const description = String(
            req.body.description || ''
        ).trim();

        const purchasePrice = Number(
            req.body.purchase_price || 0
        );

        const salePrice = Number(
            req.body.sale_price || 0
        );

        const minimumStock = Number(
            req.body.minimum_stock || 0
        );

        const unit = String(
            req.body.unit || 'piece'
        ).trim();

        const status =
            req.body.status === 'inactive'
                ? 'inactive'
                : 'active';

        const supplierIds = Array.isArray(
            req.body.supplier_ids
        )
            ? req.body.supplier_ids
            : req.body.supplier_ids
                ? [req.body.supplier_ids]
                : [];

        const product = {
            id,
            category_id: categoryId,
            sku,
            name,
            description,
            purchase_price: purchasePrice,
            sale_price: salePrice,
            minimum_stock: minimumStock,
            unit,
            status,
            supplier_ids: supplierIds
        };

        if (!sku || !name) {
            return ProductController.renderEditError(
                res,
                'Le SKU et le nom du produit sont obligatoires.',
                product
            );
        }

        if (
            !Number.isFinite(purchasePrice) ||
            purchasePrice < 0
        ) {
            return ProductController.renderEditError(
                res,
                'Le prix d’achat doit être un nombre positif ou nul.',
                product
            );
        }

        if (
            !Number.isFinite(salePrice) ||
            salePrice < 0
        ) {
            return ProductController.renderEditError(
                res,
                'Le prix de vente doit être un nombre positif ou nul.',
                product
            );
        }

        if (
            !Number.isFinite(minimumStock) ||
            minimumStock < 0
        ) {
            return ProductController.renderEditError(
                res,
                'Le stock minimum doit être un nombre positif ou nul.',
                product
            );
        }

        Product.findBySku(sku, (err, existingProduct) => {
            if (err) {
                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de vérifier le SKU.'
                });
            }

            if (
                existingProduct &&
                String(existingProduct.id) !== String(id)
            ) {
                return ProductController.renderEditError(
                    res,
                    'Un autre produit utilise déjà ce SKU.',
                    product
                );
            }

            Product.update(
                id,
                categoryId,
                sku,
                name,
                description,
                purchasePrice,
                salePrice,
                minimumStock,
                unit,
                status,
                updateErr => {
                    if (updateErr) {
                        console.error(
                            'Erreur modification produit:',
                            updateErr
                        );

                        return res.status(500).render(
                            'error',
                            {
                                title: 'Erreur',
                                message:
                                    'Impossible de modifier le produit.'
                            }
                        );
                    }

                    Product.setSuppliers(
                        id,
                        supplierIds,
                        supplierErr => {
                            if (supplierErr) {
                                console.error(
                                    'Erreur association fournisseurs:',
                                    supplierErr
                                );

                                return res.status(500).render(
                                    'error',
                                    {
                                        title: 'Erreur',
                                        message:
                                            'Le produit a été modifié, mais ses fournisseurs n’ont pas pu être enregistrés.'
                                    }
                                );
                            }

                            res.redirect('/products');
                        }
                    );
                }
            );
        });
    }

    static renderEditError(res, error, product) {
        Category.findAll((categoryErr, categories) => {
            if (categoryErr) {
                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de charger les catégories.'
                });
            }

            Supplier.findAll((supplierErr, suppliers) => {
                if (supplierErr) {
                    return res.status(500).render('error', {
                        title: 'Erreur',
                        message:
                            'Impossible de charger les fournisseurs.'
                    });
                }

                return res.status(400).render(
                    'products/edit',
                    {
                        title: 'Modifier le produit',
                        error,
                        product,
                        categories,
                        suppliers
                    }
                );
            });
        });
    }

    static delete(req, res) {
        const { id } = req.params;

        Product.delete(id, err => {
            if (err) {
                console.error(
                    'Erreur suppression produit:',
                    err
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de supprimer le produit.'
                });
            }

            res.redirect('/products');
        });
    }
}

module.exports = ProductController;
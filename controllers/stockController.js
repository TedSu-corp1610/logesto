const Stock = require('../models/Stock');
const Product = require('../models/Product');
const StockLocation = require('../models/StockLocation');
const StockService = require('../services/stockService');

class StockController {
    static index(req, res) {
        Stock.findAll((err, stocks) => {
            if (err) {
                console.error(
                    'Erreur chargement stocks:',
                    err
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de charger les stocks.'
                });
            }

            res.render('stock/index', {
                title: 'Stocks',
                stocks
            });
        });
    }

    static movementForm(req, res) {
        Product.findAll((productErr, products) => {
            if (productErr) {
                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de charger les produits.'
                });
            }

            StockLocation.findAll(
                (locationErr, locations) => {
                    if (locationErr) {
                        return res.status(500).render(
                            'error',
                            {
                                title: 'Erreur',
                                message:
                                    'Impossible de charger les emplacements.'
                            }
                        );
                    }

                    res.render('stock/movement', {
                        title: 'Mouvement de stock',
                        products,
                        locations
                    });
                }
            );
        });
    }

    static movement(req, res) {
        const productId = Number(
            req.body.product_id
        );

        const locationId = Number(
            req.body.location_id
        );

        const type = String(
            req.body.type || ''
        ).toUpperCase();

        const quantity = Number(
            req.body.quantity
        );

        const reason = String(
            req.body.reason || ''
        ).trim();

        const reference = String(
            req.body.reference || ''
        ).trim();

        const userId = req.session.user
            ? req.session.user.id
            : null;

        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {
            return StockController.movementError(
                req,
                res,
                'Produit invalide.'
            );
        }

        if (
            !Number.isInteger(locationId) ||
            locationId <= 0
        ) {
            return StockController.movementError(
                req,
                res,
                'Emplacement invalide.'
            );
        }

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            return StockController.movementError(
                req,
                res,
                'La quantité doit être supérieure à zéro.'
            );
        }

        if (!['IN', 'OUT'].includes(type)) {
            return StockController.movementError(
                req,
                res,
                'Type de mouvement invalide.'
            );
        }

        const operation =
            type === 'IN'
                ? StockService.stockIn.bind(
                      StockService
                  )
                : StockService.stockOut.bind(
                      StockService
                  );

        operation(
            productId,
            locationId,
            quantity,
            reason,
            reference,
            userId,
            err => {
                if (err) {
                    console.error(
                        'Erreur mouvement stock:',
                        err
                    );

                    return StockController.movementError(
                        req,
                        res,
                        err.message
                    );
                }

                res.redirect('/stock');
            }
        );
    }

    static movementError(req, res, error) {
        Product.findAll((productErr, products) => {
            if (productErr) {
                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de charger les produits.'
                });
            }

            StockLocation.findAll(
                (locationErr, locations) => {
                    if (locationErr) {
                        return res.status(500).render(
                            'error',
                            {
                                title: 'Erreur',
                                message:
                                    'Impossible de charger les emplacements.'
                            }
                        );
                    }

                    return res.status(400).render(
                        'stock/movement',
                        {
                            title: 'Mouvement de stock',
                            error,
                            products,
                            locations,
                            form: req.body
                        }
                    );
                }
            );
        });
    }
}

module.exports = StockController;
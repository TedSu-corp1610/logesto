const Product = require('../models/Product');
const StockLocation = require('../models/StockLocation');
const StockTransfer = require('../models/StockTransfer');
const StockService = require('../services/stockService');

function generateReference() {
    const timestamp = Date.now();
    const random = Math.floor(
        1000 + Math.random() * 9000
    );

    return `TRF-${timestamp}-${random}`;
}

class StockTransferController {
    static index(req, res) {
        StockTransfer.findAll((err, transfers) => {
            if (err) {
                console.error(
                    'Erreur chargement transferts:',
                    err
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de charger les transferts.'
                });
            }

            res.render('stockTransfers/index', {
                title: 'Transferts de stock',
                transfers
            });
        });
    }

    static createForm(req, res) {
        Product.findAll((productErr, products) => {
            if (productErr) {
                console.error(
                    'Erreur chargement produits:',
                    productErr
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de charger les produits.'
                });
            }

            StockLocation.findAll(
                (locationErr, locations) => {
                    if (locationErr) {
                        console.error(
                            'Erreur chargement localisations:',
                            locationErr
                        );

                        return res.status(500).render(
                            'error',
                            {
                                title: 'Erreur',
                                message:
                                    'Impossible de charger les localisations.'
                            }
                        );
                    }

                    res.render(
                        'stockTransfers/create',
                        {
                            title:
                                'Nouveau transfert',
                            products,
                            locations,
                            error: null
                        }
                    );
                }
            );
        });
    }

    static create(req, res) {
        const productId = Number(
            req.body.product_id
        );

        const sourceLocationId = Number(
            req.body.source_location_id
        );

        const destinationLocationId = Number(
            req.body.destination_location_id
        );

        const quantity = Number(
            req.body.quantity
        );

        const reason = (
            req.body.reason || ''
        ).trim();

        if (
            !productId ||
            !sourceLocationId ||
            !destinationLocationId
        ) {
            return StockTransferController.renderCreateError(
                req,
                res,
                'Veuillez sélectionner le produit, la source et la destination.'
            );
        }

        if (
            sourceLocationId === destinationLocationId
        ) {
            return StockTransferController.renderCreateError(
                req,
                res,
                'La source et la destination doivent être différentes.'
            );
        }

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            return StockTransferController.renderCreateError(
                req,
                res,
                'La quantité doit être supérieure à zéro.'
            );
        }

        Product.findById(
            productId,
            (productErr, product) => {
                if (productErr) {
                    console.error(
                        'Erreur produit:',
                        productErr
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de vérifier le produit.'
                        }
                    );
                }

                if (!product) {
                    return StockTransferController.renderCreateError(
                        req,
                        res,
                        'Produit introuvable.'
                    );
                }

                StockLocation.findById(
                    sourceLocationId,
                    (sourceErr, source) => {
                        if (sourceErr) {
                            console.error(
                                'Erreur localisation source:',
                                sourceErr
                            );

                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de vérifier la localisation source.'
                                }
                            );
                        }

                        if (!source) {
                            return StockTransferController.renderCreateError(
                                req,
                                res,
                                'Localisation source introuvable.'
                            );
                        }

                        StockLocation.findById(
                            destinationLocationId,
                            (
                                destinationErr,
                                destination
                            ) => {
                                if (destinationErr) {
                                    console.error(
                                        'Erreur localisation destination:',
                                        destinationErr
                                    );

                                    return res
                                        .status(500)
                                        .render(
                                            'error',
                                            {
                                                title:
                                                    'Erreur',
                                                message:
                                                    'Impossible de vérifier la localisation destination.'
                                            }
                                        );
                                }

                                if (!destination) {
                                    return StockTransferController.renderCreateError(
                                        req,
                                        res,
                                        'Localisation destination introuvable.'
                                    );
                                }

                                if (
                                    source.status !==
                                    'active'
                                ) {
                                    return StockTransferController.renderCreateError(
                                        req,
                                        res,
                                        'La localisation source est inactive.'
                                    );
                                }

                                if (
                                    destination.status !==
                                    'active'
                                ) {
                                    return StockTransferController.renderCreateError(
                                        req,
                                        res,
                                        'La localisation destination est inactive.'
                                    );
                                }

                                const reference =
                                    generateReference();

                                StockTransfer.create(
                                    reference,
                                    productId,
                                    sourceLocationId,
                                    destinationLocationId,
                                    quantity,
                                    reason,
                                    req.session.user.id,
                                    err => {
                                        if (err) {
                                            console.error(
                                                'Erreur création transfert:',
                                                err
                                            );

                                            return StockTransferController.renderCreateError(
                                                req,
                                                res,
                                                'Impossible de créer le transfert.'
                                            );
                                        }

                                        res.redirect(
                                            '/stock-transfers'
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    static complete(req, res) {
        const transferId = Number(
            req.params.id
        );

        if (!transferId) {
            return res.status(400).render('error', {
                title: 'Erreur',
                message: 'Transfert invalide.'
            });
        }

        StockService.transfer(
            transferId,
            req.session.user.id,
            err => {
                if (err) {
                    console.error(
                        'Erreur validation transfert:',
                        err
                    );

                    return res.status(400).render(
                        'error',
                        {
                            title:
                                'Transfert impossible',
                            message: err.message
                        }
                    );
                }

                res.redirect('/stock-transfers');
            }
        );
    }

    static cancel(req, res) {
        const transferId = Number(
            req.params.id
        );

        if (!transferId) {
            return res.status(400).render('error', {
                title: 'Erreur',
                message: 'Transfert invalide.'
            });
        }

        StockService.cancelTransfer(
            transferId,
            err => {
                if (err) {
                    console.error(
                        'Erreur annulation transfert:',
                        err
                    );

                    return res.status(400).render(
                        'error',
                        {
                            title:
                                'Annulation impossible',
                            message: err.message
                        }
                    );
                }

                res.redirect('/stock-transfers');
            }
        );
    }

    static renderCreateError(
        req,
        res,
        error
    ) {
        Product.findAll(
            (productErr, products) => {
                if (productErr) {
                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de charger les produits.'
                        }
                    );
                }

                StockLocation.findAll(
                    (locationErr, locations) => {
                        if (locationErr) {
                            return res
                                .status(500)
                                .render(
                                    'error',
                                    {
                                        title:
                                            'Erreur',
                                        message:
                                            'Impossible de charger les localisations.'
                                    }
                                );
                        }

                        res.status(400).render(
                            'stockTransfers/create',
                            {
                                title:
                                    'Nouveau transfert',
                                products,
                                locations,
                                error
                            }
                        );
                    }
                );
            }
        );
    }
}

module.exports = StockTransferController;
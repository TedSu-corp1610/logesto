const Inventory =
    require('../models/Inventory');

const StockLocation =
    require('../models/StockLocation');

const StockService =
    require('../services/stockService');

const db =
    require('../config/database');

function generateReference() {
    return `INV-${Date.now()}-${
        Math.floor(
            1000 + Math.random() * 9000
        )
    }`;
}

class InventoryController {
    static index(req, res) {
        Inventory.findAll(
            (err, inventories) => {
                if (err) {
                    console.error(
                        'Erreur chargement inventaires:',
                        err
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de charger les inventaires.'
                        }
                    );
                }

                res.render(
                    'inventory/index',
                    {
                        title: 'Inventaires',
                        inventories
                    }
                );
            }
        );
    }

    static createForm(req, res) {
        StockLocation.findAll(
            (err, locations) => {
                if (err) {
                    console.error(
                        'Erreur chargement localisations:',
                        err
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
                    'inventory/create',
                    {
                        title:
                            'Nouvel inventaire',
                        locations,
                        error: null
                    }
                );
            }
        );
    }

    static create(req, res) {
        const locationId =
            Number(
                req.body.location_id
            );

        if (!locationId) {
            return InventoryController
                .renderCreateError(
                    req,
                    res,
                    'Veuillez sélectionner une localisation.'
                );
        }

        StockLocation.findById(
            locationId,
            (locationErr, location) => {
                if (locationErr) {
                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de vérifier la localisation.'
                        }
                    );
                }

                if (!location) {
                    return InventoryController
                        .renderCreateError(
                            req,
                            res,
                            'Localisation introuvable.'
                        );
                }

                if (
                    location.status !== 'active'
                ) {
                    return InventoryController
                        .renderCreateError(
                            req,
                            res,
                            'Cette localisation est inactive.'
                        );
                }
                Inventory.findDraftByLocation(
                    locationId,
                    (inventoryErr, existingInventory) => {
                        if (inventoryErr) {
                            console.error(
                                'Erreur vérification inventaire:',
                                inventoryErr
                            );

                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de vérifier les inventaires en cours.'
                                }
                            );
                        }

                        if (existingInventory) {
                            return InventoryController
                                .renderCreateError(
                                    req,
                                    res,
                                    `Un inventaire est déjà en cours pour cette localisation (${existingInventory.reference}).`
                                );
                        }

                        const reference = generateReference();

                        Inventory.create(
                            reference,
                            locationId,
                            req.session.user.id,
                            (
                                inventoryErr,
                                inventory
                            ) => {
                                if (inventoryErr) {
                                    console.error(
                                        'Erreur création inventaire:',
                                        inventoryErr
                                    );

                                    return InventoryController
                                        .renderCreateError(
                                            req,
                                            res,
                                            'Impossible de créer l’inventaire.'
                                        );
                                }

                                /*
                                * On capture le stock théorique
                                * au moment de la création.
                                */

                                db.all(
                                    `
                                        SELECT
                                            p.id AS product_id,
                                            COALESCE(
                                                s.quantity,
                                                0
                                            ) AS quantity

                                        FROM products p

                                        LEFT JOIN stocks s
                                            ON s.product_id = p.id
                                            AND s.location_id = ?

                                        WHERE p.status = 'active'

                                        ORDER BY p.name ASC
                                    `,
                                    [locationId],
                                    (
                                        stockErr,
                                        products
                                    ) => {
                                        if (stockErr) {
                                            console.error(
                                                'Erreur capture stock:',
                                                stockErr
                                            );

                                            return res.status(
                                                500
                                            ).render(
                                                'error',
                                                {
                                                    title:
                                                        'Erreur',
                                                    message:
                                                        'Impossible de préparer les lignes de l’inventaire.'
                                                }
                                            );
                                        }

                                        if (
                                            !products.length
                                        ) {
                                            return res.redirect(
                                                `/inventory/${inventory.id}/count`
                                            );
                                        }

                                        db.serialize(() => {
                                            const stmt =
                                                db.prepare(
                                                    `
                                                        INSERT INTO stock_inventory_items (
                                                            inventory_id,
                                                            product_id,
                                                            theoretical_quantity,
                                                            counted_quantity,
                                                            difference
                                                        )
                                                        VALUES (?, ?, ?, 0, ?)
                                                    `
                                                );

                                            let firstError =
                                                null;

                                            products.forEach(
                                                product => {
                                                    stmt.run(
                                                        [
                                                            inventory.id,
                                                            product.product_id,
                                                            product.quantity,
                                                            -product.quantity
                                                        ],
                                                        err => {
                                                            if (
                                                                err &&
                                                                !firstError
                                                            ) {
                                                                firstError =
                                                                    err;
                                                            }
                                                        }
                                                    );
                                                }
                                            );

                                            stmt.finalize(
                                                err => {
                                                    if (
                                                        err
                                                    ) {
                                                        return res
                                                            .status(
                                                                500
                                                            )
                                                            .render(
                                                                'error',
                                                                {
                                                                    title:
                                                                        'Erreur',
                                                                    message:
                                                                        'Impossible de créer les lignes de l’inventaire.'
                                                                }
                                                            );
                                                    }

                                                    if (
                                                        firstError
                                                    ) {
                                                        return res
                                                            .status(
                                                                500
                                                            )
                                                            .render(
                                                                'error',
                                                                {
                                                                    title:
                                                                        'Erreur',
                                                                    message:
                                                                        'Impossible de créer les lignes de l’inventaire.'
                                                                }
                                                            );
                                                    }

                                                    res.redirect(
                                                        `/inventory/${inventory.id}/count`
                                                    );
                                                }
                                            );
                                        });
                                    }
                                );
                            }
                        );
                    }
                );

                
            }
        );
    }

    static countForm(req, res) {
        const inventoryId =
            Number(req.params.id);

        Inventory.findById(
            inventoryId,
            (err, inventory) => {
                if (err) {
                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de charger l’inventaire.'
                        }
                    );
                }

                if (!inventory) {
                    return res.status(404).render(
                        'error',
                        {
                            title: 'Introuvable',
                            message:
                                'Inventaire introuvable.'
                        }
                    );
                }

                Inventory.findItems(
                    inventoryId,
                    (
                        itemsErr,
                        items
                    ) => {
                        if (itemsErr) {
                            return res
                                .status(500)
                                .render(
                                    'error',
                                    {
                                        title:
                                            'Erreur',
                                        message:
                                            'Impossible de charger les produits de l’inventaire.'
                                    }
                                );
                        }

                        res.render(
                            'inventory/count',
                            {
                                title:
                                    'Comptage inventaire',
                                inventory,
                                items,
                                error: null
                            }
                        );
                    }
                );
            }
        );
    }

    static updateCount(req, res) {
        const inventoryId =
            Number(req.params.id);

        const itemId =
            Number(req.params.itemId);

        const countedQuantity =
            Number(
                req.body.counted_quantity
            );

        if (
            !Number.isFinite(
                countedQuantity
            ) ||
            countedQuantity < 0
        ) {
            return InventoryController
                .renderCountError(
                    req,
                    res,
                    'La quantité comptée doit être supérieure ou égale à zéro.'
                );
        }

        Inventory.findById(
            inventoryId,
            (inventoryErr, inventory) => {
                if (inventoryErr) {
                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de vérifier l’inventaire.'
                        }
                    );
                }

                if (!inventory) {
                    return res.status(404).render(
                        'error',
                        {
                            title: 'Introuvable',
                            message:
                                'Inventaire introuvable.'
                        }
                    );
                }

                if (
                    inventory.status !==
                    'DRAFT'
                ) {
                    return res.status(400).render(
                        'error',
                        {
                            title:
                                'Inventaire verrouillé',
                            message:
                                'Cet inventaire n’est plus modifiable.'
                        }
                    );
                }

                Inventory.updateItem(
                    itemId,
                    countedQuantity,
                    err => {
                        if (err) {
                            console.error(
                                'Erreur mise à jour comptage:',
                                err
                            );

                            return InventoryController
                                .renderCountError(
                                    req,
                                    res,
                                    'Impossible d’enregistrer le comptage.'
                                );
                        }

                        res.redirect(
                            `/inventory/${inventoryId}/count`
                        );
                    }
                );
            }
        );
    }

    static complete(req, res) {
        const inventoryId =
            Number(req.params.id);

        StockService.completeInventory(
            inventoryId,
            req.session.user.id,
            err => {
                if (err) {
                    console.error(
                        'Erreur validation inventaire:',
                        err
                    );

                    return res.status(400).render(
                        'error',
                        {
                            title:
                                'Validation impossible',
                            message:
                                err.message
                        }
                    );
                }

                res.redirect(
                    '/inventory'
                );
            }
        );
    }

    static cancel(req, res) {
        const inventoryId =
            Number(req.params.id);

        Inventory.markCancelled(
            inventoryId,
            err => {
                if (err) {
                    console.error(
                        'Erreur annulation inventaire:',
                        err
                    );

                    return res.status(400).render(
                        'error',
                        {
                            title:
                                'Annulation impossible',
                            message:
                                'Impossible d’annuler cet inventaire.'
                        }
                    );
                }

                res.redirect(
                    '/inventory'
                );
            }
        );
    }

    static renderCreateError(
        req,
        res,
        error
    ) {
        StockLocation.findAll(
            (err, locations) => {
                if (err) {
                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de charger les localisations.'
                        }
                    );
                }

                res.status(400).render(
                    'inventory/create',
                    {
                        title:
                            'Nouvel inventaire',
                        locations,
                        error
                    }
                );
            }
        );
    }

    static renderCountError(
        req,
        res,
        error
    ) {
        const inventoryId =
            Number(req.params.id);

        Inventory.findById(
            inventoryId,
            (inventoryErr, inventory) => {
                if (inventoryErr) {
                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de charger l’inventaire.'
                        }
                    );
                }

                Inventory.findItems(
                    inventoryId,
                    (
                        itemsErr,
                        items
                    ) => {
                        if (itemsErr) {
                            return res
                                .status(500)
                                .render(
                                    'error',
                                    {
                                        title:
                                            'Erreur',
                                        message:
                                            'Impossible de charger les lignes de l’inventaire.'
                                    }
                                );
                        }

                        res.status(400).render(
                            'inventory/count',
                            {
                                title:
                                    'Comptage inventaire',
                                inventory,
                                items,
                                error
                            }
                        );
                    }
                );
            }
        );
    }
}

module.exports = InventoryController;
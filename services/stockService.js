const db = require('../config/database');
const StockTransfer = require('../models/StockTransfer');

class StockService {
    /**
     * Récupère la ligne de stock d'un produit
     * pour un emplacement.
     */
    static getStock(productId, locationId, callback) {
        const sql = `
            SELECT
                s.*,
                p.sku,
                p.name AS product_name,
                p.unit,
                sl.name AS location_name,
                sl.code AS location_code,
                st.name AS store_name
            FROM stocks s
            INNER JOIN products p
                ON p.id = s.product_id
            INNER JOIN stock_locations sl
                ON sl.id = s.location_id
            INNER JOIN stores st
                ON st.id = sl.store_id
            WHERE s.product_id = ?
              AND s.location_id = ?
        `;

        db.get(
            sql,
            [productId, locationId],
            (err, stock) => {
                if (err) return callback(err);
                callback(null, stock);
            }
        );
    }

    /**
     * Crée la ligne de stock si elle n'existe pas.
     */
    static ensureStock(
        productId,
        locationId,
        callback
    ) {
        const sql = `
            INSERT OR IGNORE INTO stocks (
                product_id,
                location_id,
                quantity
            )
            VALUES (?, ?, 0)
        `;

        db.run(
            sql,
            [productId, locationId],
            err => {
                if (err) return callback(err);
                callback(null);
            }
        );
    }

    /**
     * Vérifie que le produit et l'emplacement existent.
     */
    static validateProductAndLocation(
        productId,
        locationId,
        callback
    ) {
        const sql = `
            SELECT
                p.id AS product_id,
                p.name AS product_name,
                p.sku,
                p.unit,
                sl.id AS location_id,
                sl.name AS location_name,
                sl.status AS location_status
            FROM products p
            CROSS JOIN stock_locations sl
            WHERE p.id = ?
              AND sl.id = ?
        `;

        db.get(
            sql,
            [productId, locationId],
            (err, row) => {
                if (err) return callback(err);

                if (!row) {
                    return callback(
                        new Error(
                            'Produit ou emplacement introuvable.'
                        )
                    );
                }

                if (row.location_status !== 'active') {
                    return callback(
                        new Error(
                            'Cet emplacement est inactif.'
                        )
                    );
                }

                callback(null, row);
            }
        );
    }

    /**
     * Effectue une entrée de stock.
     */
    static stockIn(
        productId,
        locationId,
        quantity,
        reason,
        reference,
        userId,
        callback
    ) {
        StockService.checkInventoryLock(
            locationId,
            err => {
                if (err) {
                    return callback(err);
                }

                if (!Number.isFinite(quantity) || quantity <= 0) {
                    return callback(
                        new Error(
                            'La quantité doit être supérieure à zéro.'
                        )
                    );
                }

                this.validateProductAndLocation(
                    productId,
                    locationId,
                    (validationErr, product) => {
                        if (validationErr) {
                            return callback(validationErr);
                        }

                        this.ensureStock(
                            productId,
                            locationId,
                            ensureErr => {
                                if (ensureErr) {
                                    return callback(ensureErr);
                                }

                                db.serialize(() => {
                                    db.run('BEGIN TRANSACTION');

                                    db.run(
                                        `
                                            UPDATE stocks
                                            SET
                                                quantity = quantity + ?,
                                                updated_at = CURRENT_TIMESTAMP
                                            WHERE product_id = ?
                                            AND location_id = ?
                                        `,
                                        [
                                            quantity,
                                            productId,
                                            locationId
                                        ],
                                        updateErr => {
                                            if (updateErr) {
                                                return db.run(
                                                    'ROLLBACK',
                                                    () =>
                                                        callback(updateErr)
                                                );
                                            }

                                            db.run(
                                                `
                                                    INSERT INTO stock_movements (
                                                        product_id,
                                                        location_id,
                                                        type,
                                                        quantity,
                                                        reason,
                                                        reference,
                                                        user_id
                                                    )
                                                    VALUES (
                                                        ?,
                                                        ?,
                                                        'IN',
                                                        ?,
                                                        ?,
                                                        ?,
                                                        ?
                                                    )
                                                `,
                                                [
                                                    productId,
                                                    locationId,
                                                    quantity,
                                                    reason || null,
                                                    reference || null,
                                                    userId || null
                                                ],
                                                movementErr => {
                                                    if (movementErr) {
                                                        return db.run(
                                                            'ROLLBACK',
                                                            () =>
                                                                callback(
                                                                    movementErr
                                                                )
                                                        );
                                                    }

                                                    db.run(
                                                        'COMMIT',
                                                        commitErr => {
                                                            if (commitErr) {
                                                                return callback(
                                                                    commitErr
                                                                );
                                                            }

                                                            callback(null, {
                                                                product,
                                                                type: 'IN',
                                                                quantity
                                                            });
                                                        }
                                                    );
                                                }
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

    /**
     * Effectue une sortie de stock.
     */
    static stockOut(
        productId,
        locationId,
        quantity,
        reason,
        reference,
        userId,
        callback
    ) {
        StockService.checkInventoryLock(
            locationId,
            err => {
                if (err) {
                    return callback(err);
                }
        
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    return callback(
                        new Error(
                            'La quantité doit être supérieure à zéro.'
                        )
                    );
                }

                this.validateProductAndLocation(
                    productId,
                    locationId,
                    (validationErr, product) => {
                        if (validationErr) {
                            return callback(validationErr);
                        }

                        this.ensureStock(
                            productId,
                            locationId,
                            ensureErr => {
                                if (ensureErr) {
                                    return callback(ensureErr);
                                }

                                db.serialize(() => {
                                    db.run('BEGIN TRANSACTION');

                                    db.get(
                                        `
                                            SELECT quantity
                                            FROM stocks
                                            WHERE product_id = ?
                                            AND location_id = ?
                                        `,
                                        [
                                            productId,
                                            locationId
                                        ],
                                        (stockErr, stock) => {
                                            if (stockErr) {
                                                return db.run(
                                                    'ROLLBACK',
                                                    () =>
                                                        callback(stockErr)
                                                );
                                            }

                                            if (
                                                !stock ||
                                                Number(stock.quantity) <
                                                    quantity
                                            ) {
                                                return db.run(
                                                    'ROLLBACK',
                                                    () =>
                                                        callback(
                                                            new Error(
                                                                'Stock insuffisant pour effectuer cette sortie.'
                                                            )
                                                        )
                                                );
                                            }

                                            db.run(
                                                `
                                                    UPDATE stocks
                                                    SET
                                                        quantity = quantity - ?,
                                                        updated_at = CURRENT_TIMESTAMP
                                                    WHERE product_id = ?
                                                    AND location_id = ?
                                                `,
                                                [
                                                    quantity,
                                                    productId,
                                                    locationId
                                                ],
                                                updateErr => {
                                                    if (updateErr) {
                                                        return db.run(
                                                            'ROLLBACK',
                                                            () =>
                                                                callback(
                                                                    updateErr
                                                                )
                                                        );
                                                    }

                                                    db.run(
                                                        `
                                                            INSERT INTO stock_movements (
                                                                product_id,
                                                                location_id,
                                                                type,
                                                                quantity,
                                                                reason,
                                                                reference,
                                                                user_id
                                                            )
                                                            VALUES (
                                                                ?,
                                                                ?,
                                                                'OUT',
                                                                ?,
                                                                ?,
                                                                ?,
                                                                ?
                                                            )
                                                        `,
                                                        [
                                                            productId,
                                                            locationId,
                                                            quantity,
                                                            reason || null,
                                                            reference || null,
                                                            userId || null
                                                        ],
                                                        movementErr => {
                                                            if (
                                                                movementErr
                                                            ) {
                                                                return db.run(
                                                                    'ROLLBACK',
                                                                    () =>
                                                                        callback(
                                                                            movementErr
                                                                        )
                                                                );
                                                            }

                                                            db.run(
                                                                'COMMIT',
                                                                commitErr => {
                                                                    if (
                                                                        commitErr
                                                                    ) {
                                                                        return callback(
                                                                            commitErr
                                                                        );
                                                                    }

                                                                    callback(
                                                                        null,
                                                                        {
                                                                            product,
                                                                            type: 'OUT',
                                                                            quantity
                                                                        }
                                                                    );
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
                        );
                    }
                );
            }
        );
    }

    /**
     * Effectue un ajustement de stock.
     *
     * quantity représente la quantité finale souhaitée.
     */
    static adjustStock(
        productId,
        locationId,
        quantity,
        reason,
        reference,
        userId,
        callback
    ) {
        StockService.checkInventoryLock(
            locationId,
            err => {
                if (err) {
                    return callback(err);
                }
        
                if (!Number.isFinite(quantity) || quantity < 0) {
                    return callback(
                        new Error(
                            'La quantité doit être supérieure ou égale à zéro.'
                        )
                    );
                }

                this.validateProductAndLocation(
                    productId,
                    locationId,
                    (validationErr, product) => {
                        if (validationErr) {
                            return callback(validationErr);
                        }

                        this.ensureStock(
                            productId,
                            locationId,
                            ensureErr => {
                                if (ensureErr) {
                                    return callback(ensureErr);
                                }

                                db.serialize(() => {
                                    db.run('BEGIN TRANSACTION');

                                    db.get(
                                        `
                                            SELECT quantity
                                            FROM stocks
                                            WHERE product_id = ?
                                            AND location_id = ?
                                        `,
                                        [
                                            productId,
                                            locationId
                                        ],
                                        (stockErr, stock) => {
                                            if (stockErr) {
                                                return db.run(
                                                    'ROLLBACK',
                                                    () =>
                                                        callback(stockErr)
                                                );
                                            }

                                            const oldQuantity =
                                                stock
                                                    ? Number(
                                                        stock.quantity
                                                    )
                                                    : 0;

                                            const difference =
                                                quantity -
                                                oldQuantity;

                                            db.run(
                                                `
                                                    UPDATE stocks
                                                    SET
                                                        quantity = ?,
                                                        updated_at = CURRENT_TIMESTAMP
                                                    WHERE product_id = ?
                                                    AND location_id = ?
                                                `,
                                                [
                                                    quantity,
                                                    productId,
                                                    locationId
                                                ],
                                                updateErr => {
                                                    if (updateErr) {
                                                        return db.run(
                                                            'ROLLBACK',
                                                            () =>
                                                                callback(
                                                                    updateErr
                                                                )
                                                        );
                                                    }

                                                    db.run(
                                                        `
                                                            INSERT INTO stock_movements (
                                                                product_id,
                                                                location_id,
                                                                type,
                                                                quantity,
                                                                reason,
                                                                reference,
                                                                user_id
                                                            )
                                                            VALUES (
                                                                ?,
                                                                ?,
                                                                'ADJUSTMENT',
                                                                ?,
                                                                ?,
                                                                ?,
                                                                ?
                                                            )
                                                        `,
                                                        [
                                                            productId,
                                                            locationId,
                                                            difference,
                                                            reason || null,
                                                            reference || null,
                                                            userId || null
                                                        ],
                                                        movementErr => {
                                                            if (
                                                                movementErr
                                                            ) {
                                                                return db.run(
                                                                    'ROLLBACK',
                                                                    () =>
                                                                        callback(
                                                                            movementErr
                                                                        )
                                                                );
                                                            }

                                                            db.run(
                                                                'COMMIT',
                                                                commitErr => {
                                                                    if (
                                                                        commitErr
                                                                    ) {
                                                                        return callback(
                                                                            commitErr
                                                                        );
                                                                    }

                                                                    callback(
                                                                        null,
                                                                        {
                                                                            product,
                                                                            type: 'ADJUSTMENT',
                                                                            oldQuantity,
                                                                            newQuantity:
                                                                                quantity,
                                                                            difference
                                                                        }
                                                                    );
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
                        );
                    }
                );
            }
        );
    }

    /**
     * Traite un transfert de stock
     * @param {number} transferId - ID du transfert
     * @param {number} userId - ID de l'utilisateur qui traite le transfert
     * @param {function} callback - Fonction de callback
     */
    static transfer(
        transferId,
        userId,
        callback
    ) {

        StockTransfer.findById(
            transferId,
            (err, transfer) => {
                if (err) return callback(err);

                if (!transfer) {
                    return callback(
                        new Error('Transfert introuvable.')
                    );
                }

                if (transfer.status !== 'PENDING') {
                    return callback(
                        new Error(
                            'Ce transfert a déjà été traité.'
                        )
                    );
                }

                if (
                    transfer.source_location_id ===
                    transfer.destination_location_id
                ) {
                    return callback(
                        new Error(
                            'La source et la destination doivent être différentes.'
                        )
                    );
                }

                if (transfer.quantity <= 0) {
                    return callback(
                        new Error(
                            'La quantité du transfert doit être supérieure à zéro.'
                        )
                    );
                }
                
                StockService.checkTransferLocations(
                    transfer.source_location_id,
                    transfer.destination_location_id,
                    err => {
                        if (err) {
                            return callback(err);
                        }
                        db.serialize(() => {
                            db.run(
                                `BEGIN TRANSACTION`,
                                err => {
                                    if (err) {
                                        return callback(err);
                                    }

                                    const rollback = error => {
                                        db.run(
                                            `ROLLBACK`,
                                            () => callback(error)
                                        );
                                    };

                                    db.get(
                                        `
                                            SELECT
                                                id,
                                                quantity
                                            FROM stocks
                                            WHERE product_id = ?
                                            AND location_id = ?
                                        `,
                                        [
                                            transfer.product_id,
                                            transfer.source_location_id
                                        ],
                                        (err, sourceStock) => {
                                            if (err) {
                                                return rollback(err);
                                            }

                                            if (!sourceStock) {
                                                return rollback(
                                                    new Error(
                                                        'Aucun stock disponible dans la localisation source.'
                                                    )
                                                );
                                            }

                                            if (
                                                sourceStock.quantity <
                                                transfer.quantity
                                            ) {
                                                return rollback(
                                                    new Error(
                                                        `Stock insuffisant. Disponible : ${sourceStock.quantity} ${transfer.unit}.`
                                                    )
                                                );
                                            }

                                            db.run(
                                                `
                                                    INSERT OR IGNORE INTO stocks (
                                                        product_id,
                                                        location_id,
                                                        quantity
                                                    )
                                                    VALUES (?, ?, 0)
                                                `,
                                                [
                                                    transfer.product_id,
                                                    transfer.destination_location_id
                                                ],
                                                err => {
                                                    if (err) {
                                                        return rollback(err);
                                                    }

                                                    db.run(
                                                        `
                                                            UPDATE stocks
                                                            SET
                                                                quantity = quantity - ?,
                                                                updated_at = CURRENT_TIMESTAMP
                                                            WHERE product_id = ?
                                                            AND location_id = ?
                                                        `,
                                                        [
                                                            transfer.quantity,
                                                            transfer.product_id,
                                                            transfer.source_location_id
                                                        ],
                                                        err => {
                                                            if (err) {
                                                                return rollback(err);
                                                            }

                                                            db.run(
                                                                `
                                                                    UPDATE stocks
                                                                    SET
                                                                        quantity = quantity + ?,
                                                                        updated_at = CURRENT_TIMESTAMP
                                                                    WHERE product_id = ?
                                                                    AND location_id = ?
                                                                `,
                                                                [
                                                                    transfer.quantity,
                                                                    transfer.product_id,
                                                                    transfer.destination_location_id
                                                                ],
                                                                err => {
                                                                    if (err) {
                                                                        return rollback(err);
                                                                    }

                                                                    db.run(
                                                                        `
                                                                            INSERT INTO stock_movements (
                                                                                product_id,
                                                                                location_id,
                                                                                type,
                                                                                quantity,
                                                                                reason,
                                                                                reference,
                                                                                transfer_id,
                                                                                user_id
                                                                            )
                                                                            VALUES (
                                                                                ?,
                                                                                ?,
                                                                                'TRANSFER_OUT',
                                                                                ?,
                                                                                ?,
                                                                                ?,
                                                                                ?,
                                                                                ?
                                                                            )
                                                                        `,
                                                                        [
                                                                            transfer.product_id,
                                                                            transfer.source_location_id,
                                                                            transfer.quantity,
                                                                            transfer.reason,
                                                                            transfer.reference,
                                                                            transfer.id,
                                                                            userId
                                                                        ],
                                                                        err => {
                                                                            if (err) {
                                                                                return rollback(err);
                                                                            }

                                                                            db.run(
                                                                                `
                                                                                    INSERT INTO stock_movements (
                                                                                        product_id,
                                                                                        location_id,
                                                                                        type,
                                                                                        quantity,
                                                                                        reason,
                                                                                        reference,
                                                                                        transfer_id,
                                                                                        user_id
                                                                                    )
                                                                                    VALUES (
                                                                                        ?,
                                                                                        ?,
                                                                                        'TRANSFER_IN',
                                                                                        ?,
                                                                                        ?,
                                                                                        ?,
                                                                                        ?,
                                                                                        ?
                                                                                    )
                                                                                `,
                                                                                [
                                                                                    transfer.product_id,
                                                                                    transfer.destination_location_id,
                                                                                    transfer.quantity,
                                                                                    transfer.reason,
                                                                                    transfer.reference,
                                                                                    transfer.id,
                                                                                    userId
                                                                                ],
                                                                                err => {
                                                                                    if (err) {
                                                                                        return rollback(err);
                                                                                    }

                                                                                    db.run(
                                                                                        `
                                                                                            UPDATE stock_transfers
                                                                                            SET
                                                                                                status = 'COMPLETED',
                                                                                                completed_at = CURRENT_TIMESTAMP
                                                                                            WHERE id = ?
                                                                                            AND status = 'PENDING'
                                                                                        `,
                                                                                        [transfer.id],
                                                                                        function (err) {
                                                                                            if (err) {
                                                                                                return rollback(err);
                                                                                            }

                                                                                            if (
                                                                                                this.changes !== 1
                                                                                            ) {
                                                                                                return rollback(
                                                                                                    new Error(
                                                                                                        'Le transfert ne peut plus être validé.'
                                                                                                    )
                                                                                                );
                                                                                            }

                                                                                            db.run(
                                                                                                `COMMIT`,
                                                                                                err => {
                                                                                                    if (err) {
                                                                                                        return rollback(err);
                                                                                                    }

                                                                                                    callback(null);
                                                                                                }
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
                                                    );
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        });
                    }
                );

                        
            }
        );
    }

    /**
     * Annule un transfert de stock
     * @param {number} transferId - ID du transfert
     * @param {function} callback - Fonction de callback
     */
    static cancelTransfer(transferId, callback) {
        db.run(
            `
                UPDATE stock_transfers
                SET status = 'CANCELLED'
                WHERE id = ?
                AND status = 'PENDING'
            `,
            [transferId],
            function (err) {
                if (err) return callback(err);

                if (this.changes !== 1) {
                    return callback(
                        new Error(
                            'Ce transfert ne peut pas être annulé.'
                        )
                    );
                }

                callback(null);
            }
        );
    }
    
    /**
     * Termine un inventaire
     * @param {number} inventoryId - ID de l'inventaire
     * @param {number} userId - ID de l'utilisateur qui termine l'inventaire
     * @param {function} callback - Fonction de callback
     */
    static completeInventory(
        inventoryId,
        userId,
        callback
    ) {
        const Inventory =
            require('../models/Inventory');

        Inventory.findById(
            inventoryId,
            (inventoryErr, inventory) => {
                if (inventoryErr) {
                    return callback(inventoryErr);
                }

                if (!inventory) {
                    return callback(
                        new Error(
                            'Inventaire introuvable.'
                        )
                    );
                }

                if (inventory.status !== 'DRAFT') {
                    return callback(
                        new Error(
                            'Cet inventaire a déjà été traité.'
                        )
                    );
                }

                Inventory.findItems(
                    inventoryId,
                    (itemsErr, items) => {
                        if (itemsErr) {
                            return callback(itemsErr);
                        }

                        if (!items.length) {
                            return callback(
                                new Error(
                                    'Cet inventaire ne contient aucun produit.'
                                )
                            );
                        }

                        db.serialize(() => {
                            db.run(
                                `BEGIN TRANSACTION`,
                                err => {
                                    if (err) {
                                        return callback(err);
                                    }

                                    const rollback = error => {
                                        db.run(
                                            `ROLLBACK`,
                                            () => callback(error)
                                        );
                                    };

                                    let index = 0;

                                    const processNext =
                                        () => {
                                            if (
                                                index >=
                                                items.length
                                            ) {
                                                db.run(
                                                    `
                                                        UPDATE stock_inventories
                                                        SET
                                                            status = 'COMPLETED',
                                                            completed_at = CURRENT_TIMESTAMP
                                                        WHERE id = ?
                                                        AND status = 'DRAFT'
                                                    `,
                                                    [inventoryId],
                                                    function (err) {
                                                        if (err) {
                                                            return rollback(
                                                                err
                                                            );
                                                        }

                                                        if (
                                                            this.changes !==
                                                            1
                                                        ) {
                                                            return rollback(
                                                                new Error(
                                                                    'L’inventaire ne peut plus être validé.'
                                                                )
                                                            );
                                                        }

                                                        db.run(
                                                            `COMMIT`,
                                                            err => {
                                                                if (
                                                                    err
                                                                ) {
                                                                    return rollback(
                                                                        err
                                                                    );
                                                                }

                                                                callback(
                                                                    null
                                                                );
                                                            }
                                                        );
                                                    }
                                                );

                                                return;
                                            }

                                            const item =
                                                items[index];

                                            const difference =
                                                Number(
                                                    item.counted_quantity
                                                ) -
                                                Number(
                                                    item.theoretical_quantity
                                                );

                                            if (
                                                difference ===
                                                0
                                            ) {
                                                index++;
                                                return processNext();
                                            }

                                            db.run(
                                                `
                                                    INSERT OR IGNORE INTO stocks (
                                                        product_id,
                                                        location_id,
                                                        quantity
                                                    )
                                                    VALUES (?, ?, 0)
                                                `,
                                                [
                                                    item.product_id,
                                                    inventory.location_id
                                                ],
                                                err => {
                                                    if (err) {
                                                        return rollback(
                                                            err
                                                        );
                                                    }

                                                    db.run(
                                                        `
                                                            UPDATE stocks
                                                            SET
                                                                quantity = quantity + ?,
                                                                updated_at = CURRENT_TIMESTAMP
                                                            WHERE product_id = ?
                                                            AND location_id = ?
                                                        `,
                                                        [
                                                            difference,
                                                            item.product_id,
                                                            inventory.location_id
                                                        ],
                                                        err => {
                                                            if (err) {
                                                                return rollback(
                                                                    err
                                                                );
                                                            }

                                                            db.run(
                                                                `
                                                                    INSERT INTO stock_movements (
                                                                        product_id,
                                                                        location_id,
                                                                        type,
                                                                        quantity,
                                                                        reason,
                                                                        reference,
                                                                        user_id
                                                                    )
                                                                    VALUES (
                                                                        ?,
                                                                        ?,
                                                                        'ADJUSTMENT',
                                                                        ?,
                                                                        ?,
                                                                        ?,
                                                                        ?
                                                                    )
                                                                `,
                                                                [
                                                                    item.product_id,
                                                                    inventory.location_id,
                                                                    difference,
                                                                    'Régularisation inventaire',
                                                                    inventory.reference,
                                                                    userId
                                                                ],
                                                                err => {
                                                                    if (
                                                                        err
                                                                    ) {
                                                                        return rollback(
                                                                            err
                                                                        );
                                                                    }

                                                                    index++;

                                                                    processNext();
                                                                }
                                                            );
                                                        }
                                                    );
                                                }
                                            );
                                        };

                                    processNext();
                                }
                            );
                        });
                    }
                );
            }
        );
    }

    /**
     * Vérifie si une localisation est verrouillée par un inventaire
     * @param {number} locationId - ID de la localisation
     * @param {function} callback - Fonction de callback
     */
    static checkInventoryLock(
        locationId,
        callback
    ) {
        const Inventory =
            require('../models/Inventory');

        Inventory.findDraftByLocation(
            locationId,
            (err, inventory) => {
                if (err) return callback(err);

                if (inventory) {
                    return callback(
                        new Error(
                            `La localisation est verrouillée par l'inventaire ${inventory.reference}.`
                        )
                    );
                }

                callback(null);
            }
        );
    }

    /**
     * Vérifie si les localisations source et destination sont verrouillées
     * @param {number} sourceLocationId - ID de la localisation source
     * @param {number} destinationLocationId - ID de la localisation destination
     * @param {function} callback - Fonction de callback
     */
    static checkTransferLocations(
        sourceLocationId,
        destinationLocationId,
        callback
    ) {
        StockService.checkInventoryLock(
            sourceLocationId,
            err => {
                if (err) {
                    return callback(err);
                }

                StockService.checkInventoryLock(
                    destinationLocationId,
                    err => {
                        if (err) {
                            return callback(err);
                        }

                        callback(null);
                    }
                );
            }
        );
    }
}

module.exports = StockService;
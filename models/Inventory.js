const db = require('../config/database');

class Inventory {
    static create(
        reference,
        locationId,
        createdBy,
        callback
    ) {
        const sql = `
            INSERT INTO stock_inventories (
                reference,
                location_id,
                created_by
            )
            VALUES (?, ?, ?)
        `;

        db.run(
            sql,
            [
                reference,
                locationId,
                createdBy
            ],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    id: this.lastID,
                    reference,
                    location_id: locationId,
                    created_by: createdBy,
                    status: 'DRAFT'
                });
            }
        );
    }

    static findAll(callback) {
        const sql = `
            SELECT
                si.*,

                sl.name AS location_name,
                sl.code AS location_code,

                s.name AS store_name,
                s.code AS store_code,

                u.username AS created_by_username,

                (
                    SELECT COUNT(*)
                    FROM stock_inventory_items sii
                    WHERE sii.inventory_id = si.id
                ) AS item_count,

                (
                    SELECT COUNT(*)
                    FROM stock_inventory_items sii
                    WHERE sii.inventory_id = si.id
                      AND sii.counted_quantity != sii.theoretical_quantity
                ) AS difference_count

            FROM stock_inventories si

            INNER JOIN stock_locations sl
                ON sl.id = si.location_id

            INNER JOIN stores s
                ON s.id = sl.store_id

            LEFT JOIN users u
                ON u.id = si.created_by

            ORDER BY si.created_at DESC
        `;

        db.all(sql, [], (err, inventories) => {
            if (err) return callback(err);

            callback(null, inventories);
        });
    }

    static findById(id, callback) {
        const sql = `
            SELECT
                si.*,

                sl.name AS location_name,
                sl.code AS location_code,

                s.name AS store_name,
                s.code AS store_code,

                u.username AS created_by_username

            FROM stock_inventories si

            INNER JOIN stock_locations sl
                ON sl.id = si.location_id

            INNER JOIN stores s
                ON s.id = sl.store_id

            LEFT JOIN users u
                ON u.id = si.created_by

            WHERE si.id = ?
        `;

        db.get(sql, [id], (err, inventory) => {
            if (err) return callback(err);

            callback(null, inventory);
        });
    }

    static findItems(inventoryId, callback) {
        const sql = `
            SELECT
                sii.*,

                p.sku,
                p.name AS product_name,
                p.unit,
                p.minimum_stock

            FROM stock_inventory_items sii

            INNER JOIN products p
                ON p.id = sii.product_id

            WHERE sii.inventory_id = ?

            ORDER BY p.name ASC
        `;

        db.all(
            sql,
            [inventoryId],
            (err, items) => {
                if (err) return callback(err);

                callback(null, items);
            }
        );
    }

    static addItem(
        inventoryId,
        productId,
        theoreticalQuantity,
        callback
    ) {
        const sql = `
            INSERT INTO stock_inventory_items (
                inventory_id,
                product_id,
                theoretical_quantity,
                counted_quantity,
                difference
            )
            VALUES (?, ?, ?, 0, ?)
        `;

        db.run(
            sql,
            [
                inventoryId,
                productId,
                theoreticalQuantity,
                -theoreticalQuantity
            ],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    id: this.lastID
                });
            }
        );
    }

    static updateItem(
        itemId,
        countedQuantity,
        callback
    ) {
        const sql = `
            UPDATE stock_inventory_items
            SET
                counted_quantity = ?,
                difference = ? - theoretical_quantity
            WHERE id = ?
        `;

        db.run(
            sql,
            [
                countedQuantity,
                countedQuantity,
                itemId
            ],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    changes: this.changes
                });
            }
        );
    }

    static markCompleted(
        inventoryId,
        callback
    ) {
        const sql = `
            UPDATE stock_inventories
            SET
                status = 'COMPLETED',
                completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND status = 'DRAFT'
        `;

        db.run(
            sql,
            [inventoryId],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    changes: this.changes
                });
            }
        );
    }

    static markCancelled(
        inventoryId,
        callback
    ) {
        const sql = `
            UPDATE stock_inventories
            SET status = 'CANCELLED'
            WHERE id = ?
              AND status = 'DRAFT'
        `;

        db.run(
            sql,
            [inventoryId],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    changes: this.changes
                });
            }
        );
    }

    static count(callback) {
        const sql = `
            SELECT COUNT(*) AS total
            FROM stock_inventories
        `;

        db.get(sql, [], (err, row) => {
            if (err) return callback(err);

            callback(null, row.total);
        });
    }

    static findDraftByLocation(
        locationId,
        callback
    ) {
        const sql = `
            SELECT
                id,
                reference,
                location_id,
                status
            FROM stock_inventories
            WHERE location_id = ?
            AND status = 'DRAFT'
            LIMIT 1
        `;

        db.get(
            sql,
            [locationId],
            (err, inventory) => {
                if (err) return callback(err);

                callback(null, inventory);
            }
        );
    }

}

module.exports = Inventory;
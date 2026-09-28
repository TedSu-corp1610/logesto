const db = require('../config/database');

class Stock {
    static findAll(callback) {
        const sql = `
            SELECT
                s.id,
                s.product_id,
                s.location_id,
                s.quantity,
                s.updated_at,

                p.sku,
                p.name AS product_name,
                p.minimum_stock,
                p.unit,

                sl.name AS location_name,
                sl.code AS location_code,

                st.id AS store_id,
                st.name AS store_name,
                st.code AS store_code,
                
                si.id AS inventory_id,
                si.reference AS inventory_reference,
                CASE
                    WHEN si.id IS NOT NULL THEN 1
                    ELSE 0
                END AS inventory_locked

            FROM stocks s

            INNER JOIN products p
                ON p.id = s.product_id

            INNER JOIN stock_locations sl
                ON sl.id = s.location_id

            INNER JOIN stores st
                ON st.id = sl.store_id

            LEFT JOIN stock_inventories si
                ON si.location_id = s.location_id
                AND si.status = 'DRAFT'

            ORDER BY
                st.name ASC,
                sl.name ASC,
                p.name ASC
        `;

        db.all(sql, [], (err, stocks) => {
            if (err) return callback(err);
            callback(null, stocks);
        });
    }

    static findByLocation(locationId, callback) {
        const sql = `
            SELECT
                s.*,
                p.sku,
                p.name AS product_name,
                p.minimum_stock,
                p.unit
            FROM stocks s
            INNER JOIN products p
                ON p.id = s.product_id
            WHERE s.location_id = ?
            ORDER BY p.name ASC
        `;

        db.all(
            sql,
            [locationId],
            (err, stocks) => {
                if (err) return callback(err);
                callback(null, stocks);
            }
        );
    }

    static findByProduct(productId, callback) {
        const sql = `
            SELECT
                s.*,
                p.sku,
                p.name AS product_name,
                p.minimum_stock,
                p.unit,
                sl.name AS location_name,
                sl.code AS location_code,
                st.name AS store_name,
                st.code AS store_code
            FROM stocks s
            INNER JOIN products p
                ON p.id = s.product_id
            INNER JOIN stock_locations sl
                ON sl.id = s.location_id
            INNER JOIN stores st
                ON st.id = sl.store_id
            WHERE s.product_id = ?
            ORDER BY st.name ASC, sl.name ASC
        `;

        db.all(
            sql,
            [productId],
            (err, stocks) => {
                if (err) return callback(err);
                callback(null, stocks);
            }
        );
    }

    static count(callback) {
        const sql = `
            SELECT COUNT(*) AS total
            FROM stocks
        `;

        db.get(sql, [], (err, row) => {
            if (err) return callback(err);
            callback(null, row.total);
        });
    }

    static totalQuantity(callback) {
        const sql = `
            SELECT COALESCE(
                SUM(quantity),
                0
            ) AS total
            FROM stocks
        `;

        db.get(sql, [], (err, row) => {
            if (err) return callback(err);
            callback(null, row.total);
        });
    }

    static lowStock(callback) {
        const sql = `
            SELECT
                s.*,
                p.sku,
                p.name AS product_name,
                p.minimum_stock,
                p.unit,
                sl.name AS location_name,
                sl.code AS location_code,
                st.name AS store_name,
                st.code AS store_code
            FROM stocks s
            INNER JOIN products p
                ON p.id = s.product_id
            INNER JOIN stock_locations sl
                ON sl.id = s.location_id
            INNER JOIN stores st
                ON st.id = sl.store_id
            WHERE p.minimum_stock > 0
              AND s.quantity <= p.minimum_stock
            ORDER BY
                s.quantity ASC,
                p.name ASC
        `;

        db.all(sql, [], (err, stocks) => {
            if (err) return callback(err);
            callback(null, stocks);
        });
    }
}

module.exports = Stock;
const db = require('../config/database');

class StockMovement {
    static findAll(callback) {
        const sql = `
            SELECT
                sm.*,

                p.sku,
                p.name AS product_name,
                p.unit,

                sl.name AS location_name,
                sl.code AS location_code,

                st.name AS store_name,
                st.code AS store_code,

                u.username

            FROM stock_movements sm

            INNER JOIN products p
                ON p.id = sm.product_id

            INNER JOIN stock_locations sl
                ON sl.id = sm.location_id

            INNER JOIN stores st
                ON st.id = sl.store_id

            LEFT JOIN users u
                ON u.id = sm.user_id

            ORDER BY sm.created_at DESC
        `;

        db.all(sql, [], (err, movements) => {
            if (err) return callback(err);
            callback(null, movements);
        });
    }

    static findByProduct(productId, callback) {
        const sql = `
            SELECT
                sm.*,
                p.sku,
                p.name AS product_name,
                sl.name AS location_name,
                st.name AS store_name,
                u.username
            FROM stock_movements sm
            INNER JOIN products p
                ON p.id = sm.product_id
            INNER JOIN stock_locations sl
                ON sl.id = sm.location_id
            INNER JOIN stores st
                ON st.id = sl.store_id
            LEFT JOIN users u
                ON u.id = sm.user_id
            WHERE sm.product_id = ?
            ORDER BY sm.created_at DESC
        `;

        db.all(
            sql,
            [productId],
            (err, movements) => {
                if (err) return callback(err);
                callback(null, movements);
            }
        );
    }

    static findByLocation(locationId, callback) {
        const sql = `
            SELECT
                sm.*,
                p.sku,
                p.name AS product_name,
                sl.name AS location_name,
                st.name AS store_name,
                u.username
            FROM stock_movements sm
            INNER JOIN products p
                ON p.id = sm.product_id
            INNER JOIN stock_locations sl
                ON sl.id = sm.location_id
            INNER JOIN stores st
                ON st.id = sl.store_id
            LEFT JOIN users u
                ON u.id = sm.user_id
            WHERE sm.location_id = ?
            ORDER BY sm.created_at DESC
        `;

        db.all(
            sql,
            [locationId],
            (err, movements) => {
                if (err) return callback(err);
                callback(null, movements);
            }
        );
    }
}

module.exports = StockMovement;
const db = require('../config/database');

class StockTransfer {
    static create(
        reference,
        productId,
        sourceLocationId,
        destinationLocationId,
        quantity,
        reason,
        createdBy,
        callback
    ) {
        const sql = `
            INSERT INTO stock_transfers (
                reference,
                product_id,
                source_location_id,
                destination_location_id,
                quantity,
                reason,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [
                reference,
                productId,
                sourceLocationId,
                destinationLocationId,
                quantity,
                reason,
                createdBy
            ],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    id: this.lastID,
                    reference,
                    product_id: productId,
                    source_location_id: sourceLocationId,
                    destination_location_id: destinationLocationId,
                    quantity,
                    reason,
                    created_by: createdBy,
                    status: 'PENDING'
                });
            }
        );
    }

    static findAll(callback) {
        const sql = `
            SELECT
                st.*,

                p.sku,
                p.name AS product_name,
                p.unit,

                src.name AS source_location_name,
                src.code AS source_location_code,

                src_store.name AS source_store_name,
                src_store.code AS source_store_code,

                dst.name AS destination_location_name,
                dst.code AS destination_location_code,

                dst_store.name AS destination_store_name,
                dst_store.code AS destination_store_code,

                u.username AS created_by_username

            FROM stock_transfers st

            INNER JOIN products p
                ON p.id = st.product_id

            INNER JOIN stock_locations src
                ON src.id = st.source_location_id

            INNER JOIN stores src_store
                ON src_store.id = src.store_id

            INNER JOIN stock_locations dst
                ON dst.id = st.destination_location_id

            INNER JOIN stores dst_store
                ON dst_store.id = dst.store_id

            LEFT JOIN users u
                ON u.id = st.created_by

            ORDER BY st.created_at DESC
        `;

        db.all(sql, [], (err, transfers) => {
            if (err) return callback(err);

            callback(null, transfers);
        });
    }

    static findById(id, callback) {
        const sql = `
            SELECT
                st.*,

                p.sku,
                p.name AS product_name,
                p.unit,

                src.name AS source_location_name,
                src.code AS source_location_code,

                src_store.name AS source_store_name,
                src_store.code AS source_store_code,

                dst.name AS destination_location_name,
                dst.code AS destination_location_code,

                dst_store.name AS destination_store_name,
                dst_store.code AS destination_store_code,

                u.username AS created_by_username

            FROM stock_transfers st

            INNER JOIN products p
                ON p.id = st.product_id

            INNER JOIN stock_locations src
                ON src.id = st.source_location_id

            INNER JOIN stores src_store
                ON src_store.id = src.store_id

            INNER JOIN stock_locations dst
                ON dst.id = st.destination_location_id

            INNER JOIN stores dst_store
                ON dst_store.id = dst.store_id

            LEFT JOIN users u
                ON u.id = st.created_by

            WHERE st.id = ?
        `;

        db.get(sql, [id], (err, transfer) => {
            if (err) return callback(err);

            callback(null, transfer);
        });
    }

    static countPending(callback) {
        const sql = `
            SELECT COUNT(*) AS total
            FROM stock_transfers
            WHERE status = 'PENDING'
        `;

        db.get(sql, [], (err, row) => {
            if (err) return callback(err);

            callback(null, row.total);
        });
    }
}

module.exports = StockTransfer;
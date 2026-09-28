const db = require('../config/database');

class StockLocation {

    static create(
        storeId,
        name,
        code,
        description,
        callback
    ) {
        const sql = `
            INSERT INTO stock_locations (
                store_id,
                name,
                code,
                description
            )
            VALUES (?, ?, ?, ?)
        `;

        db.run(
            sql,
            [
                storeId,
                name,
                code,
                description
            ],
            function (err) {

                if (err) {
                    return callback(err);
                }

                callback(null, {
                    id: this.lastID,
                    store_id: storeId,
                    name,
                    code,
                    description
                });
            }
        );
    }


    static findAll(callback) {

        const sql = `
            SELECT
                sl.*,
                s.name AS store_name,
                s.code AS store_code
            FROM stock_locations sl

            INNER JOIN stores s
                ON s.id = sl.store_id

            ORDER BY
                s.name ASC,
                sl.name ASC
        `;

        db.all(sql, [], (err, locations) => {

            if (err) {
                return callback(err);
            }

            callback(null, locations);
        });
    }


    static findById(id, callback) {

        const sql = `
            SELECT
                sl.*,
                s.name AS store_name,
                s.code AS store_code
            FROM stock_locations sl

            INNER JOIN stores s
                ON s.id = sl.store_id

            WHERE sl.id = ?
        `;

        db.get(
            sql,
            [id],
            (err, location) => {

                if (err) {
                    return callback(err);
                }

                callback(null, location);
            }
        );
    }


    static findByCode(
        storeId,
        code,
        callback
    ) {

        const sql = `
            SELECT *
            FROM stock_locations
            WHERE
                store_id = ?
                AND code = ?
        `;

        db.get(
            sql,
            [
                storeId,
                code
            ],
            (err, location) => {

                if (err) {
                    return callback(err);
                }

                callback(null, location);
            }
        );
    }


    static findByStore(
        storeId,
        callback
    ) {

        const sql = `
            SELECT *
            FROM stock_locations
            WHERE store_id = ?
            ORDER BY name ASC
        `;

        db.all(
            sql,
            [storeId],
            (err, locations) => {

                if (err) {
                    return callback(err);
                }

                callback(null, locations);
            }
        );
    }


    static update(
        id,
        storeId,
        name,
        code,
        description,
        status,
        callback
    ) {
        const sql = `
            UPDATE stock_locations
            SET
                store_id = ?,
                name = ?,
                code = ?,
                description = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(
            sql,
            [
                storeId,
                name,
                code,
                description,
                status,
                id
            ],
            function (err) {

                if (err) {
                    return callback(err);
                }

                callback(null, {
                    changes: this.changes
                });
            }
        );
    }


    static delete(id, callback) {

        const sql = `
            DELETE FROM stock_locations
            WHERE id = ?
        `;

        db.run(
            sql,
            [id],
            function (err) {

                if (err) {
                    return callback(err);
                }

                callback(null, {
                    changes: this.changes
                });
            }
        );
    }


    static count(callback) {

        const sql = `
            SELECT COUNT(*) AS total
            FROM stock_locations
        `;

        db.get(sql, [], (err, row) => {

            if (err) {
                return callback(err);
            }

            callback(null, row.total);
        });
    }
}

module.exports = StockLocation;
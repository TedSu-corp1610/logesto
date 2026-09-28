const db = require('../config/database');

class Store {

    static create(
        name,
        code,
        address,
        phone,
        email,
        callback
    ) {
        const sql = `
            INSERT INTO stores (
                name,
                code,
                address,
                phone,
                email
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [
                name,
                code,
                address,
                phone,
                email
            ],
            function (err) {

                if (err) {
                    return callback(err);
                }

                callback(null, {
                    id: this.lastID,
                    name,
                    code,
                    address,
                    phone,
                    email
                });
            }
        );
    }


    static findAll(callback) {

        const sql = `
            SELECT *
            FROM stores
            ORDER BY name ASC
        `;

        db.all(sql, [], (err, stores) => {

            if (err) {
                return callback(err);
            }

            callback(null, stores);
        });
    }


    static findById(id, callback) {

        const sql = `
            SELECT *
            FROM stores
            WHERE id = ?
        `;

        db.get(sql, [id], (err, store) => {

            if (err) {
                return callback(err);
            }

            callback(null, store);
        });
    }


    static findByCode(code, callback) {

        const sql = `
            SELECT *
            FROM stores
            WHERE code = ?
        `;

        db.get(sql, [code], (err, store) => {

            if (err) {
                return callback(err);
            }

            callback(null, store);
        });
    }


    static update(
        id,
        name,
        code,
        address,
        phone,
        email,
        status,
        callback
    ) {
        const sql = `
            UPDATE stores
            SET
                name = ?,
                code = ?,
                address = ?,
                phone = ?,
                email = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(
            sql,
            [
                name,
                code,
                address,
                phone,
                email,
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
            DELETE FROM stores
            WHERE id = ?
        `;

        db.run(sql, [id], function (err) {

            if (err) {
                return callback(err);
            }

            callback(null, {
                changes: this.changes
            });
        });
    }


    static count(callback) {

        const sql = `
            SELECT COUNT(*) AS total
            FROM stores
        `;

        db.get(sql, [], (err, row) => {

            if (err) {
                return callback(err);
            }

            callback(null, row.total);
        });
    }
}

module.exports = Store;
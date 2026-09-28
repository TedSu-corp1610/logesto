const db = require('../config/database');

class Supplier {
    static create(
        name,
        code,
        contactName,
        phone,
        email,
        address,
        callback
    ) {
        const sql = `
            INSERT INTO suppliers (
                name,
                code,
                contact_name,
                phone,
                email,
                address
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [
                name,
                code,
                contactName,
                phone,
                email,
                address
            ],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    id: this.lastID,
                    name,
                    code,
                    contact_name: contactName,
                    phone,
                    email,
                    address
                });
            }
        );
    }

    static findAll(callback) {
        const sql = `
            SELECT *
            FROM suppliers
            ORDER BY name ASC
        `;

        db.all(sql, [], (err, suppliers) => {
            if (err) return callback(err);
            callback(null, suppliers);
        });
    }

    static findById(id, callback) {
        const sql = `
            SELECT *
            FROM suppliers
            WHERE id = ?
        `;

        db.get(sql, [id], (err, supplier) => {
            if (err) return callback(err);
            callback(null, supplier);
        });
    }

    static findByCode(code, callback) {
        const sql = `
            SELECT *
            FROM suppliers
            WHERE code = ?
        `;

        db.get(sql, [code], (err, supplier) => {
            if (err) return callback(err);
            callback(null, supplier);
        });
    }

    static update(
        id,
        name,
        code,
        contactName,
        phone,
        email,
        address,
        status,
        callback
    ) {
        const sql = `
            UPDATE suppliers
            SET
                name = ?,
                code = ?,
                contact_name = ?,
                phone = ?,
                email = ?,
                address = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(
            sql,
            [
                name,
                code,
                contactName,
                phone,
                email,
                address,
                status,
                id
            ],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    changes: this.changes
                });
            }
        );
    }

    static delete(id, callback) {
        const sql = `
            DELETE FROM suppliers
            WHERE id = ?
        `;

        db.run(sql, [id], function (err) {
            if (err) return callback(err);

            callback(null, {
                changes: this.changes
            });
        });
    }

    static count(callback) {
        const sql = `
            SELECT COUNT(*) AS total
            FROM suppliers
        `;

        db.get(sql, [], (err, row) => {
            if (err) return callback(err);
            callback(null, row.total);
        });
    }
}

module.exports = Supplier;
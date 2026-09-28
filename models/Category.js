const db = require('../config/database');

class Category {
    static create(name, description, callback) {
        const sql = `
            INSERT INTO categories (
                name,
                description
            )
            VALUES (?, ?)
        `;

        db.run(sql, [name, description], function (err) {
            if (err) return callback(err);

            callback(null, {
                id: this.lastID,
                name,
                description
            });
        });
    }

    static findAll(callback) {
        const sql = `
            SELECT *
            FROM categories
            ORDER BY name ASC
        `;

        db.all(sql, [], (err, categories) => {
            if (err) return callback(err);
            callback(null, categories);
        });
    }

    static findById(id, callback) {
        const sql = `
            SELECT *
            FROM categories
            WHERE id = ?
        `;

        db.get(sql, [id], (err, category) => {
            if (err) return callback(err);
            callback(null, category);
        });
    }

    static findByName(name, callback) {
        const sql = `
            SELECT *
            FROM categories
            WHERE name = ?
        `;

        db.get(sql, [name], (err, category) => {
            if (err) return callback(err);
            callback(null, category);
        });
    }

    static update(id, name, description, status, callback) {
        const sql = `
            UPDATE categories
            SET
                name = ?,
                description = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(
            sql,
            [name, description, status, id],
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
            DELETE FROM categories
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
            FROM categories
        `;

        db.get(sql, [], (err, row) => {
            if (err) return callback(err);
            callback(null, row.total);
        });
    }
}

module.exports = Category;
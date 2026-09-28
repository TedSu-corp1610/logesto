const db = require('../config/database');

class Permission {

    static create(
        name,
        description,
        callback
    ) {
        const sql = `
            INSERT INTO permissions (
                name,
                description
            )
            VALUES (?, ?)
        `;

        db.run(
            sql,
            [name, description],
            function (err) {

                if (err) {
                    return callback(err);
                }

                callback(null, {
                    id: this.lastID,
                    name,
                    description
                });
            }
        );
    }


    static findById(id, callback) {
        const sql = `
            SELECT *
            FROM permissions
            WHERE id = ?
        `;

        db.get(
            sql,
            [id],
            (err, permission) => {

                if (err) {
                    return callback(err);
                }

                callback(null, permission);
            }
        );
    }


    static findByName(name, callback) {
        const sql = `
            SELECT *
            FROM permissions
            WHERE name = ?
        `;

        db.get(
            sql,
            [name],
            (err, permission) => {

                if (err) {
                    return callback(err);
                }

                callback(null, permission);
            }
        );
    }


    static findAll(callback) {
        const sql = `
            SELECT *
            FROM permissions
            ORDER BY name ASC
        `;

        db.all(
            sql,
            [],
            (err, permissions) => {

                if (err) {
                    return callback(err);
                }

                callback(null, permissions);
            }
        );
    }


    static count(callback) {
        const sql = `
            SELECT COUNT(*) AS total
            FROM permissions
        `;

        db.get(
            sql,
            [],
            (err, row) => {

                if (err) {
                    return callback(err);
                }

                callback(null, row.total);
            }
        );
    }


    static update(
        id,
        name,
        description,
        callback
    ) {
        const sql = `
            UPDATE permissions
            SET
                name = ?,
                description = ?
            WHERE id = ?
        `;

        db.run(
            sql,
            [
                name,
                description,
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
            DELETE FROM permissions
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
    
}

module.exports = Permission;
const db = require('../config/database');

class User {

    static create(username, email, password, roleId, callback) {

        const sql = `
            INSERT INTO users (
                username,
                email,
                password,
                role_id
            )
            VALUES (?, ?, ?, ?)
        `;

        db.run(
            sql,
            [username, email, password, roleId],
            function (err) {

                if (err) {
                    return callback(err);
                }

                callback(null, {
                    id: this.lastID,
                    username,
                    email,
                    role_id: roleId
                });
            }
        );
    }


    static findById(id, callback) {

        const sql = `
            SELECT
                u.*,
                r.name as role_name
            FROM users u
            LEFT JOIN roles r 
                ON u.role_id = r.id
            WHERE u.id = ?
        `;

        db.get(sql, [id], (err, user) => {

            if (err) {
                return callback(err);
            }

            callback(null, user);
        });
    }


    static findByEmail(email, callback) {

        const sql = `
            SELECT *
            FROM users
            WHERE email = ?
        `;

        db.get(sql, [email], (err, user) => {

            if (err) {
                return callback(err);
            }

            callback(null, user);
        });
    }


    static findAll(callback) {

        const sql = `
            SELECT
                u.id,
                u.username,
                u.email,
                u.role_id,
                r.name as role_name,
                u.created_at,
                u.updated_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.id DESC
        `;

        db.all(sql, [], (err, users) => {

            if (err) {
                return callback(err);
            }

            callback(null, users);
        });
    }


    static update(id, username, email, roleId, callback) {

        const sql = `
            UPDATE users
            SET
                username = ?,
                email = ?,
                role_id = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(
            sql,
            [username, email, roleId, id],
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
            DELETE FROM users
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
            FROM users
        `;

        db.get(sql, [], (err, row) => {
            if (err) return callback(err);
            callback(null, row.total);
        });
    }

    static updateProfile(id, username, email, callback) {
        const sql = `
            UPDATE users
            SET username = ?, email = ?
            WHERE id = ?
        `;

        db.run(
            sql,
            [username, email, id],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    changes: this.changes
                });
            }
        );
    }

    static updatePassword(id, password, callback) {
        const sql = `
            UPDATE users
            SET password = ?
            WHERE id = ?
        `;

        db.run(
            sql,
            [password, id],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    changes: this.changes
                });
            }
        );
    }
}

module.exports = User;
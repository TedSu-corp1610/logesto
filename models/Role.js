const db = require('../config/database');

class Role {

    static create(name, description, callback) {
        const sql = `
            INSERT INTO roles (
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
            FROM roles
            WHERE id = ?
        `;

        db.get(
            sql,
            [id],
            (err, role) => {

                if (err) {
                    return callback(err);
                }

                callback(null, role);
            }
        );
    }


    static findByName(name, callback) {
        const sql = `
            SELECT *
            FROM roles
            WHERE name = ?
        `;

        db.get(
            sql,
            [name],
            (err, role) => {

                if (err) {
                    return callback(err);
                }

                callback(null, role);
            }
        );
    }


    static findAll(callback) {
        const sql = `
            SELECT *
            FROM roles
            ORDER BY name ASC
        `;

        db.all(
            sql,
            [],
            (err, roles) => {

                if (err) {
                    return callback(err);
                }

                callback(null, roles);
            }
        );
    }


    static count(callback) {
        const sql = `
            SELECT COUNT(*) AS total
            FROM roles
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
            UPDATE roles
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
            DELETE FROM roles
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


    static getPermissions(
        roleId,
        callback
    ) {
        const sql = `
            SELECT p.name
            FROM permissions p

            INNER JOIN role_permissions rp
                ON rp.permission_id = p.id

            WHERE rp.role_id = ?

            ORDER BY p.name ASC
        `;

        db.all(
            sql,
            [roleId],
            (err, rows) => {

                if (err) {
                    return callback(err);
                }

                callback(
                    null,
                    rows.map(row => row.name)
                );
            }
        );
    }


    static getPermissionIds(
        roleId,
        callback
    ) {
        const sql = `
            SELECT permission_id
            FROM role_permissions
            WHERE role_id = ?
        `;

        db.all(
            sql,
            [roleId],
            (err, rows) => {

                if (err) {
                    return callback(err);
                }

                callback(
                    null,
                    rows.map(row => row.permission_id)
                );
            }
        );
    }


    static setPermissions(
        roleId,
        permissionIds,
        callback
    ) {
        db.serialize(() => {

            db.run(
                `
                    DELETE FROM role_permissions
                    WHERE role_id = ?
                `,
                [roleId],
                err => {

                    if (err) {
                        return callback(err);
                    }

                    if (!permissionIds.length) {
                        return callback(null);
                    }

                    const stmt = db.prepare(`
                        INSERT INTO role_permissions (
                            role_id,
                            permission_id
                        )
                        VALUES (?, ?)
                    `);

                    let error = null;

                    permissionIds.forEach(
                        permissionId => {

                            stmt.run(
                                roleId,
                                permissionId,
                                err => {
                                    if (err) {
                                        error = err;
                                    }
                                }
                            );
                        }
                    );

                    stmt.finalize(err => {

                        if (err) {
                            return callback(err);
                        }

                        if (error) {
                            return callback(error);
                        }

                        callback(null);
                    });
                }
            );
        });
    }


    static hasPermission(
        roleId,
        permissionName,
        callback
    ) {
        const sql = `
            SELECT 1
            FROM role_permissions rp

            INNER JOIN permissions p
                ON p.id = rp.permission_id

            WHERE
                rp.role_id = ?
                AND p.name = ?

            LIMIT 1
        `;

        db.get(
            sql,
            [
                roleId,
                permissionName
            ],
            (err, row) => {

                if (err) {
                    return callback(err);
                }

                callback(
                    null,
                    !!row
                );
            }
        );
    }
}

module.exports = Role;
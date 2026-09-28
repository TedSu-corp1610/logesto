const db = require('../config/database');

class Product {
    static create(
        categoryId,
        sku,
        name,
        description,
        purchasePrice,
        salePrice,
        minimumStock,
        unit,
        callback
    ) {
        const sql = `
            INSERT INTO products (
                category_id,
                sku,
                name,
                description,
                purchase_price,
                sale_price,
                minimum_stock,
                unit
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [
                categoryId || null,
                sku,
                name,
                description,
                purchasePrice,
                salePrice,
                minimumStock,
                unit
            ],
            function (err) {
                if (err) return callback(err);

                callback(null, {
                    id: this.lastID,
                    category_id: categoryId || null,
                    sku,
                    name,
                    description,
                    purchase_price: purchasePrice,
                    sale_price: salePrice,
                    minimum_stock: minimumStock,
                    unit
                });
            }
        );
    }

    static findAll(callback) {
        const sql = `
            SELECT
                p.*,
                c.name AS category_name
            FROM products p
            LEFT JOIN categories c
                ON c.id = p.category_id
            ORDER BY p.name ASC
        `;

        db.all(sql, [], (err, products) => {
            if (err) return callback(err);
            callback(null, products);
        });
    }

    static findById(id, callback) {
        const sql = `
            SELECT
                p.*,
                c.name AS category_name
            FROM products p
            LEFT JOIN categories c
                ON c.id = p.category_id
            WHERE p.id = ?
        `;

        db.get(sql, [id], (err, product) => {
            if (err) return callback(err);
            callback(null, product);
        });
    }

    static findBySku(sku, callback) {
        const sql = `
            SELECT *
            FROM products
            WHERE sku = ?
        `;

        db.get(sql, [sku], (err, product) => {
            if (err) return callback(err);
            callback(null, product);
        });
    }

    static update(
        id,
        categoryId,
        sku,
        name,
        description,
        purchasePrice,
        salePrice,
        minimumStock,
        unit,
        status,
        callback
    ) {
        const sql = `
            UPDATE products
            SET
                category_id = ?,
                sku = ?,
                name = ?,
                description = ?,
                purchase_price = ?,
                sale_price = ?,
                minimum_stock = ?,
                unit = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(
            sql,
            [
                categoryId || null,
                sku,
                name,
                description,
                purchasePrice,
                salePrice,
                minimumStock,
                unit,
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
            DELETE FROM products
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
            FROM products
        `;

        db.get(sql, [], (err, row) => {
            if (err) return callback(err);
            callback(null, row.total);
        });
    }

    static findSuppliers(productId, callback) {
        const sql = `
            SELECT
                s.*
            FROM suppliers s
            INNER JOIN product_suppliers ps
                ON ps.supplier_id = s.id
            WHERE ps.product_id = ?
            ORDER BY s.name ASC
        `;

        db.all(sql, [productId], (err, suppliers) => {
            if (err) return callback(err);
            callback(null, suppliers);
        });
    }

    static getSupplierIds(productId, callback) {
        const sql = `
            SELECT supplier_id
            FROM product_suppliers
            WHERE product_id = ?
        `;

        db.all(sql, [productId], (err, rows) => {
            if (err) return callback(err);

            callback(
                null,
                rows.map(row => row.supplier_id)
            );
        });
    }

    static setSuppliers(productId, supplierIds, callback) {
        const ids = Array.isArray(supplierIds)
            ? supplierIds
            : [];

        db.serialize(() => {
            db.run(
                `
                    DELETE FROM product_suppliers
                    WHERE product_id = ?
                `,
                [productId],
                err => {
                    if (err) return callback(err);

                    if (!ids.length) {
                        return callback(null);
                    }

                    const stmt = db.prepare(`
                        INSERT INTO product_suppliers (
                            product_id,
                            supplier_id
                        )
                        VALUES (?, ?)
                    `);

                    let firstError = null;

                    ids.forEach(supplierId => {
                        stmt.run(
                            [productId, supplierId],
                            err => {
                                if (err && !firstError) {
                                    firstError = err;
                                }
                            }
                        );
                    });

                    stmt.finalize(err => {
                        if (err) return callback(err);
                        if (firstError) {
                            return callback(firstError);
                        }

                        callback(null);
                    });
                }
            );
        });
    }
}

module.exports = Product;
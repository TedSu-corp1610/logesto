const db = require('./database');

db.serialize(() => {

    /*
     * =========================
     * TABLE ROLES
     * =========================
     */

    db.run(`
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT
        )
    `, (err) => {

        if (err) {
            console.error(
                'Erreur table roles :',
                err.message
            );
        } else {
            console.log('Table roles prête.');
        }

    });


    /*
     * =========================
     * TABLE PERMISSIONS
     * =========================
     */

    db.run(`
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT
        )
    `, (err) => {

        if (err) {
            console.error(
                'Erreur table permissions :',
                err.message
            );
        } else {
            console.log('Table permissions prête.');
        }

    });


    /*
     * =========================
     * TABLE ROLE_PERMISSIONS
     * =========================
     */

    db.run(`
        CREATE TABLE IF NOT EXISTS role_permissions (
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,

            PRIMARY KEY (
                role_id,
                permission_id
            ),

            FOREIGN KEY (role_id)
                REFERENCES roles(id)
                ON DELETE CASCADE,

            FOREIGN KEY (permission_id)
                REFERENCES permissions(id)
                ON DELETE CASCADE
        )
    `, (err) => {

        if (err) {
            console.error(
                'Erreur table role_permissions :',
                err.message
            );
        } else {
            console.log(
                'Table role_permissions prête.'
            );
        }

    });


    /*
     * =========================
     * TABLE USERS
     * =========================
     */

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            username TEXT NOT NULL UNIQUE,

            email TEXT NOT NULL UNIQUE,

            password TEXT NOT NULL,

            role_id INTEGER,

            created_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (role_id)
                REFERENCES roles(id)
        )
    `, (err) => {

        if (err) {
            console.error(
                'Erreur table users :',
                err.message
            );
        } else {
            console.log('Table users prête.');
        }

    });


    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (sender_id)
                REFERENCES users(id)
                ON DELETE CASCADE,

            FOREIGN KEY (receiver_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        )
    `);

    // Migration pour ajouter la colonne read_at si elle n'existe pas
    db.all("PRAGMA table_info(messages)", (err, columns) => {
        if (err) {
            console.error('Erreur vérification colonnes messages:', err);
            return;
        }

        const hasReadAt = columns.some(col => col.name === 'read_at');

        if (!hasReadAt) {
            db.run(`
                ALTER TABLE messages
                ADD COLUMN read_at DATETIME DEFAULT NULL
            `, (err) => {
                if (err) {
                    console.error('Erreur ajout colonne read_at:', err);
                } else {
                    console.log('Colonne read_at ajoutée.');
                }
            });
        }
    });

    //Migration pour ajouter la table magasin
    db.run(`
        CREATE TABLE IF NOT EXISTS stores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL UNIQUE,
            address TEXT,
            phone TEXT,
            email TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    //Migration ajouter la table emplacement
    db.run(`
        CREATE TABLE IF NOT EXISTS stock_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (store_id)
                REFERENCES stores(id)
                ON DELETE CASCADE,

            UNIQUE(store_id, code)
        )
    `);

    //Migration pour ajouter la table categorie
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    //Migration pour ajouter la table fournisseur
    db.run(`
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL UNIQUE,
            contact_name TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    //Migration pour ajouter la table produit
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            category_id INTEGER,

            sku TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            description TEXT,

            purchase_price REAL NOT NULL DEFAULT 0,
            sale_price REAL NOT NULL DEFAULT 0,

            minimum_stock REAL NOT NULL DEFAULT 0,

            unit TEXT NOT NULL DEFAULT 'piece',

            status TEXT NOT NULL DEFAULT 'active',

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (category_id)
                REFERENCES categories(id)
                ON DELETE SET NULL
        )
    `);

    //Migration pour ajouter la table product_suppliers (many-to-many)
    db.run(`
        CREATE TABLE IF NOT EXISTS product_suppliers (
            product_id INTEGER NOT NULL,
            supplier_id INTEGER NOT NULL,

            PRIMARY KEY (
                product_id,
                supplier_id
            ),

            FOREIGN KEY (product_id)
                REFERENCES products(id)
                ON DELETE CASCADE,

            FOREIGN KEY (supplier_id)
                REFERENCES suppliers(id)
                ON DELETE CASCADE
        )
    `);

    //Migration pour ajouter la table stock actuel
    db.run(`
        CREATE TABLE IF NOT EXISTS stocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            product_id INTEGER NOT NULL,
            location_id INTEGER NOT NULL,

            quantity REAL NOT NULL DEFAULT 0,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
                ON DELETE CASCADE,

            FOREIGN KEY (location_id)
                REFERENCES stock_locations(id)
                ON DELETE CASCADE,

            UNIQUE(product_id, location_id)
        )
    `);

    //Migration pour ajouter la table mouvements de stock
    db.run(`
        CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            product_id INTEGER NOT NULL,
            location_id INTEGER NOT NULL,

            type TEXT NOT NULL,

            quantity REAL NOT NULL,

            reason TEXT,
            reference TEXT,

            transfer_id INTEGER,

            user_id INTEGER,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
                ON DELETE CASCADE,

            FOREIGN KEY (location_id)
                REFERENCES stock_locations(id)
                ON DELETE CASCADE,

            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE SET NULL
        )
    `);

    //Migration pour ajouter la table transferts de stock
    db.run(`
        CREATE TABLE IF NOT EXISTS stock_transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            reference TEXT NOT NULL UNIQUE,

            product_id INTEGER NOT NULL,

            source_location_id INTEGER NOT NULL,
            destination_location_id INTEGER NOT NULL,

            quantity REAL NOT NULL,

            status TEXT NOT NULL DEFAULT 'PENDING',

            reason TEXT,

            created_by INTEGER,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
                ON DELETE CASCADE,

            FOREIGN KEY (source_location_id)
                REFERENCES stock_locations(id)
                ON DELETE RESTRICT,

            FOREIGN KEY (destination_location_id)
                REFERENCES stock_locations(id)
                ON DELETE RESTRICT,

            FOREIGN KEY (created_by)
                REFERENCES users(id)
                ON DELETE SET NULL
        )
    `);

    //Migration pour ajouter la table inventaires de stock
    db.run(`
        CREATE TABLE IF NOT EXISTS stock_inventories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            reference TEXT NOT NULL UNIQUE,

            location_id INTEGER NOT NULL,

            status TEXT NOT NULL DEFAULT 'DRAFT',

            created_by INTEGER,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,

            FOREIGN KEY (location_id)
                REFERENCES stock_locations(id)
                ON DELETE RESTRICT,

            FOREIGN KEY (created_by)
                REFERENCES users(id)
                ON DELETE SET NULL
        )
    `);

    //Migration pour ajouter la table items d'inventaire
    db.run(`
        CREATE TABLE IF NOT EXISTS stock_inventory_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            inventory_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,

            theoretical_quantity REAL NOT NULL DEFAULT 0,
            counted_quantity REAL NOT NULL DEFAULT 0,

            difference REAL NOT NULL DEFAULT 0,

            FOREIGN KEY (inventory_id)
                REFERENCES stock_inventories(id)
                ON DELETE CASCADE,

            FOREIGN KEY (product_id)
                REFERENCES products(id)
                ON DELETE RESTRICT,

            UNIQUE(inventory_id, product_id)
        )
    `);

    //Migration pour ajouter les index
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_stock_locations_store
        ON stock_locations(store_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_stocks_product
        ON stocks(product_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_stocks_location
        ON stocks(location_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_stock_movements_product
        ON stock_movements(product_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_stock_movements_location
        ON stock_movements(location_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_stock_movements_created
        ON stock_movements(created_at)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_stock_transfers_product
        ON stock_transfers(product_id)
    `);
});
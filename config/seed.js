const db = require('./database');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const roles = [
    {
        name: 'admin',
        description: 'Administrateur de l application'
    },
    {
        name: 'user',
        description: 'Utilisateur standard'
    }
];


const permissions = [
    {
        name: 'users.view',
        description: 'Consulter les utilisateurs'
    },
    {
        name: 'users.create',
        description: 'Créer un utilisateur'
    },
    {
        name: 'users.edit',
        description: 'Modifier un utilisateur'
    },
    {
        name: 'users.delete',
        description: 'Supprimer un utilisateur'
    },
    {
        name: 'roles.manage',
        description: 'Gérer les rôles'
    },
    {
        name: 'permissions.view',
        description: 'Consulter les permissions'
    },
    {
        name: 'permissions.manage',
        description: 'Gérer les permissions'
    },
    {
        name: 'roles.view',
        description: 'Consulter les rôles'
    },
    {
        name: 'profile.view',
        description: 'Consulter son profil'
    },
    {
        name: 'profile.edit',
        description: 'Modifier son profil'
    },
    {
        name: 'chat.use',
        description: 'Utiliser le chat'
    },
    {
        name: 'stores.view',
        description: 'Consulter les magasins'
    },
    {
        name: 'stores.manage',
        description: 'Gérer les magasins'
    },
    {
        name: 'locations.view',
        description: 'Consulter les emplacements'
    },
    {
        name: 'locations.manage',
        description: 'Gérer les emplacements'
    },
    {
        name: 'categories.view',
        description: 'Consulter les catégories'
    },
    {
        name: 'categories.manage',
        description: 'Gérer les catégories'
    },
    {
        name: 'suppliers.view',
        description: 'Consulter les fournisseurs'
    },
    {
        name: 'suppliers.manage',
        description: 'Gérer les fournisseurs'
    },
    {
        name: 'products.view',
        description: 'Consulter les produits'
    },
    {
        name: 'products.manage',
        description: 'Gérer les produits'
    },
    {
        name: 'stock.view',
        description: 'Consulter les stocks'
    },
    {
        name: 'stock.manage',
        description: 'Gérer les stocks'
    },
    {
        name: 'stock.transfers.view',
        description: 'Consulter les transferts de stock'
    },
    {
        name: 'stock.transfers.manage',
        description: 'Gérer les transferts de stock'
    },
    {
        name: 'stock.inventory',
        description: 'Gérer les inventaires'
    }
];


db.serialize(() => {

    /*
     * Création des rôles
     */

    const roleStatement = db.prepare(`
        INSERT OR IGNORE INTO roles (
            name,
            description
        )
        VALUES (?, ?)
    `);

    roles.forEach(role => {

        roleStatement.run(
            role.name,
            role.description
        );

    });

    roleStatement.finalize();


    /*
     * Création des permissions
     */

    const permissionStatement = db.prepare(`
        INSERT OR IGNORE INTO permissions (
            name,
            description
        )
        VALUES (?, ?)
    `);

    permissions.forEach(permission => {

        permissionStatement.run(
            permission.name,
            permission.description
        );

    });

    permissionStatement.finalize();


    /*
     * Attribution des permissions à admin
     */

    db.get(
        `SELECT id FROM roles WHERE name = 'admin'`,
        (err, adminRole) => {

            if (err) {
                console.error(err);
                return;
            }

            db.all(
                `SELECT id FROM permissions`,
                (err, permissions) => {

                    if (err) {
                        console.error(err);
                        return;
                    }

                    const statement = db.prepare(`
                        INSERT OR IGNORE INTO
                        role_permissions (
                            role_id,
                            permission_id
                        )
                        VALUES (?, ?)
                    `);

                    permissions.forEach(permission => {

                        statement.run(
                            adminRole.id,
                            permission.id
                        );

                    });

                    statement.finalize(() => {

                        console.log(
                            'Permissions admin initialisées.'
                        );

                    });

                }
            );

        }
    );

    /*
    * Attribution du rôle "user"
    * aux utilisateurs qui n'en ont pas.
    */

    db.get(
        `SELECT id FROM roles WHERE name = 'user'`,
        (err, userRole) => {

            if (err) {
                console.error(err);
                return;
            }

            if (!userRole) {
                console.error(
                    'Le rôle user est introuvable.'
                );

                return;
            }

            db.run(
                `
                    UPDATE users
                    SET role_id = ?
                    WHERE role_id IS NULL
                `,
                [userRole.id],
                (err) => {

                    if (err) {
                        console.error(err);
                        return;
                    }

                    console.log(
                        'Rôles utilisateurs initialisés.'
                    );
                }
            );
        }
    );

    /*
    * Création du super admin
    */

    const superAdminPath = path.join(__dirname, '../database/SuperAdmin.json');

    fs.readFile(superAdminPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lecture SuperAdmin.json:', err);
            return;
        }

        try {
            const superAdminData = JSON.parse(data);

            // Vérifier si le super admin existe déjà
            db.get(
                `SELECT id FROM users WHERE email = ?`,
                [superAdminData.email],
                (err, existingUser) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    if (existingUser) {
                        console.log('Super admin existe déjà.');
                        return;
                    }

                    // Récupérer le rôle admin
                    db.get(
                        `SELECT id FROM roles WHERE name = 'admin'`,
                        (err, adminRole) => {
                            if (err) {
                                console.error(err);
                                return;
                            }

                            if (!adminRole) {
                                console.error('Rôle admin introuvable.');
                                return;
                            }

                            // Hasher le mot de passe
                            bcrypt.hash(superAdminData.password, 10, (err, hashedPassword) => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }

                                // Créer le super admin
                                db.run(
                                    `
                                        INSERT INTO users (
                                            username,
                                            email,
                                            password,
                                            role_id
                                        )
                                        VALUES (?, ?, ?, ?)
                                    `,
                                    [
                                        superAdminData.username,
                                        superAdminData.email,
                                        hashedPassword,
                                        adminRole.id
                                    ],
                                    (err) => {
                                        if (err) {
                                            console.error(err);
                                            return;
                                        }

                                        console.log('Super admin créé avec succès.');
                                    }
                                );
                            });
                        }
                    );
                }
            );
        } catch (parseError) {
            console.error('Erreur parsing SuperAdmin.json:', parseError);
        }
    });

});
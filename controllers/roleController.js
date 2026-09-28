const Role = require('../models/Role');
const Permission = require('../models/Permission');

const RoleController = {

    index: (req, res) => {

        Role.findAll((err, roles) => {

            if (err) {
                console.error(
                    'Erreur chargement rôles:',
                    err
                );

                return res.status(500).render(
                    'error',
                    {
                        title: 'Erreur',
                        message:
                            'Impossible de charger les rôles.'
                    }
                );
            }

            res.render('roles/index', {
                title: 'Rôles',
                pageTitle: 'Rôles',
                breadcrumb: 'Rôles',
                activePage: 'roles',
                roles
            });
        });
    },


    createForm: (req, res) => {

        res.render('roles/create', {
            title: 'Nouveau rôle',
            pageTitle: 'Nouveau rôle',
            breadcrumb: 'Rôles / Nouveau',
            activePage: 'roles'
        });
    },


    create: (req, res) => {

        const name =
            (req.body.name || '').trim();

        const description =
            (req.body.description || '').trim();

        if (!name) {
            return res.status(400).render(
                'error',
                {
                    title: 'Erreur',
                    message:
                        'Le nom du rôle est obligatoire.'
                }
            );
        }

        Role.create(
            name,
            description,
            err => {

                if (err) {
                    console.error(
                        'Erreur création rôle:',
                        err
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de créer le rôle.'
                        }
                    );
                }

                res.redirect('/roles');
            }
        );
    },


    editForm: (req, res) => {

        const roleId =
            Number(req.params.id);

        Role.findById(
            roleId,
            (err, role) => {

                if (err || !role) {
                    return res.status(404).render(
                        'error',
                        {
                            title: 'Rôle introuvable',
                            message:
                                'Ce rôle n’existe pas.'
                        }
                    );
                }

                Permission.findAll(
                    (permissionErr, permissions) => {

                        if (permissionErr) {
                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de charger les permissions.'
                                }
                            );
                        }

                        Role.getPermissionIds(
                            roleId,
                            (idsErr, rolePermissionIds) => {

                                if (idsErr) {
                                    return res.status(500)
                                        .render(
                                            'error',
                                            {
                                                title: 'Erreur',
                                                message:
                                                    'Impossible de charger les permissions du rôle.'
                                            }
                                        );
                                }

                                res.render(
                                    'roles/edit',
                                    {
                                        title: 'Modifier le rôle',
                                        pageTitle:
                                            'Modifier le rôle',
                                        breadcrumb:
                                            'Rôles / Modifier',
                                        activePage:
                                            'roles',

                                        role,

                                        permissions,

                                        rolePermissionIds
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    },


    update: (req, res) => {

        const roleId =
            Number(req.params.id);

        const name =
            (req.body.name || '').trim();

        const description =
            (req.body.description || '').trim();

        if (!name) {
            return res.status(400).render(
                'error',
                {
                    title: 'Erreur',
                    message:
                        'Le nom du rôle est obligatoire.'
                }
            );
        }

        Role.update(
            roleId,
            name,
            description,
            err => {

                if (err) {
                    console.error(
                        'Erreur modification rôle:',
                        err
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de modifier le rôle.'
                        }
                    );
                }

                let permissionIds =
                    req.body.permissions || [];

                if (!Array.isArray(permissionIds)) {
                    permissionIds = [
                        permissionIds
                    ];
                }

                permissionIds =
                    permissionIds
                        .map(Number)
                        .filter(Number.isInteger);

                Role.setPermissions(
                    roleId,
                    permissionIds,
                    permissionErr => {

                        if (permissionErr) {
                            console.error(
                                'Erreur permissions rôle:',
                                permissionErr
                            );

                            return res.status(500)
                                .render(
                                    'error',
                                    {
                                        title: 'Erreur',
                                        message:
                                            'Le rôle a été modifié mais ses permissions n’ont pas pu être enregistrées.'
                                    }
                                );
                        }

                        res.redirect('/roles');
                    }
                );
            }
        );
    },


    delete: (req, res) => {

        const roleId =
            Number(req.params.id);

        Role.delete(
            roleId,
            err => {

                if (err) {
                    console.error(
                        'Erreur suppression rôle:',
                        err
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de supprimer le rôle.'
                        }
                    );
                }

                res.redirect('/roles');
            }
        );
    }
};

module.exports = RoleController;
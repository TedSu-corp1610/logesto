const Permission = require('../models/Permission');

const PermissionController = {

    index: (req, res) => {

        Permission.findAll((err, permissions) => {

            if (err) {
                console.error(
                    'Erreur chargement permissions:',
                    err
                );

                return res.status(500).render(
                    'error',
                    {
                        title: 'Erreur',
                        message:
                            'Impossible de charger les permissions.'
                    }
                );
            }

            res.render(
                'permissions/index',
                {
                    title: 'Permissions',
                    pageTitle: 'Permissions',
                    breadcrumb: 'Permissions',
                    activePage: 'permissions',
                    permissions
                }
            );
        });
    },


    createForm: (req, res) => {

        res.render(
            'permissions/create',
            {
                title: 'Nouvelle permission',
                pageTitle: 'Nouvelle permission',
                breadcrumb: 'Permissions / Nouvelle',
                activePage: 'permissions'
            }
        );
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
                        'Le nom de la permission est obligatoire.'
                }
            );
        }


        Permission.findByName(
            name,
            (findErr, existingPermission) => {

                if (findErr) {

                    console.error(
                        'Erreur recherche permission:',
                        findErr
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de vérifier la permission.'
                        }
                    );
                }


                if (existingPermission) {

                    return res.status(400).render(
                        'error',
                        {
                            title: 'Permission existante',
                            message:
                                'Une permission avec ce nom existe déjà.'
                        }
                    );
                }


                Permission.create(
                    name,
                    description,
                    err => {

                        if (err) {

                            console.error(
                                'Erreur création permission:',
                                err
                            );

                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de créer la permission.'
                                }
                            );
                        }

                        res.redirect('/permissions');
                    }
                );
            }
        );
    },


    editForm: (req, res) => {

        const permissionId =
            Number(req.params.id);


        Permission.findById(
            permissionId,
            (err, permission) => {

                if (err || !permission) {

                    return res.status(404).render(
                        'error',
                        {
                            title: 'Permission introuvable',
                            message:
                                'Cette permission n’existe pas.'
                        }
                    );
                }


                res.render(
                    'permissions/edit',
                    {
                        title: 'Modifier la permission',
                        pageTitle: 'Modifier la permission',
                        breadcrumb: 'Permissions / Modifier',
                        activePage: 'permissions',
                        permission
                    }
                );
            }
        );
    },


    update: (req, res) => {

        const permissionId =
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
                        'Le nom de la permission est obligatoire.'
                }
            );
        }


        Permission.findByName(
            name,
            (findErr, existingPermission) => {

                if (findErr) {

                    console.error(
                        'Erreur recherche permission:',
                        findErr
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de vérifier la permission.'
                        }
                    );
                }


                if (
                    existingPermission &&
                    existingPermission.id !== permissionId
                ) {

                    return res.status(400).render(
                        'error',
                        {
                            title: 'Permission existante',
                            message:
                                'Une autre permission utilise déjà ce nom.'
                        }
                    );
                }


                Permission.update(
                    permissionId,
                    name,
                    description,
                    err => {

                        if (err) {

                            console.error(
                                'Erreur modification permission:',
                                err
                            );

                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de modifier la permission.'
                                }
                            );
                        }

                        res.redirect('/permissions');
                    }
                );
            }
        );
    },


    delete: (req, res) => {

        const permissionId =
            Number(req.params.id);


        Permission.delete(
            permissionId,
            err => {

                if (err) {

                    console.error(
                        'Erreur suppression permission:',
                        err
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de supprimer la permission.'
                        }
                    );
                }


                res.redirect('/permissions');
            }
        );
    }
};


module.exports = PermissionController;
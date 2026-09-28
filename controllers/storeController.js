const Store = require('../models/Store');

const StoreController = {

    index: (req, res) => {

        Store.findAll((err, stores) => {

            if (err) {
                console.error(
                    'Erreur chargement magasins:',
                    err
                );

                return res.status(500).render(
                    'error',
                    {
                        title: 'Erreur',
                        message:
                            'Impossible de charger les magasins.'
                    }
                );
            }

            res.render(
                'stores/index',
                {
                    title: 'Magasins',
                    pageTitle: 'Magasins',
                    breadcrumb: 'Magasins',
                    activePage: 'stores',
                    stores
                }
            );
        });
    },


    createForm: (req, res) => {

        res.render(
            'stores/create',
            {
                title: 'Nouveau magasin',
                pageTitle: 'Nouveau magasin',
                breadcrumb: 'Magasins / Nouveau',
                activePage: 'stores'
            }
        );
    },


    create: (req, res) => {

        const name =
            (req.body.name || '').trim();

        const code =
            (req.body.code || '').trim().toUpperCase();

        const address =
            (req.body.address || '').trim();

        const phone =
            (req.body.phone || '').trim();

        const email =
            (req.body.email || '').trim();


        if (!name || !code) {

            return res.status(400).render(
                'error',
                {
                    title: 'Erreur',
                    message:
                        'Le nom et le code du magasin sont obligatoires.'
                }
            );
        }


        Store.findByCode(
            code,
            (findErr, existingStore) => {

                if (findErr) {

                    console.error(
                        'Erreur recherche magasin:',
                        findErr
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de vérifier le code du magasin.'
                        }
                    );
                }


                if (existingStore) {

                    return res.status(400).render(
                        'error',
                        {
                            title: 'Code existant',
                            message:
                                'Un magasin utilise déjà ce code.'
                        }
                    );
                }


                Store.create(
                    name,
                    code,
                    address,
                    phone,
                    email,
                    err => {

                        if (err) {

                            console.error(
                                'Erreur création magasin:',
                                err
                            );

                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de créer le magasin.'
                                }
                            );
                        }

                        res.redirect('/stores');
                    }
                );
            }
        );
    },


    editForm: (req, res) => {

        const storeId =
            Number(req.params.id);


        Store.findById(
            storeId,
            (err, store) => {

                if (err || !store) {

                    return res.status(404).render(
                        'error',
                        {
                            title: 'Magasin introuvable',
                            message:
                                'Ce magasin n’existe pas.'
                        }
                    );
                }


                res.render(
                    'stores/edit',
                    {
                        title: 'Modifier le magasin',
                        pageTitle: 'Modifier le magasin',
                        breadcrumb: 'Magasins / Modifier',
                        activePage: 'stores',
                        store
                    }
                );
            }
        );
    },


    update: (req, res) => {

        const storeId =
            Number(req.params.id);

        const name =
            (req.body.name || '').trim();

        const code =
            (req.body.code || '').trim().toUpperCase();

        const address =
            (req.body.address || '').trim();

        const phone =
            (req.body.phone || '').trim();

        const email =
            (req.body.email || '').trim();

        const status =
            req.body.status === 'inactive'
                ? 'inactive'
                : 'active';


        if (!name || !code) {

            return res.status(400).render(
                'error',
                {
                    title: 'Erreur',
                    message:
                        'Le nom et le code du magasin sont obligatoires.'
                }
            );
        }


        Store.findByCode(
            code,
            (findErr, existingStore) => {

                if (findErr) {

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de vérifier le code du magasin.'
                        }
                    );
                }


                if (
                    existingStore &&
                    existingStore.id !== storeId
                ) {

                    return res.status(400).render(
                        'error',
                        {
                            title: 'Code existant',
                            message:
                                'Un autre magasin utilise déjà ce code.'
                        }
                    );
                }


                Store.update(
                    storeId,
                    name,
                    code,
                    address,
                    phone,
                    email,
                    status,
                    err => {

                        if (err) {

                            console.error(
                                'Erreur modification magasin:',
                                err
                            );

                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de modifier le magasin.'
                                }
                            );
                        }

                        res.redirect('/stores');
                    }
                );
            }
        );
    },


    delete: (req, res) => {

        const storeId =
            Number(req.params.id);


        Store.delete(
            storeId,
            err => {

                if (err) {

                    console.error(
                        'Erreur suppression magasin:',
                        err
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de supprimer le magasin.'
                        }
                    );
                }

                res.redirect('/stores');
            }
        );
    }
};

module.exports = StoreController;
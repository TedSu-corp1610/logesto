const StockLocation = require('../models/StockLocation');
const Store = require('../models/Store');

const StockLocationController = {

    index: (req, res) => {

        StockLocation.findAll((err, locations) => {

            if (err) {
                console.error(
                    'Erreur chargement emplacements:',
                    err
                );

                return res.status(500).render(
                    'error',
                    {
                        title: 'Erreur',
                        message:
                            'Impossible de charger les emplacements.'
                    }
                );
            }

            res.render(
                'stockLocations/index',
                {
                    title: 'Emplacements',
                    pageTitle: 'Emplacements',
                    breadcrumb: 'Emplacements',
                    activePage: 'stockLocations',
                    locations
                }
            );
        });
    },


    createForm: (req, res) => {

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
                'stockLocations/create',
                {
                    title: 'Nouvel emplacement',
                    pageTitle: 'Nouvel emplacement',
                    breadcrumb:
                        'Emplacements / Nouveau',
                    activePage: 'stockLocations',
                    stores
                }
            );
        });
    },


    create: (req, res) => {

        const storeId =
            Number(req.body.store_id);

        const name =
            (req.body.name || '').trim();

        const code =
            (req.body.code || '').trim().toUpperCase();

        const description =
            (req.body.description || '').trim();


        if (
            !Number.isInteger(storeId) ||
            storeId <= 0 ||
            !name ||
            !code
        ) {

            return res.status(400).render(
                'error',
                {
                    title: 'Erreur',
                    message:
                        'Le magasin, le nom et le code sont obligatoires.'
                }
            );
        }


        Store.findById(
            storeId,
            (storeErr, store) => {

                if (storeErr || !store) {

                    return res.status(400).render(
                        'error',
                        {
                            title: 'Magasin invalide',
                            message:
                                'Le magasin sélectionné n’existe pas.'
                        }
                    );
                }


                StockLocation.findByCode(
                    storeId,
                    code,
                    (findErr, existingLocation) => {

                        if (findErr) {

                            console.error(
                                'Erreur recherche emplacement:',
                                findErr
                            );

                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de vérifier le code de l’emplacement.'
                                }
                            );
                        }


                        if (existingLocation) {

                            return res.status(400).render(
                                'error',
                                {
                                    title: 'Code existant',
                                    message:
                                        'Ce code existe déjà dans ce magasin.'
                                }
                            );
                        }


                        StockLocation.create(
                            storeId,
                            name,
                            code,
                            description,
                            err => {

                                if (err) {

                                    console.error(
                                        'Erreur création emplacement:',
                                        err
                                    );

                                    return res.status(500).render(
                                        'error',
                                        {
                                            title: 'Erreur',
                                            message:
                                                'Impossible de créer l’emplacement.'
                                        }
                                    );
                                }

                                res.redirect(
                                    '/stock-locations'
                                );
                            }
                        );
                    }
                );
            }
        );
    },


    editForm: (req, res) => {

        const locationId =
            Number(req.params.id);


        StockLocation.findById(
            locationId,
            (locationErr, location) => {

                if (
                    locationErr ||
                    !location
                ) {

                    return res.status(404).render(
                        'error',
                        {
                            title: 'Emplacement introuvable',
                            message:
                                'Cet emplacement n’existe pas.'
                        }
                    );
                }


                Store.findAll(
                    (storeErr, stores) => {

                        if (storeErr) {

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
                            'stockLocations/edit',
                            {
                                title:
                                    'Modifier l\’emplacement',

                                pageTitle:
                                    'Modifier l\’emplacement',

                                breadcrumb:
                                    'Emplacements / Modifier',

                                activePage:
                                    'stockLocations',

                                location,
                                stores
                            }
                        );
                    }
                );
            }
        );
    },


    update: (req, res) => {

        const locationId =
            Number(req.params.id);

        const storeId =
            Number(req.body.store_id);

        const name =
            (req.body.name || '').trim();

        const code =
            (req.body.code || '').trim().toUpperCase();

        const description =
            (req.body.description || '').trim();

        const status =
            req.body.status === 'inactive'
                ? 'inactive'
                : 'active';


        if (
            !Number.isInteger(locationId) ||
            !Number.isInteger(storeId) ||
            storeId <= 0 ||
            !name ||
            !code
        ) {

            return res.status(400).render(
                'error',
                {
                    title: 'Erreur',
                    message:
                        'Le magasin, le nom et le code sont obligatoires.'
                }
            );
        }


        Store.findById(
            storeId,
            (storeErr, store) => {

                if (
                    storeErr ||
                    !store
                ) {

                    return res.status(400).render(
                        'error',
                        {
                            title: 'Magasin invalide',
                            message:
                                'Le magasin sélectionné n’existe pas.'
                        }
                    );
                }


                StockLocation.findByCode(
                    storeId,
                    code,
                    (findErr, existingLocation) => {

                        if (findErr) {

                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de vérifier le code de l’emplacement.'
                                }
                            );
                        }


                        if (
                            existingLocation &&
                            existingLocation.id !== locationId
                        ) {

                            return res.status(400).render(
                                'error',
                                {
                                    title: 'Code existant',
                                    message:
                                        'Un autre emplacement utilise déjà ce code dans ce magasin.'
                                }
                            );
                        }


                        StockLocation.update(
                            locationId,
                            storeId,
                            name,
                            code,
                            description,
                            status,
                            err => {

                                if (err) {

                                    console.error(
                                        'Erreur modification emplacement:',
                                        err
                                    );

                                    return res.status(500).render(
                                        'error',
                                        {
                                            title: 'Erreur',
                                            message:
                                                'Impossible de modifier l’emplacement.'
                                        }
                                    );
                                }

                                res.redirect(
                                    '/stock-locations'
                                );
                            }
                        );
                    }
                );
            }
        );
    },


    delete: (req, res) => {

        const locationId =
            Number(req.params.id);


        StockLocation.delete(
            locationId,
            err => {

                if (err) {

                    console.error(
                        'Erreur suppression emplacement:',
                        err
                    );

                    return res.status(500).render(
                        'error',
                        {
                            title: 'Erreur',
                            message:
                                'Impossible de supprimer l’emplacement.'
                        }
                    );
                }

                res.redirect(
                    '/stock-locations'
                );
            }
        );
    }
};


module.exports = StockLocationController;
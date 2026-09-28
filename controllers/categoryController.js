const Category = require('../models/Category');

class CategoryController {
    static index(req, res) {
        Category.findAll((err, categories) => {
            if (err) {
                console.error('Erreur chargement catégories:', err);

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message: 'Impossible de charger les catégories.'
                });
            }

            res.render('categories/index', {
                title: 'Catégories',
                categories
            });
        });
    }

    static createForm(req, res) {
        res.render('categories/create', {
            title: 'Nouvelle catégorie'
        });
    }

    static create(req, res) {
        const name = String(req.body.name || '').trim();
        const description = String(req.body.description || '').trim();

        if (!name) {
            return res.status(400).render('categories/create', {
                title: 'Nouvelle catégorie',
                error: 'Le nom de la catégorie est obligatoire.',
                form: {
                    name,
                    description
                }
            });
        }

        Category.findByName(name, (err, existingCategory) => {
            if (err) {
                console.error('Erreur vérification catégorie:', err);

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message: 'Impossible de vérifier la catégorie.'
                });
            }

            if (existingCategory) {
                return res.status(400).render('categories/create', {
                    title: 'Nouvelle catégorie',
                    error: 'Cette catégorie existe déjà.',
                    form: {
                        name,
                        description
                    }
                });
            }

            Category.create(name, description, err => {
                if (err) {
                    console.error('Erreur création catégorie:', err);

                    return res.status(500).render('error', {
                        title: 'Erreur',
                        message: 'Impossible de créer la catégorie.'
                    });
                }

                res.redirect('/categories');
            });
        });
    }

    static editForm(req, res) {
        const { id } = req.params;

        Category.findById(id, (err, category) => {
            if (err) {
                console.error('Erreur chargement catégorie:', err);

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message: 'Impossible de charger la catégorie.'
                });
            }

            if (!category) {
                return res.status(404).render('error', {
                    title: 'Catégorie introuvable',
                    message: 'Cette catégorie n’existe pas.'
                });
            }

            res.render('categories/edit', {
                title: 'Modifier la catégorie',
                category
            });
        });
    }

    static update(req, res) {
        const { id } = req.params;

        const name = String(req.body.name || '').trim();
        const description = String(req.body.description || '').trim();
        const status = req.body.status === 'inactive'
            ? 'inactive'
            : 'active';

        if (!name) {
            return res.status(400).render('categories/edit', {
                title: 'Modifier la catégorie',
                error: 'Le nom de la catégorie est obligatoire.',
                category: {
                    id,
                    name,
                    description,
                    status
                }
            });
        }

        Category.findByName(name, (err, existingCategory) => {
            if (err) {
                console.error('Erreur vérification catégorie:', err);

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message: 'Impossible de vérifier la catégorie.'
                });
            }

            if (
                existingCategory &&
                String(existingCategory.id) !== String(id)
            ) {
                return res.status(400).render('categories/edit', {
                    title: 'Modifier la catégorie',
                    error: 'Une autre catégorie utilise déjà ce nom.',
                    category: {
                        id,
                        name,
                        description,
                        status
                    }
                });
            }

            Category.update(
                id,
                name,
                description,
                status,
                err => {
                    if (err) {
                        console.error('Erreur modification catégorie:', err);

                        return res.status(500).render('error', {
                            title: 'Erreur',
                            message: 'Impossible de modifier la catégorie.'
                        });
                    }

                    res.redirect('/categories');
                }
            );
        });
    }

    static delete(req, res) {
        const { id } = req.params;

        Category.delete(id, err => {
            if (err) {
                console.error('Erreur suppression catégorie:', err);

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message: 'Impossible de supprimer la catégorie.'
                });
            }

            res.redirect('/categories');
        });
    }
}

module.exports = CategoryController;
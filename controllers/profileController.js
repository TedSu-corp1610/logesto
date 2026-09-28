const bcrypt = require('bcrypt');

const User = require('../models/User');

const ProfileController = {

    index: (req, res) => {

        const userId = req.session.user.id;

        User.findById(userId, (err, user) => {

            if (err) {
                console.error(
                    'Erreur chargement profil:',
                    err
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message: 'Impossible de charger votre profil.'
                });
            }

            if (!user) {
                return res.status(404).render('error', {
                    title: 'Profil introuvable',
                    message: 'Utilisateur introuvable.'
                });
            }

            let success = null;

            if (req.query.success === 'profile') {
                success = 'Votre profil a été mis à jour avec succès.';
            }

            if (req.query.success === 'password') {
                success = 'Votre mot de passe a été modifié avec succès.';
            }

            res.render('profile/index', {
                title: 'Mon profil',
                pageTitle: 'Mon profil',
                breadcrumb: 'Mon profil',
                activePage: 'profile',
                user,
                success
            });
        });
    },

    update: (req, res) => {

        const userId = req.session.user.id;

        const username =
            (req.body.username || '').trim();

        const email =
            (req.body.email || '').trim();

        if (!username || !email) {
            return res.status(400).render('error', {
                title: 'Erreur',
                message: 'Le nom d’utilisateur et l’email sont obligatoires.'
            });
        }

        User.updateProfile(
            userId,
            username,
            email,
            (err) => {

                if (err) {
                    console.error(
                        'Erreur modification profil:',
                        err
                    );

                    return res.status(500).render('error', {
                        title: 'Erreur',
                        message:
                            'Impossible de modifier votre profil.'
                    });
                }

                req.session.user.username = username;
                req.session.user.email = email;

                res.redirect('/profile?success=profile');
            }
        );
    },

    updatePassword: (req, res) => {

        const userId = req.session.user.id;

        const currentPassword =
            req.body.currentPassword || '';

        const newPassword =
            req.body.newPassword || '';

        const confirmPassword =
            req.body.confirmPassword || '';

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).render('error', {
                title: 'Erreur',
                message:
                    'Tous les champs du mot de passe sont obligatoires.'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).render('error', {
                title: 'Erreur',
                message:
                    'Les nouveaux mots de passe ne correspondent pas.'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).render('error', {
                title: 'Erreur',
                message:
                    'Le nouveau mot de passe doit contenir au moins 8 caractères.'
            });
        }

        User.findById(userId, (err, user) => {

            if (err) {
                console.error(
                    'Erreur recherche utilisateur:',
                    err
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message:
                        'Impossible de vérifier votre mot de passe.'
                });
            }

            if (!user) {
                return res.status(404).render('error', {
                    title: 'Erreur',
                    message: 'Utilisateur introuvable.'
                });
            }

            bcrypt.compare(
                currentPassword,
                user.password,
                (compareErr, match) => {

                    if (compareErr) {
                        console.error(
                            'Erreur vérification mot de passe:',
                            compareErr
                        );

                        return res.status(500).render('error', {
                            title: 'Erreur',
                            message:
                                'Impossible de vérifier votre mot de passe.'
                        });
                    }

                    if (!match) {
                        return res.status(400).render('error', {
                            title: 'Erreur',
                            message:
                                'Le mot de passe actuel est incorrect.'
                        });
                    }

                    bcrypt.hash(
                        newPassword,
                        10,
                        (hashErr, hash) => {

                            if (hashErr) {
                                console.error(
                                    'Erreur hash mot de passe:',
                                    hashErr
                                );

                                return res.status(500).render(
                                    'error',
                                    {
                                        title: 'Erreur',
                                        message:
                                            'Impossible de modifier votre mot de passe.'
                                    }
                                );
                            }

                            User.updatePassword(
                                userId,
                                hash,
                                (updateErr) => {

                                    if (updateErr) {
                                        console.error(
                                            'Erreur mise à jour mot de passe:',
                                            updateErr
                                        );

                                        return res.status(500)
                                            .render(
                                                'error',
                                                {
                                                    title: 'Erreur',
                                                    message:
                                                        'Impossible de modifier votre mot de passe.'
                                                }
                                            );
                                    }

                                    res.redirect(
                                        '/profile?success=password'
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    }
};

module.exports = ProfileController;
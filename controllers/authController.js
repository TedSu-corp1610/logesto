const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');

const AuthController = {

    showRegister: (req, res) => {
        res.render('auth/register', {
            title: 'Créer un compte'
        });
    },


    register: async (req, res) => {

        const { username, email, password, password_confirm } = req.body;

        // Vérification des champs
        if (!username || !email || !password || !password_confirm) {
            return res.render('auth/register', {
                title: 'Créer un compte',
                error: 'Tous les champs sont obligatoires.',
                username,
                email
            });
        }

        // Vérification des mots de passe
        if (password !== password_confirm) {
            return res.render('auth/register', {
                title: 'Créer un compte',
                error: 'Les mots de passe ne correspondent pas.',
                username,
                email
            });
        }

        try {

            // Vérifier si l'email existe déjà
            User.findByEmail(email, async (err, existingUser) => {

                if (err) {
                    console.error(err);

                    return res.render('auth/register', {
                        title: 'Créer un compte',
                        error: 'Une erreur est survenue.',
                        username,
                        email
                    });
                }

                if (existingUser) {
                    return res.render('auth/register', {
                        title: 'Créer un compte',
                        error: 'Cette adresse email est déjà utilisée.',
                        username,
                        email
                    });
                }

                // Hachage du mot de passe
                const hashedPassword = await bcrypt.hash(password, 10);

                // Création de l'utilisateur
                Role.findByName(
                    'user',
                    (err, userRole) => {

                        if (err || !userRole) {

                            console.error(err);

                            return res.render('auth/register', {
                                title: 'Créer un compte',
                                error: 'Impossible de déterminer le rôle du compte.',
                                username,
                                email
                            });
                        }

                        User.create(
                            username,
                            email,
                            hashedPassword,
                            userRole.id,
                            (err, user) => {

                                if (err) {

                                    console.error(err);

                                    return res.render('auth/register', {
                                        title: 'Créer un compte',
                                        error: 'Impossible de créer le compte.',
                                        username,
                                        email
                                    });
                                }

                                res.redirect('/login');
                            }
                        );
                    }
                );
                
            });

        } catch (error) {

            console.error(error);

            res.render('auth/register', {
                title: 'Créer un compte',
                error: 'Une erreur est survenue.',
                username,
                email
            });
        }
    },


    showLogin: (req, res) => {

        res.render('auth/login', {
            title: 'Connexion'
        });
    },


    login: (req, res) => {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.render('auth/login', {
                title: 'Connexion',
                error: 'Veuillez remplir tous les champs.',
                email
            });
        }

        User.findByEmail(email, async (err, user) => {

            if (err) {
                console.error(err);

                return res.render('auth/login', {
                    title: 'Connexion',
                    error: 'Une erreur est survenue.',
                    email
                });
            }

            if (!user) {
                return res.render('auth/login', {
                    title: 'Connexion',
                    error: 'Email ou mot de passe incorrect.',
                    email
                });
            }

            const passwordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordValid) {
                return res.render('auth/login', {
                    title: 'Connexion',
                    error: 'Email ou mot de passe incorrect.',
                    email
                });
            }

            // Création de la session
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role_id: user.role_id,
                role_name: user.role_name
            };

            res.redirect('/dashboard');
        });
    },


    logout: (req, res) => {

        req.session.destroy((err) => {

            if (err) {
                console.error(err);
            }

            res.redirect('/login');
        });
    }

};

module.exports = AuthController;
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const DashboardController = {

    index: (req, res) => {

        User.count((userErr, users) => {

            if (userErr) {
                console.error(
                    'Erreur compteur utilisateurs:',
                    userErr
                );

                return res.status(500).render('error', {
                    title: 'Erreur',
                    message: 'Impossible de charger le dashboard.'
                });
            }

            Role.count((roleErr, roles) => {

                if (roleErr) {
                    console.error(
                        'Erreur compteur rôles:',
                        roleErr
                    );

                    return res.status(500).render('error', {
                        title: 'Erreur',
                        message: 'Impossible de charger le dashboard.'
                    });
                }

                Permission.count(
                    (permissionErr, permissions) => {

                        if (permissionErr) {
                            console.error(
                                'Erreur compteur permissions:',
                                permissionErr
                            );

                            return res.status(500).render(
                                'error',
                                {
                                    title: 'Erreur',
                                    message:
                                        'Impossible de charger le dashboard.'
                                }
                            );
                        }

                        res.render('dashboard', {
                            title: 'Dashboard',
                            pageTitle: 'Dashboard',
                            breadcrumb: 'Accueil',
                            activePage: 'dashboard',

                            user: req.session.user,

                            stats: {
                                users,
                                roles,
                                messages: 0,
                                permissions
                            }
                        });
                    }
                );
            });
        });
    }

};

module.exports = DashboardController;
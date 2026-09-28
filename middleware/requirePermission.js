const Role = require('../models/Role');

function requirePermission(permissionName) {

    return (req, res, next) => {

        if (!req.session.user) {
            return res.redirect('/login');
        }

        const roleId = req.session.user.role_id;

        if (!roleId) {
            return res.status(403).render('error', {
                title: 'Accès interdit',
                message: 'Votre compte ne possède aucun rôle.'
            });
        }

        Role.hasPermission(
            roleId,
            permissionName,
            (err, hasPermission) => {

                if (err) {
                    console.error(err);

                    return res.status(500).render('error', {
                        title: 'Erreur',
                        message: 'Une erreur est survenue.'
                    });
                }

                if (!hasPermission) {
                    return res.status(403).render('error', {
                        title: 'Accès interdit',
                        message: 'Vous n’avez pas la permission nécessaire.'
                    });
                }

                next();
            }
        );
    };
}

module.exports = {
    requirePermission
};

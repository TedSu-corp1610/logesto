const Role = require('../models/Role');


function auth(req, res, next) {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    next();
}


function guest(req, res, next) {

    if (req.session.user) {
        return res.redirect('/dashboard');
    }

    next();
}


/*
 * Charge les permissions de l'utilisateur
 * pour toutes les pages authentifiées.
 */
function loadPermissions(req, res, next) {

    if (!req.session.user) {
        res.locals.user = null;
        res.locals.permissions = [];

        return next();
    }

    const roleId = req.session.user.role_id;

    if (!roleId) {
        res.locals.user = req.session.user;
        res.locals.permissions = [];

        return next();
    }

    Role.getPermissions(
        roleId,
        (err, permissions) => {

            if (err) {
                console.error(
                    'Erreur chargement permissions:',
                    err
                );

                res.locals.user = req.session.user;
                res.locals.permissions = [];

                return next();
            }

            res.locals.user = req.session.user;

            res.locals.permissions =
                permissions;

            /*
             * On conserve les permissions
             * dans la session pour éviter
             * de les recharger dans chaque
             * contrôleur.
             */
            req.session.user.permissions =
                permissions;

            next();
        }
    );
}


module.exports = {
    auth,
    guest,
    loadPermissions
};
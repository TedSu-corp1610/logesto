const express = require('express');

const router = express.Router();

const AuthController = require('../controllers/authController');

const { guest } = require('../middleware/auth');


// Afficher le formulaire d'inscription
router.get(
    '/register',
    guest,
    AuthController.showRegister
);


// Traiter l'inscription
router.post(
    '/register',
    AuthController.register
);


// Afficher le formulaire de connexion
router.get(
    '/login',
    guest,
    AuthController.showLogin
);


// Traiter la connexion
router.post(
    '/login',
    AuthController.login
);


// Déconnexion
router.get(
    '/logout',
    AuthController.logout
);


module.exports = router;
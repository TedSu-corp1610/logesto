const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const databasePath = path.join(
    __dirname,
    '../database/database.sqlite'
);

const db = new sqlite3.Database(
    databasePath,
    (err) => {

        if (err) {
            console.error(
                'Erreur de connexion à SQLite :',
                err.message
            );
        } else {
            console.log(
                'Connexion à SQLite réussie.'
            );
        }

    }
);


// Activer les clés étrangères
db.run('PRAGMA foreign_keys = ON');


module.exports = db;
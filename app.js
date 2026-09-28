const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');

require('./config/initDatabase');
require('./config/seed');

const app = express();

const PORT = 3000;


// Pug
app.set('view engine', 'pug');
app.set('views', './views');


// Fichiers statiques
app.use(express.static('public'));


// POST
app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());


// Sessions
const sessionMiddleware = session({
    secret: 'mon-secret-de-session',
    resave: false,
    saveUninitialized: false
});
app.use(sessionMiddleware);

//Permissions globales
const {
    loadPermissions
} = require('./middleware/auth');
app.use(loadPermissions);



// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const chatRoutes = require('./routes/chat');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const storeRoutes = require('./routes/stores');
const stockLocationRoutes = require('./routes/stockLocations');
const categoryRoutes = require('./routes/categories');
const supplierRoutes = require('./routes/suppliers');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const stockTransferRoutes = require('./routes/stockTransfers');
const inventoryRoutes = require('./routes/inventory');



app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', userRoutes);
app.use('/', profileRoutes);
app.use('/', chatRoutes);
app.use('/', roleRoutes);
app.use('/', permissionRoutes);
app.use('/', storeRoutes);
app.use('/', stockLocationRoutes);
app.use('/', categoryRoutes);
app.use('/', supplierRoutes);
app.use('/', productRoutes);
app.use('/', stockRoutes);
app.use('/', stockTransferRoutes);
app.use('/', inventoryRoutes);

// Accueil
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});


// Serveur
const server = http.createServer(app);

const io = new Server(server);

io.use((socket, next) => {

    sessionMiddleware(
        socket.request,
        {},
        next
    );
});

function handleChatMessage(socket, data) {

    const senderId =
        socket.request.session.user.id;

    const receiverId =
        Number(data.receiverId);

    const content =
        typeof data.content === 'string'
            ? data.content.trim()
            : '';

    if (!Number.isInteger(receiverId)) {

        socket.emit('chat:error', {
            message: 'Destinataire invalide.'
        });

        return;
    }

    if (!content) {

        socket.emit('chat:error', {
            message: 'Le message est vide.'
        });

        return;
    }

    if (content.length > 2000) {

        socket.emit('chat:error', {
            message:
                'Le message ne peut pas dépasser 2000 caractères.'
        });

        return;
    }

    if (senderId === receiverId) {

        socket.emit('chat:error', {
            message:
                'Vous ne pouvez pas vous envoyer un message à vous-même.'
        });

        return;
    }

    Message.create(
        senderId,
        receiverId,
        content,
        (err, message) => {

            if (err) {

                console.error(
                    'Erreur création message:',
                    err
                );

                socket.emit('chat:error', {
                    message:
                        'Impossible d’envoyer le message.'
                });

                return;
            }

            message.sender_username =
                socket.request.session.user.username;

            io
                .to(`user:${senderId}`)
                .to(`user:${receiverId}`)
                .emit(
                    'chat:message',
                    message
                );
        }
    );
}

const onlineUsers = new Map();

io.on('connection', (socket) => {

    const user =
        socket.request.session.user;

    if (!user) {
        return socket.disconnect(true);
    }

    socket.user = user;

    console.log(
        `Socket connecté: ${user.username} (${socket.id})`
    );

    socket.join(`user:${user.id}`);

    // Ajouter l'utilisateur à la liste des utilisateurs en ligne
    onlineUsers.set(user.id, socket.id);

    // Notifier les autres que l'utilisateur est en ligne
    socket.broadcast.emit(
        'user:online',
        { userId: user.id }
    );

    socket.on('chat:message', (data) => {

        handleChatMessage(socket, data);

    });

    socket.on('chat:read', (data) => {

        const senderId = data.senderId;
        const receiverId = user.id;

        Message.markConversationAsRead(
            receiverId,
            senderId,
            (err) => {
                if (err) {
                    console.error(
                        'Erreur marquage messages lus:',
                        err
                    );
                }
            }
        );
    });

    socket.on('disconnect', () => {

        console.log(
            `Socket déconnecté: ${user.username}`
        );

        // Retirer l'utilisateur de la liste des utilisateurs en ligne
        onlineUsers.delete(user.id);

        // Notifier les autres que l'utilisateur est hors ligne
        socket.broadcast.emit(
            'user:offline',
            { userId: user.id }
        );

    });

    socket.on(
        'users:online',
        () => {

            socket.emit(
                'users:online',
                Array.from(
                    onlineUsers.keys()
                )
            );
        }
    );
});

server.listen(PORT, () => {

    console.log(
        `Serveur démarré sur http://localhost:${PORT}`
    );

});
const User = require('../models/User');
const Message = require('../models/Message');

const ChatController = {

    index: (req, res) => {

        const currentUserId =
            req.session.user.id;

        User.findAll((err, users) => {

            if (err) {
                console.error(
                    'Erreur chargement utilisateurs:',
                    err
                );

                return res.status(500).render(
                    'error',
                    {
                        title: 'Erreur',
                        message:
                            'Impossible de charger le chat.'
                    }
                );
            }

            const otherUsers =
                users.filter(
                    user =>
                        user.id !== currentUserId
                );

            Message.getUnreadCounts(
                currentUserId,
                (unreadErr, unreadCounts) => {

                    if (unreadErr) {
                        console.error(
                            'Erreur messages non lus:',
                            unreadErr
                        );

                        return res.status(500).render(
                            'error',
                            {
                                title: 'Erreur',
                                message:
                                    'Impossible de charger les messages.'
                            }
                        );
                    }

                    Message.findLastMessages(
                        currentUserId,
                        (lastErr, lastMessages) => {

                            if (lastErr) {
                                console.error(
                                    'Erreur derniers messages:',
                                    lastErr
                                );

                                return res.status(500).render(
                                    'error',
                                    {
                                        title: 'Erreur',
                                        message:
                                            'Impossible de charger les conversations.'
                                    }
                                );
                            }

                            res.render('chat/index', {

                                title: 'Chat',

                                pageTitle: 'Chat',

                                breadcrumb: 'Chat',

                                activePage: 'chat',

                                user: req.session.user,

                                chatUsers: otherUsers,

                                unreadCounts,

                                lastMessages
                            });
                        }
                    );
                }
            );
        });
    },

    conversation: (req, res) => {

        const currentUserId =
            req.session.user.id;

        const otherUserId =
            Number(req.params.userId);

        if (!Number.isInteger(otherUserId)) {
            return res.status(400).json({
                error: 'Utilisateur invalide.'
            });
        }

        Message.findConversation(
            currentUserId,
            otherUserId,
            (err, messages) => {

                if (err) {

                    console.error(
                        'Erreur conversation:',
                        err
                    );

                    return res.status(500).json({
                        error:
                            'Impossible de charger la conversation.'
                    });
                }

                res.json(messages);
            }
        );
    }
};

module.exports = ChatController;
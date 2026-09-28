function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[name] = value;
        }
    });

    return cookies;
}

function socketAuth(sessionMiddleware) {

    return (socket, next) => {

        try {
            const cookies = parseCookies(
                socket.handshake.headers.cookie || ''
            );

            if (!cookies['connect.sid']) {
                return next(
                    new Error('Non authentifié')
                );
            }

            sessionMiddleware(
                socket.request,
                {},
                () => {

                    if (!socket.request.session.user) {
                        return next(
                            new Error('Non authentifié')
                        );
                    }

                    socket.user = socket.request.session.user;

                    next();
                }
            );

        } catch (error) {

            console.error(
                'Erreur authentification Socket:',
                error
            );

            next(
                new Error('Erreur authentification')
            );
        }
    };
}

module.exports = socketAuth;
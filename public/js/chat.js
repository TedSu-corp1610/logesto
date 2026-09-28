document.addEventListener('DOMContentLoaded', () => {

    const socket = io();
    const chatLayout =
    document.querySelector('.chat-layout');

    const currentUserId =
        Number(
            chatLayout.dataset.currentUserId
        );

    const statusElements =
        document.querySelectorAll(
            '[data-status-user-id]'
        );

    const users =
        document.querySelectorAll('.chat-user');

    const messagesContainer =
        document.querySelector('.chat-messages');

    const chatForm =
        document.querySelector('.chat-form');

    const input =
        document.querySelector('.chat-input');

    const sendButton =
        chatForm.querySelector('button');

    const currentUserInfo =
        document.querySelector('.chat-current-user-info');

    const currentUserAvatar =
        document.querySelector(
            '.chat-current-user .chat-user-avatar'
        );

    let selectedUserId = null;

    let selectedUsername = null;


    users.forEach(user => {

        user.addEventListener(
            'click',
            async () => {

                selectedUserId =
                    Number(
                        user.dataset.userId
                    );

                selectedUsername =
                    user.dataset.username;

                users.forEach(item => {
                    item.classList.remove(
                        'active'
                    );
                });

                user.classList.add('active');

                currentUserInfo.innerHTML = `
                    <strong>
                        ${selectedUsername}
                    </strong>
                    <span>
                        Conversation
                    </span>
                `;

                currentUserAvatar.textContent =
                    selectedUsername
                        .charAt(0)
                        .toUpperCase();

                input.disabled = false;

                sendButton.disabled = false;

                await loadConversation(
                    selectedUserId
                );

                socket.emit(
                    'chat:read',
                    {
                        senderId: selectedUserId
                    }
                );

                const unreadBadge =
                    document.querySelector(
                        `[data-unread-user-id="${selectedUserId}"]`
                    );

                if (unreadBadge) {
                    unreadBadge.remove();
                }

                input.focus();
            }
        );
    });


    async function loadConversation(userId) {

        try {

            const response =
                await fetch(
                    `/chat/conversation/${userId}`
                );

            if (!response.ok) {
                throw new Error(
                    'Erreur chargement conversation'
                );
            }

            const messages =
                await response.json();

            messagesContainer.innerHTML = '';

            if (!messages.length) {

                messagesContainer.innerHTML = `
                    <div class="chat-empty">
                        <div class="chat-empty-icon">
                            💬
                        </div>

                        <h3>
                            Nouvelle conversation
                        </h3>

                        <p>
                            Envoyez votre premier message.
                        </p>
                    </div>
                `;

                return;
            }

            messages.forEach(message => {
                appendMessage(message);
            });

            scrollToBottom();

        } catch (error) {

            console.error(error);

            messagesContainer.innerHTML = `
                <div class="chat-empty">
                    <h3>
                        Erreur
                    </h3>

                    <p>
                        Impossible de charger la conversation.
                    </p>
                </div>
            `;
        }
    }

    function showChatNotification(message) {

        const userId =
            message.sender_id;

        const badge =
            document.querySelector(
                `[data-unread-user-id="${userId}"]`
            );

        if (badge) {

            const current =
                Number(badge.textContent) || 0;

            badge.textContent =
                current + 1;

            return;
        }

        const userButton =
            document.querySelector(
                `.chat-user[data-user-id="${userId}"]`
            );

        if (!userButton) {
            return;
        }

        const newBadge =
            document.createElement('span');

        newBadge.className =
            'chat-unread-badge';

        newBadge.dataset.unreadUserId =
            userId;

        newBadge.textContent = '1';

        userButton.appendChild(
            newBadge
        );
    }

    function appendMessage(message) {

        const isMine =
            Number(message.sender_id) ===
            currentUserId;

        const wrapper =
            document.createElement('div');

        wrapper.className =
            `chat-message ${
                isMine ? 'chat-message-mine' : ''
            }`;

        const bubble =
            document.createElement('div');

        bubble.className =
            'chat-message-bubble';

        bubble.textContent =
            message.content;

        wrapper.appendChild(bubble);

        messagesContainer.appendChild(wrapper);
    }


    chatForm.addEventListener(
        'submit',
        event => {

            event.preventDefault();

            if (!selectedUserId) {
                return;
            }

            const content =
                input.value.trim();

            if (!content) {
                return;
            }

            socket.emit(
                'chat:message',
                {
                    receiverId:
                        selectedUserId,

                    content
                }
            );

            input.value = '';

            input.focus();
        }
    );

    socket.on(
        'chat:message',
        message => {

            const isMine =
                Number(message.sender_id) ===
                currentUserId;

            const isCurrentConversation =
                Number(message.sender_id) ===
                    Number(selectedUserId) ||
                Number(message.receiver_id) ===
                    Number(selectedUserId);

            if (isCurrentConversation) {

                appendMessage(message);

                scrollToBottom();

                if (!isMine) {

                    socket.emit(
                        'chat:read',
                        {
                            senderId:
                                message.sender_id
                        }
                    );
                }

            } else if (!isMine) {

                showChatNotification(
                    message
                );
            }
        }
    );

    function scrollToBottom() {

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;
    }

    socket.on(
        'chat:error',
        data => {

            alert(
                data.message ||
                'Une erreur est survenue.'
            );
        }
    );

    function setUserStatus(
        userId,
        online
    ) {

        statusElements.forEach(element => {

            if (
                Number(
                    element.dataset.statusUserId
                ) !== Number(userId)
            ) {
                return;
            }

            element.textContent =
                online
                    ? 'En ligne'
                    : 'Hors ligne';

            element.classList.toggle(
                'online',
                online
            );
        });
    }

    socket.on(
        'users:online',
        userIds => {

            userIds.forEach(userId => {

                setUserStatus(
                    userId,
                    true
                );
            });
        }
    );

    socket.on(
        'user:online',
        data => {

            setUserStatus(
                data.userId,
                true
            );
        }
    );

    socket.on(
        'user:offline',
        data => {

            setUserStatus(
                data.userId,
                false
            );
        }
    );
});
const db = require('../config/database');

class Message {

    static create(
        senderId,
        receiverId,
        content,
        callback
    ) {
        const sql = `
            INSERT INTO messages (
                sender_id,
                receiver_id,
                content
            )
            VALUES (?, ?, ?)
        `;

        db.run(
            sql,
            [
                senderId,
                receiverId,
                content
            ],
            function (err) {

                if (err) {
                    return callback(err);
                }

                db.get(
                    `
                        SELECT
                            m.id,
                            m.sender_id,
                            m.receiver_id,
                            m.content,
                            m.read_at,
                            m.created_at,
                            u.username AS sender_username
                        FROM messages m
                        INNER JOIN users u
                            ON u.id = m.sender_id
                        WHERE m.id = ?
                    `,
                    [this.lastID],
                    (selectErr, message) => {

                        if (selectErr) {
                            return callback(selectErr);
                        }

                        callback(null, message);
                    }
                );
            }
        );
    }


    static findConversation(
        userId,
        otherUserId,
        callback
    ) {
        const sql = `
            SELECT
                m.id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.read_at,
                m.created_at,
                u.username AS sender_username
            FROM messages m

            INNER JOIN users u
                ON u.id = m.sender_id

            WHERE
                (
                    m.sender_id = ?
                    AND m.receiver_id = ?
                )
                OR
                (
                    m.sender_id = ?
                    AND m.receiver_id = ?
                )

            ORDER BY m.created_at ASC
        `;

        db.all(
            sql,
            [
                userId,
                otherUserId,
                otherUserId,
                userId
            ],
            (err, messages) => {

                if (err) {
                    return callback(err);
                }

                callback(null, messages);
            }
        );
    }


    static markConversationAsRead(
        receiverId,
        senderId,
        callback
    ) {
        const sql = `
            UPDATE messages
            SET read_at = CURRENT_TIMESTAMP
            WHERE
                receiver_id = ?
                AND sender_id = ?
                AND read_at IS NULL
        `;

        db.run(
            sql,
            [
                receiverId,
                senderId
            ],
            function (err) {

                if (err) {
                    return callback(err);
                }

                callback(null, {
                    changes: this.changes
                });
            }
        );
    }


    static countUnread(
        receiverId,
        senderId,
        callback
    ) {
        const sql = `
            SELECT COUNT(*) AS total
            FROM messages
            WHERE
                receiver_id = ?
                AND sender_id = ?
                AND read_at IS NULL
        `;

        db.get(
            sql,
            [
                receiverId,
                senderId
            ],
            (err, row) => {

                if (err) {
                    return callback(err);
                }

                callback(null, row.total);
            }
        );
    }


    static getUnreadCounts(
        receiverId,
        callback
    ) {
        const sql = `
            SELECT
                sender_id,
                COUNT(*) AS total
            FROM messages
            WHERE
                receiver_id = ?
                AND read_at IS NULL
            GROUP BY sender_id
        `;

        db.all(
            sql,
            [receiverId],
            (err, rows) => {

                if (err) {
                    return callback(err);
                }

                const counts = {};

                rows.forEach(row => {
                    counts[row.sender_id] = row.total;
                });

                callback(null, counts);
            }
        );
    }


    static findLastMessages(
        userId,
        callback
    ) {
        const sql = `
            SELECT
                m.*,
                sender.username AS sender_username
            FROM messages m

            INNER JOIN users sender
                ON sender.id = m.sender_id

            WHERE
                m.id IN (
                    SELECT MAX(id)
                    FROM messages
                    WHERE
                        sender_id = ?
                        OR receiver_id = ?
                    GROUP BY
                        CASE
                            WHEN sender_id < receiver_id
                            THEN sender_id || '-' || receiver_id
                            ELSE receiver_id || '-' || sender_id
                        END
                )

            ORDER BY m.created_at DESC
        `;

        db.all(
            sql,
            [userId, userId],
            (err, messages) => {

                if (err) {
                    return callback(err);
                }

                callback(null, messages);
            }
        );
    }
}

module.exports = Message;
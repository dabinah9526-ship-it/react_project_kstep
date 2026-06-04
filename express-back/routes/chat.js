const express = require('express');
const oracledb = require('oracledb');
const jwt = require('jsonwebtoken');

const db = require("../db");
const router = express.Router();

/* =========================
   로그인 토큰 확인
========================= */
function checkToken(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return null;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.jwt_key || "secret_key");
        return decoded;
    } catch (error) {
        return null;
    }
}

/* =========================
   토큰 안의 userNo 꺼내기
========================= */
function getLoginUserNo(loginUser) {
    if (!loginUser) {
        return null;
    }

    if (loginUser.userNo) {
        return Number(loginUser.userNo);
    }

    if (loginUser.USER_NO) {
        return Number(loginUser.USER_NO);
    }

    if (loginUser.user_no) {
        return Number(loginUser.user_no);
    }

    if (loginUser.id) {
        return Number(loginUser.id);
    }

    return null;
}

/* =========================
   온라인 테이블 존재 확인
========================= */
async function tableExists(connection, tableName) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM USER_TABLES
            WHERE TABLE_NAME = UPPER(:tableName)
        `,
        {
            tableName: tableName
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].CNT > 0;
}

/* =========================
   온라인 상태 갱신
========================= */
async function updateOnlineStatus(connection, userNo) {
    const onlineTableExists = await tableExists(connection, "USER_ONLINE");

    if (!onlineTableExists) {
        return;
    }

    await connection.execute(
        `
            MERGE INTO USER_ONLINE UO
            USING (
                SELECT :userNo AS USER_NO
                FROM DUAL
            ) S
            ON (
                UO.USER_NO = S.USER_NO
            )
            WHEN MATCHED THEN
                UPDATE SET
                    UO.LAST_ACTIVE_DATE = SYSDATE
            WHEN NOT MATCHED THEN
                INSERT (
                    USER_NO,
                    LAST_ACTIVE_DATE
                ) VALUES (
                    :userNo,
                    SYSDATE
                )
        `,
        {
            userNo: userNo
        }
    );
}

/* =========================
   1:1 채팅방은 작은 USER_NO를 USER1_NO로 저장
========================= */
function getFirstUserNo(userNo1, userNo2) {
    if (Number(userNo1) < Number(userNo2)) {
        return Number(userNo1);
    }

    return Number(userNo2);
}

function getSecondUserNo(userNo1, userNo2) {
    if (Number(userNo1) < Number(userNo2)) {
        return Number(userNo2);
    }

    return Number(userNo1);
}

/* =========================
   다음 채팅방 번호
========================= */
async function getNextRoomNo(connection) {
    const result = await connection.execute(
        `
            SELECT NVL(MAX(ROOM_NO), 0) + 1 AS ROOM_NO
            FROM CHAT_ROOM
        `,
        {},
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].ROOM_NO;
}

/* =========================
   다음 메시지 번호
========================= */
async function getNextMessageNo(connection) {
    const result = await connection.execute(
        `
            SELECT NVL(MAX(MESSAGE_NO), 0) + 1 AS MESSAGE_NO
            FROM CHAT_MESSAGE
        `,
        {},
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].MESSAGE_NO;
}

/* =========================
   채팅방 멤버 확인
========================= */
async function checkRoomMember(connection, roomNo, userNo) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM CHAT_ROOM_MEMBER
            WHERE ROOM_NO = :roomNo
              AND USER_NO = :userNo
        `,
        {
            roomNo: roomNo,
            userNo: userNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].CNT > 0;
}

/* =========================
   채팅방 정보 조회
========================= */
async function getRoomInfo(connection, roomNo) {
    const result = await connection.execute(
        `
            SELECT
                ROOM_NO,
                USER1_NO,
                USER2_NO
            FROM CHAT_ROOM
            WHERE ROOM_NO = :roomNo
              AND NVL(ROOM_STATUS, 'Y') = 'Y'
        `,
        {
            roomNo: roomNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

/* =========================
   상대방 번호 구하기
========================= */
function getOtherUserNo(room, loginUserNo) {
    if (!room) {
        return null;
    }

    if (String(room.USER1_NO) === String(loginUserNo)) {
        return room.USER2_NO;
    }

    return room.USER1_NO;
}

/* =========================
   안 읽은 메시지 개수

   받은 메시지:
   - SENDER_NO = 상대
   - RECEIVER_NO = 나
   - READ_YN = 'N'
========================= */
async function getUnreadCount(connection, loginUserNo, otherUserNo) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM CHAT_MESSAGE M
            WHERE M.SENDER_NO = :otherUserNo
              AND M.RECEIVER_NO = :loginUserNo
              AND NVL(M.READ_YN, 'N') = 'N'
              AND NVL(M.MESSAGE_STATUS, 'Y') = 'Y'
              AND NOT EXISTS (
                    SELECT 1
                    FROM CHAT_MESSAGE_HIDE H
                    WHERE H.MESSAGE_NO = M.MESSAGE_NO
                      AND H.USER_NO = :loginUserNo
              )
        `,
        {
            loginUserNo: loginUserNo,
            otherUserNo: otherUserNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].CNT || 0;
}

/* =========================
   마지막 메시지 조회

   Y = 정상
   D = 모두에게서 삭제됨
   N = 완전 숨김
========================= */
async function getLastMessage(connection, loginUserNo, otherUserNo) {
    const result = await connection.execute(
        `
            SELECT *
            FROM (
                SELECT
                    M.MESSAGE_NO,
                    M.SENDER_NO,
                    M.RECEIVER_NO,
                    CASE
                        WHEN NVL(M.MESSAGE_STATUS, 'Y') = 'D' THEN '삭제된 메시지입니다.'
                        ELSE M.MESSAGE_CONTENT
                    END AS MESSAGE_CONTENT,
                    M.MESSAGE_STATUS,
                    M.CDATE,
                    TO_CHAR(M.CDATE, 'YYYY-MM-DD HH24:MI') AS CDATE_TEXT
                FROM CHAT_MESSAGE M
                WHERE
                    (
                        (
                            M.SENDER_NO = :loginUserNo
                            AND M.RECEIVER_NO = :otherUserNo
                        )
                        OR
                        (
                            M.SENDER_NO = :otherUserNo
                            AND M.RECEIVER_NO = :loginUserNo
                        )
                    )
                  AND NVL(M.MESSAGE_STATUS, 'Y') IN ('Y', 'D')
                  AND NOT EXISTS (
                        SELECT 1
                        FROM CHAT_MESSAGE_HIDE H
                        WHERE H.MESSAGE_NO = M.MESSAGE_NO
                          AND H.USER_NO = :loginUserNo
                  )
                ORDER BY M.MESSAGE_NO DESC
            )
            WHERE ROWNUM = 1
        `,
        {
            loginUserNo: loginUserNo,
            otherUserNo: otherUserNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

/* =========================
   채팅방 멤버 복구 또는 추가
========================= */
async function restoreOrInsertRoomMember(connection, roomNo, userNo) {
    await connection.execute(
        `
            MERGE INTO CHAT_ROOM_MEMBER M
            USING (
                SELECT
                    :roomNo AS ROOM_NO,
                    :userNo AS USER_NO
                FROM DUAL
            ) S
            ON (
                M.ROOM_NO = S.ROOM_NO
                AND M.USER_NO = S.USER_NO
            )
            WHEN MATCHED THEN
                UPDATE SET
                    M.ROOM_DELETE_YN = 'N',
                    M.ROOM_DELETE_DATE = NULL
            WHEN NOT MATCHED THEN
                INSERT (
                    ROOM_NO,
                    USER_NO,
                    LAST_READ_MESSAGE_NO,
                    ROOM_DELETE_YN,
                    ROOM_DELETE_DATE,
                    CDATE
                ) VALUES (
                    :roomNo,
                    :userNo,
                    0,
                    'N',
                    NULL,
                    SYSDATE
                )
        `,
        {
            roomNo: roomNo,
            userNo: userNo
        }
    );
}

/* =========================
   온라인 상태 갱신
   POST /chat/status/ping
========================= */
router.post('/status/ping', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo || Number.isNaN(loginUserNo)) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        await updateOnlineStatus(connection, loginUserNo);

        await connection.commit();

        res.json({
            result: "success",
            message: "온라인 상태가 갱신되었습니다."
        });

    } catch (error) {
        console.error("Error executing online ping query", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "온라인 상태 갱신 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   채팅방 목록 조회
   GET /chat/room/list
========================= */
router.get('/room/list', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo || Number.isNaN(loginUserNo)) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        await updateOnlineStatus(connection, loginUserNo);

        const onlineTableExists = await tableExists(connection, "USER_ONLINE");

        const roomResult = await connection.execute(
            `
                SELECT
                    R.ROOM_NO,
                    R.USER1_NO,
                    R.USER2_NO,
                    R.UPDATE_DATE,
                    M.LAST_READ_MESSAGE_NO,
                    M.ROOM_DELETE_YN
                FROM CHAT_ROOM R
                INNER JOIN CHAT_ROOM_MEMBER M
                    ON R.ROOM_NO = M.ROOM_NO
                WHERE M.USER_NO = :loginUserNo
                  AND NVL(M.ROOM_DELETE_YN, 'N') = 'N'
                  AND NVL(R.ROOM_STATUS, 'Y') = 'Y'
                ORDER BY R.UPDATE_DATE DESC, R.ROOM_NO DESC
            `,
            {
                loginUserNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        let roomList = [];

        for (let i = 0; i < roomResult.rows.length; i++) {
            const room = roomResult.rows[i];
            const otherUserNo = getOtherUserNo(room, loginUserNo);

            let userSql = `
                SELECT
                    U.USER_NO,
                    U.USER_ID,
                    U.NICKNAME,
                    U.USER_TYPE,
                    U.PROFILE_IMG,
                    U.ACCOUNT_PRIVATE_YN,
                    U.USER_STATUS,
                    U.BIO AS INTRO,
                    'N' AS ONLINE_YN
                FROM USERS U
                WHERE U.USER_NO = :otherUserNo
                  AND NVL(U.USER_STATUS, 'Y') = 'Y'
            `;

            if (onlineTableExists) {
                userSql = `
                    SELECT
                        U.USER_NO,
                        U.USER_ID,
                        U.NICKNAME,
                        U.USER_TYPE,
                        U.PROFILE_IMG,
                        U.ACCOUNT_PRIVATE_YN,
                        U.USER_STATUS,
                        U.BIO AS INTRO,
                        CASE
                            WHEN O.LAST_ACTIVE_DATE >= SYSDATE - (5 / 1440) THEN 'Y'
                            ELSE 'N'
                        END AS ONLINE_YN,
                        TO_CHAR(O.LAST_ACTIVE_DATE, 'YYYY-MM-DD HH24:MI') AS LAST_ACTIVE_TEXT
                    FROM USERS U
                    LEFT JOIN USER_ONLINE O
                        ON U.USER_NO = O.USER_NO
                    WHERE U.USER_NO = :otherUserNo
                      AND NVL(U.USER_STATUS, 'Y') = 'Y'
                `;
            }

            const userResult = await connection.execute(
                userSql,
                {
                    otherUserNo: otherUserNo
                },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );

            if (userResult.rows.length === 0) {
                continue;
            }

            const otherUser = userResult.rows[0];

            const lastMessage = await getLastMessage(
                connection,
                loginUserNo,
                otherUserNo
            );

            const unreadCount = await getUnreadCount(
                connection,
                loginUserNo,
                otherUserNo
            );

            roomList.push({
                ROOM_NO: room.ROOM_NO,
                OTHER_USER_NO: otherUser.USER_NO,
                USER_ID: otherUser.USER_ID,
                NICKNAME: otherUser.NICKNAME,
                USER_TYPE: otherUser.USER_TYPE,
                PROFILE_IMG: otherUser.PROFILE_IMG,
                INTRO: otherUser.INTRO,
                ACCOUNT_PRIVATE_YN: otherUser.ACCOUNT_PRIVATE_YN,
                ONLINE_YN: otherUser.ONLINE_YN || "N",
                LAST_ACTIVE_TEXT: otherUser.LAST_ACTIVE_TEXT || "",
                LAST_MESSAGE: lastMessage ? lastMessage.MESSAGE_CONTENT : "아직 대화가 없습니다.",
                LAST_MESSAGE_DATE: lastMessage ? lastMessage.CDATE_TEXT : "",
                UNREAD_COUNT: unreadCount
            });
        }

        await connection.commit();

        res.json({
            result: "success",
            list: roomList
        });

    } catch (error) {
        console.error("Error executing chat room list query", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "채팅방 목록 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   채팅방 열기 또는 생성
   POST /chat/room/open
========================= */
router.post('/room/open', async (req, res) => {
    const { targetUserNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo || Number.isNaN(loginUserNo)) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!targetUserNo) {
            return res.json({
                result: "fail",
                message: "상대방 사용자 번호가 없습니다."
            });
        }

        const otherUserNo = Number(targetUserNo);

        if (Number.isNaN(otherUserNo)) {
            return res.json({
                result: "fail",
                message: "상대방 사용자 번호가 올바르지 않습니다."
            });
        }

        if (loginUserNo === otherUserNo) {
            return res.json({
                result: "fail",
                message: "나 자신과는 채팅할 수 없습니다."
            });
        }

        connection = await db.getConnection();

        await updateOnlineStatus(connection, loginUserNo);

        const loginUserResult = await connection.execute(
            `
                SELECT
                    USER_NO,
                    USER_ID,
                    NICKNAME,
                    USER_TYPE,
                    USER_STATUS
                FROM USERS
                WHERE USER_NO = :loginUserNo
                  AND NVL(USER_STATUS, 'Y') = 'Y'
            `,
            {
                loginUserNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (loginUserResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "로그인 사용자를 DB에서 찾을 수 없습니다. 토큰의 userNo와 USERS 테이블을 확인해주세요."
            });
        }

        const userResult = await connection.execute(
            `
                SELECT
                    USER_NO,
                    USER_ID,
                    NICKNAME,
                    USER_TYPE,
                    PROFILE_IMG,
                    BIO AS INTRO
                FROM USERS
                WHERE USER_NO = :targetUserNo
                  AND NVL(USER_STATUS, 'Y') = 'Y'
            `,
            {
                targetUserNo: otherUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (userResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 사용자입니다."
            });
        }

        const user1No = getFirstUserNo(loginUserNo, otherUserNo);
        const user2No = getSecondUserNo(loginUserNo, otherUserNo);

        const roomResult = await connection.execute(
            `
                SELECT ROOM_NO
                FROM CHAT_ROOM
                WHERE USER1_NO = :user1No
                  AND USER2_NO = :user2No
                  AND NVL(ROOM_STATUS, 'Y') = 'Y'
            `,
            {
                user1No: user1No,
                user2No: user2No
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        let roomNo;

        if (roomResult.rows.length > 0) {
            roomNo = roomResult.rows[0].ROOM_NO;
        } else {
            roomNo = await getNextRoomNo(connection);

            await connection.execute(
                `
                    INSERT INTO CHAT_ROOM (
                        ROOM_NO,
                        USER1_NO,
                        USER2_NO,
                        CDATE,
                        UPDATE_DATE,
                        ROOM_STATUS
                    ) VALUES (
                        :roomNo,
                        :user1No,
                        :user2No,
                        SYSDATE,
                        SYSDATE,
                        'Y'
                    )
                `,
                {
                    roomNo: roomNo,
                    user1No: user1No,
                    user2No: user2No
                }
            );
        }

        await restoreOrInsertRoomMember(connection, roomNo, loginUserNo);
        await restoreOrInsertRoomMember(connection, roomNo, otherUserNo);

        await connection.execute(
            `
                UPDATE CHAT_ROOM
                SET UPDATE_DATE = SYSDATE
                WHERE ROOM_NO = :roomNo
            `,
            {
                roomNo: roomNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "채팅방이 준비되었습니다.",
            roomNo: roomNo,
            user: userResult.rows[0]
        });

    } catch (error) {
        console.error("Error executing chat room open query", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "채팅방 생성 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   메시지 목록 조회 + 읽음 처리
   POST /chat/message/list
========================= */
router.post('/message/list', async (req, res) => {
    const { roomNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo || Number.isNaN(loginUserNo)) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!roomNo) {
            return res.json({
                result: "fail",
                message: "채팅방 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        await updateOnlineStatus(connection, loginUserNo);

        const room = await getRoomInfo(connection, roomNo);

        if (!room) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 채팅방입니다."
            });
        }

        const isMember = await checkRoomMember(connection, roomNo, loginUserNo);

        if (!isMember) {
            return res.json({
                result: "fail",
                message: "내 채팅방이 아닙니다."
            });
        }

        const otherUserNo = getOtherUserNo(room, loginUserNo);

        const result = await connection.execute(
            `
                SELECT
                    M.MESSAGE_NO,
                    CASE
                        WHEN NVL(M.MESSAGE_STATUS, 'Y') = 'D' THEN '삭제된 메시지입니다.'
                        ELSE M.MESSAGE_CONTENT
                    END AS CONTENT,
                    CASE
                        WHEN NVL(M.MESSAGE_STATUS, 'Y') = 'D' THEN '삭제된 메시지입니다.'
                        ELSE M.MESSAGE_CONTENT
                    END AS MESSAGE_CONTENT,
                    M.READ_YN,
                    M.MESSAGE_STATUS,
                    M.CDATE,
                    TO_CHAR(M.CDATE, 'YYYY-MM-DD HH24:MI') AS CDATE_TEXT,
                    M.SENDER_NO,
                    M.RECEIVER_NO,
                    CASE
                        WHEN M.SENDER_NO = :loginUserNo THEN 'Y'
                        ELSE 'N'
                    END AS MINE_YN
                FROM CHAT_MESSAGE M
                WHERE
                    (
                        (
                            M.SENDER_NO = :loginUserNo
                            AND M.RECEIVER_NO = :otherUserNo
                        )
                        OR
                        (
                            M.SENDER_NO = :otherUserNo
                            AND M.RECEIVER_NO = :loginUserNo
                        )
                    )
                  AND NVL(M.MESSAGE_STATUS, 'Y') IN ('Y', 'D')
                  AND NOT EXISTS (
                        SELECT 1
                        FROM CHAT_MESSAGE_HIDE H
                        WHERE H.MESSAGE_NO = M.MESSAGE_NO
                          AND H.USER_NO = :loginUserNo
                  )
                ORDER BY M.MESSAGE_NO
            `,
            {
                loginUserNo: loginUserNo,
                otherUserNo: otherUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        await connection.execute(
            `
                UPDATE CHAT_MESSAGE
                SET READ_YN = 'Y'
                WHERE SENDER_NO = :otherUserNo
                  AND RECEIVER_NO = :loginUserNo
                  AND NVL(READ_YN, 'N') = 'N'
                  AND NVL(MESSAGE_STATUS, 'Y') = 'Y'
            `,
            {
                otherUserNo: otherUserNo,
                loginUserNo: loginUserNo
            }
        );

        const maxMessageResult = await connection.execute(
            `
                SELECT NVL(MAX(MESSAGE_NO), 0) AS MAX_MESSAGE_NO
                FROM CHAT_MESSAGE
                WHERE
                    (
                        (
                            SENDER_NO = :loginUserNo
                            AND RECEIVER_NO = :otherUserNo
                        )
                        OR
                        (
                            SENDER_NO = :otherUserNo
                            AND RECEIVER_NO = :loginUserNo
                        )
                    )
                  AND NVL(MESSAGE_STATUS, 'Y') IN ('Y', 'D')
            `,
            {
                loginUserNo: loginUserNo,
                otherUserNo: otherUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        const maxMessageNo = maxMessageResult.rows[0].MAX_MESSAGE_NO || 0;

        await connection.execute(
            `
                UPDATE CHAT_ROOM_MEMBER
                SET LAST_READ_MESSAGE_NO = :maxMessageNo
                WHERE ROOM_NO = :roomNo
                  AND USER_NO = :loginUserNo
            `,
            {
                maxMessageNo: maxMessageNo,
                roomNo: roomNo,
                loginUserNo: loginUserNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            list: result.rows,
            lastReadMessageNo: maxMessageNo
        });

    } catch (error) {
        console.error("Error executing chat message list query", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "메시지 목록 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   메시지 전송
   POST /chat/message/send
========================= */
router.post('/message/send', async (req, res) => {
    const { roomNo, content } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo || Number.isNaN(loginUserNo)) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!roomNo) {
            return res.json({
                result: "fail",
                message: "채팅방 번호가 없습니다."
            });
        }

        const messageContent = content ? String(content).trim() : "";

        if (messageContent === "") {
            return res.json({
                result: "fail",
                message: "메시지를 입력해주세요."
            });
        }

        if (messageContent.length > 1000) {
            return res.json({
                result: "fail",
                message: "메시지는 1000자 이하로 입력해주세요."
            });
        }

        connection = await db.getConnection();

        await updateOnlineStatus(connection, loginUserNo);

        const room = await getRoomInfo(connection, roomNo);

        if (!room) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 채팅방입니다."
            });
        }

        const isMember = await checkRoomMember(connection, roomNo, loginUserNo);

        if (!isMember) {
            return res.json({
                result: "fail",
                message: "내 채팅방이 아닙니다."
            });
        }

        const receiverNo = getOtherUserNo(room, loginUserNo);
        const messageNo = await getNextMessageNo(connection);

        await connection.execute(
            `
                INSERT INTO CHAT_MESSAGE (
                    MESSAGE_NO,
                    MESSAGE_CONTENT,
                    READ_YN,
                    CDATE,
                    SENDER_NO,
                    RECEIVER_NO,
                    MESSAGE_STATUS
                ) VALUES (
                    :messageNo,
                    :messageContent,
                    'N',
                    SYSDATE,
                    :senderNo,
                    :receiverNo,
                    'Y'
                )
            `,
            {
                messageNo: messageNo,
                messageContent: messageContent,
                senderNo: loginUserNo,
                receiverNo: receiverNo
            }
        );

        await connection.execute(
            `
                UPDATE CHAT_ROOM
                SET UPDATE_DATE = SYSDATE
                WHERE ROOM_NO = :roomNo
            `,
            {
                roomNo: roomNo
            }
        );

        await connection.execute(
            `
                UPDATE CHAT_ROOM_MEMBER
                SET ROOM_DELETE_YN = 'N',
                    ROOM_DELETE_DATE = NULL
                WHERE ROOM_NO = :roomNo
            `,
            {
                roomNo: roomNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "메시지가 전송되었습니다.",
            messageNo: messageNo
        });

    } catch (error) {
        console.error("Error executing chat message send query", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "메시지 전송 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   메시지 나에게서만 삭제
   POST /chat/message/delete-for-me
========================= */
router.post('/message/delete-for-me', async (req, res) => {
    const { messageNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo || Number.isNaN(loginUserNo)) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!messageNo) {
            return res.json({
                result: "fail",
                message: "메시지 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        await updateOnlineStatus(connection, loginUserNo);

        const messageResult = await connection.execute(
            `
                SELECT
                    MESSAGE_NO,
                    SENDER_NO,
                    RECEIVER_NO
                FROM CHAT_MESSAGE
                WHERE MESSAGE_NO = :messageNo
                  AND NVL(MESSAGE_STATUS, 'Y') IN ('Y', 'D')
            `,
            {
                messageNo: messageNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (messageResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 메시지입니다."
            });
        }

        const chatMessage = messageResult.rows[0];

        if (
            String(chatMessage.SENDER_NO) !== String(loginUserNo) &&
            String(chatMessage.RECEIVER_NO) !== String(loginUserNo)
        ) {
            return res.json({
                result: "fail",
                message: "내 메시지가 아닙니다."
            });
        }

        const hideCheckResult = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM CHAT_MESSAGE_HIDE
                WHERE MESSAGE_NO = :messageNo
                  AND USER_NO = :loginUserNo
            `,
            {
                messageNo: messageNo,
                loginUserNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (hideCheckResult.rows[0].CNT === 0) {
            await connection.execute(
                `
                    INSERT INTO CHAT_MESSAGE_HIDE (
                        MESSAGE_NO,
                        USER_NO,
                        CDATE
                    ) VALUES (
                        :messageNo,
                        :loginUserNo,
                        SYSDATE
                    )
                `,
                {
                    messageNo: messageNo,
                    loginUserNo: loginUserNo
                }
            );
        }

        await connection.commit();

        res.json({
            result: "success",
            message: "메시지를 나에게서만 삭제했습니다."
        });

    } catch (error) {
        console.error("Error executing message delete for me query", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "메시지 삭제 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   메시지 모두에게서 삭제
   POST /chat/message/delete-for-everyone
========================= */
router.post('/message/delete-for-everyone', async (req, res) => {
    const { messageNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo || Number.isNaN(loginUserNo)) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!messageNo) {
            return res.json({
                result: "fail",
                message: "메시지 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        await updateOnlineStatus(connection, loginUserNo);

        const messageResult = await connection.execute(
            `
                SELECT
                    MESSAGE_NO,
                    SENDER_NO,
                    RECEIVER_NO,
                    MESSAGE_STATUS
                FROM CHAT_MESSAGE
                WHERE MESSAGE_NO = :messageNo
                  AND NVL(MESSAGE_STATUS, 'Y') = 'Y'
            `,
            {
                messageNo: messageNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (messageResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "이미 삭제되었거나 존재하지 않는 메시지입니다."
            });
        }

        const chatMessage = messageResult.rows[0];

        if (String(chatMessage.SENDER_NO) !== String(loginUserNo)) {
            return res.json({
                result: "fail",
                message: "내가 보낸 메시지만 모두에게서 삭제할 수 있습니다."
            });
        }

        await connection.execute(
            `
                UPDATE CHAT_MESSAGE
                SET MESSAGE_STATUS = 'D'
                WHERE MESSAGE_NO = :messageNo
                  AND SENDER_NO = :loginUserNo
                  AND NVL(MESSAGE_STATUS, 'Y') = 'Y'
            `,
            {
                messageNo: messageNo,
                loginUserNo: loginUserNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "메시지를 모두에게서 삭제했습니다."
        });

    } catch (error) {
        console.error("Error executing message delete for everyone query", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "메시지 삭제 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   채팅방 나에게서만 삭제
   POST /chat/room/delete-for-me
========================= */
router.post('/room/delete-for-me', async (req, res) => {
    const { roomNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo || Number.isNaN(loginUserNo)) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!roomNo) {
            return res.json({
                result: "fail",
                message: "채팅방 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        await updateOnlineStatus(connection, loginUserNo);

        const isMember = await checkRoomMember(connection, roomNo, loginUserNo);

        if (!isMember) {
            return res.json({
                result: "fail",
                message: "내 채팅방이 아닙니다."
            });
        }

        await connection.execute(
            `
                UPDATE CHAT_ROOM_MEMBER
                SET ROOM_DELETE_YN = 'Y',
                    ROOM_DELETE_DATE = SYSDATE
                WHERE ROOM_NO = :roomNo
                  AND USER_NO = :loginUserNo
            `,
            {
                roomNo: roomNo,
                loginUserNo: loginUserNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "채팅방을 나에게서만 삭제했습니다."
        });

    } catch (error) {
        console.error("Error executing room delete for me query", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "채팅방 삭제 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
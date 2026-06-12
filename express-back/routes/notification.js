const express = require('express');
const oracledb = require('oracledb');
const jwt = require('jsonwebtoken');

const db = require("../db");
const router = express.Router();

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

function getLoginUserNo(loginUser) {
    if (!loginUser) {
        return "";
    }

    return (
        loginUser.userNo ||
        loginUser.USER_NO ||
        loginUser.user_no ||
        loginUser.id ||
        ""
    );
}

// 알림 목록 조회
router.get('/list', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        const loginUserNo = getLoginUserNo(loginUser);

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT
                    N.NOTI_NO,
                    N.RECEIVER_NO,
                    N.SENDER_NO,
                    N.NOTI_TYPE,
                    N.NOTI_CONTENT,
                    N.TARGET_FEED_NO,
                    N.READ_YN,
                    N.CDATE,
                    TO_CHAR(N.CDATE, 'YYYY-MM-DD HH24:MI') AS CDATE_TEXT,
                    U.USER_ID AS SENDER_ID,
                    U.NICKNAME AS SENDER_NICKNAME,
                    U.PROFILE_IMG AS SENDER_PROFILE_IMG,
                    F.TITLE AS FEED_TITLE
                FROM NOTIFICATION N
                LEFT JOIN USERS U
                    ON N.SENDER_NO = U.USER_NO
                LEFT JOIN FEED F
                    ON N.TARGET_FEED_NO = F.FEED_NO
                WHERE N.RECEIVER_NO = :userNo
                ORDER BY N.NOTI_NO DESC
            `,
            {
                userNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        res.json({
            result: "success",
            list: result.rows
        });

    } catch (error) {
        console.error("notification list error", error);

        res.status(500).json({
            result: "fail",
            message: "알림 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 안 읽은 알림 개수 조회
router.get('/count', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다.",
                count: 0
            });
        }

        const loginUserNo = getLoginUserNo(loginUser);

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM NOTIFICATION
                WHERE RECEIVER_NO = :userNo
                  AND READ_YN = 'N'
            `,
            {
                userNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        res.json({
            result: "success",
            count: result.rows[0].CNT
        });

    } catch (error) {
        console.error("notification count error", error);

        res.status(500).json({
            result: "fail",
            message: "알림 개수 조회 중 오류가 발생했습니다.",
            count: 0
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 알림 하나 읽음 처리
router.post('/read', async (req, res) => {
    const { notiNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!notiNo) {
            return res.json({
                result: "fail",
                message: "알림 번호가 없습니다."
            });
        }

        const loginUserNo = getLoginUserNo(loginUser);

        connection = await db.getConnection();

        await connection.execute(
            `
                UPDATE NOTIFICATION
                SET READ_YN = 'Y'
                WHERE NOTI_NO = :notiNo
                  AND RECEIVER_NO = :userNo
            `,
            {
                notiNo: notiNo,
                userNo: loginUserNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "알림을 읽음 처리했습니다."
        });

    } catch (error) {
        console.error("notification read error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "알림 읽음 처리 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 전체 읽음 처리
router.post('/read-all', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        const loginUserNo = getLoginUserNo(loginUser);

        connection = await db.getConnection();

        await connection.execute(
            `
                UPDATE NOTIFICATION
                SET READ_YN = 'Y'
                WHERE RECEIVER_NO = :userNo
            `,
            {
                userNo: loginUserNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "모든 알림을 읽음 처리했습니다."
        });

    } catch (error) {
        console.error("notification read all error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "전체 알림 읽음 처리 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
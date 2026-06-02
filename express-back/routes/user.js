const express = require('express');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
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

function yn(value) {
    return value === "Y" ? "Y" : "N";
}

async function getBlockStatus(connection, loginUserNo, targetUserNo) {
    const result = await connection.execute(
        `
            SELECT
                SUM(
                    CASE
                        WHEN BLOCKER_NO = :loginUserNo AND BLOCKED_NO = :targetUserNo THEN 1
                        ELSE 0
                    END
                ) AS BLOCKED_BY_ME,
                SUM(
                    CASE
                        WHEN BLOCKER_NO = :targetUserNo AND BLOCKED_NO = :loginUserNo THEN 1
                        ELSE 0
                    END
                ) AS BLOCKED_ME
            FROM USER_BLOCK
            WHERE
                (
                    BLOCKER_NO = :loginUserNo
                    AND BLOCKED_NO = :targetUserNo
                )
                OR
                (
                    BLOCKER_NO = :targetUserNo
                    AND BLOCKED_NO = :loginUserNo
                )
        `,
        {
            loginUserNo: loginUserNo,
            targetUserNo: targetUserNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return {
        blockedByMe: Number(result.rows[0].BLOCKED_BY_ME || 0) > 0,
        blockedMe: Number(result.rows[0].BLOCKED_ME || 0) > 0
    };
}

async function canViewUserContent(connection, loginUserNo, targetUserNo) {
    if (String(loginUserNo) === String(targetUserNo)) {
        return true;
    }

    const blockStatus = await getBlockStatus(connection, loginUserNo, targetUserNo);

    if (blockStatus.blockedByMe || blockStatus.blockedMe) {
        return false;
    }

    const userResult = await connection.execute(
        `
            SELECT
                ACCOUNT_PRIVATE_YN,
                USER_STATUS
            FROM USERS
            WHERE USER_NO = :targetUserNo
        `,
        {
            targetUserNo: targetUserNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    if (userResult.rows.length === 0) {
        return false;
    }

    const user = userResult.rows[0];

    if (user.USER_STATUS !== "Y") {
        return false;
    }

    if ((user.ACCOUNT_PRIVATE_YN || "N") === "N") {
        return true;
    }

    const followResult = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM USER_FOLLOW
            WHERE FOLLOWER_NO = :loginUserNo
              AND FOLLOWING_NO = :targetUserNo
              AND FOLLOW_STATUS = 'ACCEPTED'
        `,
        {
            loginUserNo: loginUserNo,
            targetUserNo: targetUserNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return followResult.rows[0].CNT > 0;
}

async function canViewBookmarkList(connection, loginUserNo, targetUserNo) {
    if (String(loginUserNo) === String(targetUserNo)) {
        return true;
    }

    const canViewContent = await canViewUserContent(connection, loginUserNo, targetUserNo);

    if (!canViewContent) {
        return false;
    }

    const result = await connection.execute(
        `
            SELECT BOOKMARK_PUBLIC_YN
            FROM USERS
            WHERE USER_NO = :targetUserNo
              AND USER_STATUS = 'Y'
        `,
        {
            targetUserNo: targetUserNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    if (result.rows.length === 0) {
        return false;
    }

    return result.rows[0].BOOKMARK_PUBLIC_YN === "Y";
}

// 아이디 중복체크
router.post('/check-id', async (req, res) => {
    const { userId } = req.body;

    let connection;

    try {
        if (!userId) {
            return res.json({
                result: "fail",
                message: "아이디를 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM USERS
                WHERE USER_ID = :userId
                  AND USER_STATUS = 'Y'
            `,
            {
                userId: userId
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows[0].CNT > 0) {
            return res.json({
                result: "fail",
                message: "이미 사용 중인 아이디입니다."
            });
        }

        res.json({
            result: "success",
            message: "사용 가능한 아이디입니다."
        });

    } catch (error) {
        console.error("check-id error", error);

        res.status(500).json({
            result: "fail",
            message: "아이디 중복체크 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 닉네임 중복체크
router.post('/check-nickname', async (req, res) => {
    const { nickname } = req.body;

    let connection;

    try {
        if (!nickname) {
            return res.json({
                result: "fail",
                message: "닉네임을 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM USERS
                WHERE NICKNAME = :nickname
                  AND USER_STATUS = 'Y'
            `,
            {
                nickname: nickname
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows[0].CNT > 0) {
            return res.json({
                result: "fail",
                message: "이미 사용 중인 닉네임입니다."
            });
        }

        res.json({
            result: "success",
            message: "사용 가능한 닉네임입니다."
        });

    } catch (error) {
        console.error("check-nickname error", error);

        res.status(500).json({
            result: "fail",
            message: "닉네임 중복체크 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 회원가입
router.post('/join', async (req, res) => {
    const { userId, password, nickname, userType, email, bio } = req.body;

    let connection;

    try {
        if (!userId || !password || !nickname) {
            return res.json({
                result: "fail",
                message: "아이디, 비밀번호, 닉네임은 필수입니다."
            });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (!passwordRegex.test(password)) {
            return res.json({
                result: "fail",
                message: "비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요."
            });
        }

        if (bio && bio.length > 500) {
            return res.json({
                result: "fail",
                message: "자기소개는 500자 이하로 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const idCheckResult = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM USERS
                WHERE USER_ID = :userId
                  AND USER_STATUS = 'Y'
            `,
            {
                userId: userId
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (idCheckResult.rows[0].CNT > 0) {
            return res.json({
                result: "fail",
                message: "이미 사용 중인 아이디입니다."
            });
        }

        const nicknameCheckResult = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM USERS
                WHERE NICKNAME = :nickname
                  AND USER_STATUS = 'Y'
            `,
            {
                nickname: nickname
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (nicknameCheckResult.rows[0].CNT > 0) {
            return res.json({
                result: "fail",
                message: "이미 사용 중인 닉네임입니다."
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        await connection.execute(
            `
                INSERT INTO USERS (
                    USER_ID,
                    PASSWORD,
                    NICKNAME,
                    USER_TYPE,
                    EMAIL,
                    BIO,
                    ACCOUNT_PRIVATE_YN,
                    BOOKMARK_PUBLIC_YN,
                    USER_STATUS,
                    NOTI_FOLLOW_YN,
                    NOTI_COMMENT_YN,
                    NOTI_LIKE_YN,
                    NOTI_CHAT_YN
                ) VALUES (
                    :userId,
                    :password,
                    :nickname,
                    :userType,
                    :email,
                    :bio,
                    'N',
                    'N',
                    'Y',
                    'Y',
                    'Y',
                    'Y',
                    'Y'
                )
            `,
            {
                userId: userId,
                password: hashPassword,
                nickname: nickname,
                userType: userType || "TRAVELER",
                email: email || null,
                bio: bio || null
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "회원가입이 완료되었습니다."
        });

    } catch (error) {
        console.error("join error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "회원가입 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 로그인
router.post('/login', async (req, res) => {
    const { userId, password } = req.body;

    let connection;

    try {
        if (!userId || !password) {
            return res.json({
                result: "fail",
                message: "아이디와 비밀번호를 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT
                    USER_NO,
                    USER_ID,
                    PASSWORD,
                    NICKNAME,
                    USER_TYPE,
                    EMAIL,
                    PROFILE_IMG,
                    BIO,
                    ACCOUNT_PRIVATE_YN,
                    BOOKMARK_PUBLIC_YN,
                    USER_STATUS,
                    NOTI_FOLLOW_YN,
                    NOTI_COMMENT_YN,
                    NOTI_LIKE_YN,
                    NOTI_CHAT_YN
                FROM USERS
                WHERE LOWER(TRIM(USER_ID)) = LOWER(TRIM(:userId))
                  AND USER_STATUS = 'Y'
            `,
            {
                userId: userId
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "아이디 또는 비밀번호가 틀렸습니다."
            });
        }

        const user = result.rows[0];

        let isPasswordOk = false;

        // DB 비밀번호가 bcrypt 암호화된 경우
        if (user.PASSWORD && user.PASSWORD.startsWith("$2")) {
            isPasswordOk = await bcrypt.compare(password, user.PASSWORD);
        }

        // DB 비밀번호가 그냥 1234 같은 평문인 경우
        if (!isPasswordOk && user.PASSWORD === password) {
            isPasswordOk = true;

            // 평문 비밀번호를 자동으로 암호화해서 다시 저장
            const hashPassword = await bcrypt.hash(password, 10);

            await connection.execute(
                `
                    UPDATE USERS
                    SET PASSWORD = :hashPassword
                    WHERE USER_NO = :userNo
                `,
                {
                    hashPassword: hashPassword,
                    userNo: user.USER_NO
                }
            );

            await connection.commit();
        }

        if (!isPasswordOk) {
            return res.json({
                result: "fail",
                message: "아이디 또는 비밀번호가 틀렸습니다."
            });
        }

        const token = jwt.sign(
            {
                userNo: user.USER_NO,
                userId: user.USER_ID,
                nickname: user.NICKNAME,
                userType: user.USER_TYPE
            },
            process.env.jwt_key || "secret_key",
            {
                expiresIn: "2h"
            }
        );

        res.json({
            result: "success",
            message: "로그인 성공",
            token: token,
            user: {
                USER_NO: user.USER_NO,
                USER_ID: user.USER_ID,
                NICKNAME: user.NICKNAME,
                USER_TYPE: user.USER_TYPE,
                EMAIL: user.EMAIL,
                PROFILE_IMG: user.PROFILE_IMG,
                BIO: user.BIO,
                ACCOUNT_PRIVATE_YN: user.ACCOUNT_PRIVATE_YN,
                BOOKMARK_PUBLIC_YN: user.BOOKMARK_PUBLIC_YN,
                NOTI_FOLLOW_YN: user.NOTI_FOLLOW_YN,
                NOTI_COMMENT_YN: user.NOTI_COMMENT_YN,
                NOTI_LIKE_YN: user.NOTI_LIKE_YN,
                NOTI_CHAT_YN: user.NOTI_CHAT_YN
            }
        });

    } catch (error) {
        console.error("login error", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "로그인 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 프로필 조회
router.get('/profile/:userNo', async (req, res) => {
    const { userNo } = req.params;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const blockStatus = await getBlockStatus(connection, loginUser.userNo, userNo);

        if (blockStatus.blockedMe) {
            return res.json({
                result: "fail",
                message: "접근할 수 없는 프로필입니다."
            });
        }

        if (blockStatus.blockedByMe && String(loginUser.userNo) !== String(userNo)) {
            return res.json({
                result: "fail",
                message: "차단한 사용자입니다. 설정에서 차단을 해제할 수 있습니다."
            });
        }

        const canView = await canViewUserContent(connection, loginUser.userNo, userNo);

        const result = await connection.execute(
            `
                SELECT
                    U.USER_NO,
                    U.USER_ID,
                    U.NICKNAME,
                    U.USER_TYPE,
                    U.EMAIL,
                    U.PROFILE_IMG,
                    U.BIO,
                    U.ACCOUNT_PRIVATE_YN,
                    U.BOOKMARK_PUBLIC_YN,
                    U.NOTI_FOLLOW_YN,
                    U.NOTI_COMMENT_YN,
                    U.NOTI_LIKE_YN,
                    U.NOTI_CHAT_YN,

                    (
                        SELECT COUNT(*)
                        FROM FEED F
                        WHERE F.USER_NO = U.USER_NO
                    ) AS FEED_COUNT,

                    (
                        SELECT COUNT(*)
                        FROM FEED_BOOKMARK FB
                        WHERE FB.USER_NO = U.USER_NO
                    ) AS BOOKMARK_COUNT,

                    (
                        SELECT COUNT(*)
                        FROM USER_FOLLOW UF
                        INNER JOIN USERS FU
                            ON UF.FOLLOWER_NO = FU.USER_NO
                        WHERE UF.FOLLOWING_NO = U.USER_NO
                          AND UF.FOLLOW_STATUS = 'ACCEPTED'
                          AND FU.USER_STATUS = 'Y'
                    ) AS FOLLOWER_COUNT,

                    (
                        SELECT COUNT(*)
                        FROM USER_FOLLOW UF
                        INNER JOIN USERS TU
                            ON UF.FOLLOWING_NO = TU.USER_NO
                        WHERE UF.FOLLOWER_NO = U.USER_NO
                          AND UF.FOLLOW_STATUS = 'ACCEPTED'
                          AND TU.USER_STATUS = 'Y'
                    ) AS FOLLOWING_COUNT,

                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM USER_FOLLOW UF
                            INNER JOIN USERS TU
                                ON UF.FOLLOWING_NO = TU.USER_NO
                            WHERE UF.FOLLOWER_NO = :loginUserNo
                              AND UF.FOLLOWING_NO = U.USER_NO
                              AND UF.FOLLOW_STATUS = 'ACCEPTED'
                              AND TU.USER_STATUS = 'Y'
                        ) THEN 'Y'

                        WHEN EXISTS (
                            SELECT 1
                            FROM USER_FOLLOW UF
                            INNER JOIN USERS TU
                                ON UF.FOLLOWING_NO = TU.USER_NO
                            WHERE UF.FOLLOWER_NO = :loginUserNo
                              AND UF.FOLLOWING_NO = U.USER_NO
                              AND UF.FOLLOW_STATUS = 'PENDING'
                              AND TU.USER_STATUS = 'Y'
                        ) THEN 'P'

                        ELSE 'N'
                    END AS FOLLOW_YN

                FROM USERS U
                WHERE U.USER_NO = :userNo
                  AND U.USER_STATUS = 'Y'
            `,
            {
                userNo: userNo,
                loginUserNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 사용자입니다."
            });
        }

        const profile = result.rows[0];

        profile.CAN_VIEW_YN = canView ? "Y" : "N";
        profile.BLOCKED_BY_ME_YN = blockStatus.blockedByMe ? "Y" : "N";

        res.json({
            result: "success",
            profile: profile
        });

    } catch (error) {
        console.error("profile error", error);

        res.status(500).json({
            result: "fail",
            message: "프로필 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 프로필 수정
router.post('/profile/update', async (req, res) => {
    const { nickname, email, userType, bio } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!nickname) {
            return res.json({
                result: "fail",
                message: "닉네임을 입력해주세요."
            });
        }

        if (bio && bio.length > 500) {
            return res.json({
                result: "fail",
                message: "자기소개는 500자 이하로 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const nicknameResult = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM USERS
                WHERE NICKNAME = :nickname
                  AND USER_NO <> :userNo
                  AND USER_STATUS = 'Y'
            `,
            {
                nickname: nickname,
                userNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (nicknameResult.rows[0].CNT > 0) {
            return res.json({
                result: "fail",
                message: "이미 사용 중인 닉네임입니다."
            });
        }

        await connection.execute(
            `
                UPDATE USERS
                SET
                    NICKNAME = :nickname,
                    EMAIL = :email,
                    USER_TYPE = :userType,
                    BIO = :bio
                WHERE USER_NO = :userNo
                  AND USER_STATUS = 'Y'
            `,
            {
                nickname: nickname,
                email: email || null,
                userType: userType || "TRAVELER",
                bio: bio || null,
                userNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "프로필 정보가 수정되었습니다."
        });

    } catch (error) {
        console.error("profile update error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "프로필 수정 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 공개 / 비공개 전환
router.post('/privacy/toggle', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT ACCOUNT_PRIVATE_YN
                FROM USERS
                WHERE USER_NO = :userNo
                  AND USER_STATUS = 'Y'
            `,
            {
                userNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 사용자입니다."
            });
        }

        const currentYn = result.rows[0].ACCOUNT_PRIVATE_YN || "N";
        const nextYn = currentYn === "Y" ? "N" : "Y";

        await connection.execute(
            `
                UPDATE USERS
                SET ACCOUNT_PRIVATE_YN = :nextYn
                WHERE USER_NO = :userNo
            `,
            {
                nextYn: nextYn,
                userNo: loginUser.userNo
            }
        );

        if (nextYn === "N") {
            await connection.execute(
                `
                    UPDATE USER_FOLLOW
                    SET FOLLOW_STATUS = 'ACCEPTED'
                    WHERE FOLLOWING_NO = :userNo
                      AND FOLLOW_STATUS = 'PENDING'
                `,
                {
                    userNo: loginUser.userNo
                }
            );
        }

        await connection.commit();

        res.json({
            result: "success",
            accountPrivateYn: nextYn,
            message: nextYn === "Y" ? "비공개 계정으로 전환되었습니다." : "공개 계정으로 전환되었습니다."
        });

    } catch (error) {
        console.error("privacy toggle error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "계정 공개 설정 변경 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 저장한 루트 공개 / 비공개 전환
router.post('/bookmark/privacy/toggle', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT BOOKMARK_PUBLIC_YN
                FROM USERS
                WHERE USER_NO = :userNo
                  AND USER_STATUS = 'Y'
            `,
            {
                userNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 사용자입니다."
            });
        }

        const currentYn = result.rows[0].BOOKMARK_PUBLIC_YN || "N";
        const nextYn = currentYn === "Y" ? "N" : "Y";

        await connection.execute(
            `
                UPDATE USERS
                SET BOOKMARK_PUBLIC_YN = :nextYn
                WHERE USER_NO = :userNo
            `,
            {
                nextYn: nextYn,
                userNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            bookmarkPublicYn: nextYn,
            message: nextYn === "Y" ? "저장한 루트가 공개되었습니다." : "저장한 루트가 비공개되었습니다."
        });

    } catch (error) {
        console.error("bookmark privacy toggle error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "저장한 루트 공개 설정 변경 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 알림 설정 변경
router.post('/notifications/update', async (req, res) => {
    const { followYn, commentYn, likeYn, chatYn } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        await connection.execute(
            `
                UPDATE USERS
                SET
                    NOTI_FOLLOW_YN = :followYn,
                    NOTI_COMMENT_YN = :commentYn,
                    NOTI_LIKE_YN = :likeYn,
                    NOTI_CHAT_YN = :chatYn
                WHERE USER_NO = :userNo
                  AND USER_STATUS = 'Y'
            `,
            {
                followYn: yn(followYn),
                commentYn: yn(commentYn),
                likeYn: yn(likeYn),
                chatYn: yn(chatYn),
                userNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "알림 설정이 저장되었습니다."
        });

    } catch (error) {
        console.error("notifications update error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "알림 설정 저장 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 비밀번호 변경
router.post('/password/change', async (req, res) => {
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!currentPassword || !newPassword || !newPasswordConfirm) {
            return res.json({
                result: "fail",
                message: "현재 비밀번호와 새 비밀번호를 모두 입력해주세요."
            });
        }

        if (newPassword !== newPasswordConfirm) {
            return res.json({
                result: "fail",
                message: "새 비밀번호가 일치하지 않습니다."
            });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (!passwordRegex.test(newPassword)) {
            return res.json({
                result: "fail",
                message: "새 비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT PASSWORD
                FROM USERS
                WHERE USER_NO = :userNo
                  AND USER_STATUS = 'Y'
            `,
            {
                userNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "사용자 정보를 찾을 수 없습니다."
            });
        }

        const isPasswordOk = await bcrypt.compare(currentPassword, result.rows[0].PASSWORD);

        if (!isPasswordOk) {
            return res.json({
                result: "fail",
                message: "현재 비밀번호가 일치하지 않습니다."
            });
        }

        const hashPassword = await bcrypt.hash(newPassword, 10);

        await connection.execute(
            `
                UPDATE USERS
                SET PASSWORD = :password
                WHERE USER_NO = :userNo
            `,
            {
                password: hashPassword,
                userNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "비밀번호가 변경되었습니다. 다시 로그인해주세요."
        });

    } catch (error) {
        console.error("password change error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "비밀번호 변경 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 회원 탈퇴
router.post('/leave', async (req, res) => {
    const { password } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!password) {
            return res.json({
                result: "fail",
                message: "비밀번호를 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT PASSWORD
                FROM USERS
                WHERE USER_NO = :userNo
                  AND USER_STATUS = 'Y'
            `,
            {
                userNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "사용자 정보를 찾을 수 없습니다."
            });
        }

        const isPasswordOk = await bcrypt.compare(password, result.rows[0].PASSWORD);

        if (!isPasswordOk) {
            return res.json({
                result: "fail",
                message: "비밀번호가 일치하지 않습니다."
            });
        }

        await connection.execute(
            `
                DELETE FROM USER_FOLLOW
                WHERE FOLLOWER_NO = :userNo
                   OR FOLLOWING_NO = :userNo
            `,
            {
                userNo: loginUser.userNo
            }
        );

        await connection.execute(
            `
                DELETE FROM USER_BLOCK
                WHERE BLOCKER_NO = :userNo
                   OR BLOCKED_NO = :userNo
            `,
            {
                userNo: loginUser.userNo
            }
        );

        await connection.execute(
            `
                DELETE FROM FEED_BOOKMARK
                WHERE USER_NO = :userNo
            `,
            {
                userNo: loginUser.userNo
            }
        );

        await connection.execute(
            `
                UPDATE USERS
                SET
                    USER_STATUS = 'N',
                    USER_ID = 'deleted_' || USER_NO || '_' || TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'),
                    NICKNAME = 'deleted_' || USER_NO,
                    EMAIL = NULL,
                    BIO = NULL
                WHERE USER_NO = :userNo
            `,
            {
                userNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "회원 탈퇴가 완료되었습니다."
        });

    } catch (error) {
        console.error("leave error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "회원 탈퇴 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 작성 피드 목록
router.get('/profile/:userNo/feed', async (req, res) => {
    const { userNo } = req.params;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const canView = await canViewUserContent(connection, loginUser.userNo, userNo);

        if (!canView) {
            return res.json({
                result: "private",
                message: "비공개 계정입니다."
            });
        }

        const result = await connection.execute(
            `
                SELECT
                    F.FEED_NO,
                    F.TITLE,
                    F.CONTENT,
                    F.AREA,
                    F.CATEGORY,
                    F.MAIN_IMG,
                    F.ROUTE_SUMMARY,
                    F.HASHTAGS,
                    F.VIEW_COUNT,
                    F.CDATE,
                    F.USER_NO,
                    U.NICKNAME,
                    CASE
                        WHEN B.BOOKMARK_NO IS NULL THEN 'N'
                        ELSE 'Y'
                    END AS BOOKMARK_YN
                FROM FEED F
                LEFT JOIN USERS U
                    ON F.USER_NO = U.USER_NO
                LEFT JOIN FEED_BOOKMARK B
                    ON F.FEED_NO = B.FEED_NO
                   AND B.USER_NO = :loginUserNo
                WHERE F.USER_NO = :userNo
                ORDER BY F.FEED_NO DESC
            `,
            {
                userNo: userNo,
                loginUserNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                fetchInfo: {
                    CONTENT: { type: oracledb.STRING }
                }
            }
        );

        res.json({
            result: "success",
            list: result.rows
        });

    } catch (error) {
        console.error("profile feed error", error);

        res.status(500).json({
            result: "fail",
            message: "프로필 피드 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 저장한 루트 목록
router.get('/profile/:userNo/bookmark', async (req, res) => {
    const { userNo } = req.params;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const canView = await canViewBookmarkList(connection, loginUser.userNo, userNo);

        if (!canView) {
            return res.json({
                result: "private",
                message: "저장한 루트가 비공개입니다."
            });
        }

        const result = await connection.execute(
            `
                SELECT
                    F.FEED_NO,
                    F.TITLE,
                    F.CONTENT,
                    F.AREA,
                    F.CATEGORY,
                    F.MAIN_IMG,
                    F.ROUTE_SUMMARY,
                    F.HASHTAGS,
                    F.VIEW_COUNT,
                    F.CDATE,
                    F.USER_NO,
                    U.NICKNAME,
                    'Y' AS BOOKMARK_YN
                FROM FEED_BOOKMARK FB
                INNER JOIN FEED F
                    ON FB.FEED_NO = F.FEED_NO
                LEFT JOIN USERS U
                    ON F.USER_NO = U.USER_NO
                WHERE FB.USER_NO = :userNo
                ORDER BY FB.BOOKMARK_NO DESC
            `,
            {
                userNo: userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                fetchInfo: {
                    CONTENT: { type: oracledb.STRING }
                }
            }
        );

        res.json({
            result: "success",
            list: result.rows
        });

    } catch (error) {
        console.error("bookmark list error", error);

        res.status(500).json({
            result: "fail",
            message: "저장한 루트 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 팔로워 목록
router.get('/follower/list/:userNo', async (req, res) => {
    const { userNo } = req.params;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const canView = await canViewUserContent(connection, loginUser.userNo, userNo);

        if (!canView) {
            return res.json({
                result: "private",
                message: "비공개 계정입니다."
            });
        }

        const result = await connection.execute(
            `
                SELECT
                    U.USER_NO,
                    U.USER_ID,
                    U.NICKNAME,
                    U.USER_TYPE,
                    U.PROFILE_IMG,
                    U.BIO,
                    (
                        SELECT COUNT(*)
                        FROM FEED F
                        WHERE F.USER_NO = U.USER_NO
                    ) AS FEED_COUNT
                FROM USER_FOLLOW UF
                INNER JOIN USERS U
                    ON UF.FOLLOWER_NO = U.USER_NO
                WHERE UF.FOLLOWING_NO = :userNo
                  AND UF.FOLLOW_STATUS = 'ACCEPTED'
                  AND U.USER_STATUS = 'Y'
                ORDER BY UF.CDATE DESC
            `,
            {
                userNo: userNo
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
        console.error("follower list error", error);

        res.status(500).json({
            result: "fail",
            message: "팔로워 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 팔로잉 목록
router.get('/following/list/:userNo', async (req, res) => {
    const { userNo } = req.params;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const canView = await canViewUserContent(connection, loginUser.userNo, userNo);

        if (!canView) {
            return res.json({
                result: "private",
                message: "비공개 계정입니다."
            });
        }

        const result = await connection.execute(
            `
                SELECT
                    U.USER_NO,
                    U.USER_ID,
                    U.NICKNAME,
                    U.USER_TYPE,
                    U.PROFILE_IMG,
                    U.BIO,
                    (
                        SELECT COUNT(*)
                        FROM FEED F
                        WHERE F.USER_NO = U.USER_NO
                    ) AS FEED_COUNT
                FROM USER_FOLLOW UF
                INNER JOIN USERS U
                    ON UF.FOLLOWING_NO = U.USER_NO
                WHERE UF.FOLLOWER_NO = :userNo
                  AND UF.FOLLOW_STATUS = 'ACCEPTED'
                  AND U.USER_STATUS = 'Y'
                ORDER BY UF.CDATE DESC
            `,
            {
                userNo: userNo
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
        console.error("following list error", error);

        res.status(500).json({
            result: "fail",
            message: "팔로잉 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 받은 팔로우 요청 목록
router.get('/follow/request/list', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT
                    U.USER_NO,
                    U.USER_ID,
                    U.NICKNAME,
                    U.USER_TYPE,
                    U.PROFILE_IMG,
                    U.BIO,
                    (
                        SELECT COUNT(*)
                        FROM FEED F
                        WHERE F.USER_NO = U.USER_NO
                    ) AS FEED_COUNT
                FROM USER_FOLLOW UF
                INNER JOIN USERS U
                    ON UF.FOLLOWER_NO = U.USER_NO
                WHERE UF.FOLLOWING_NO = :loginUserNo
                  AND UF.FOLLOW_STATUS = 'PENDING'
                  AND U.USER_STATUS = 'Y'
                ORDER BY UF.CDATE DESC
            `,
            {
                loginUserNo: loginUser.userNo
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
        console.error("request list error", error);

        res.status(500).json({
            result: "fail",
            message: "팔로우 요청 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 팔로우 요청 승인
router.post('/follow/request/accept', async (req, res) => {
    const { requesterUserNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        await connection.execute(
            `
                UPDATE USER_FOLLOW
                SET FOLLOW_STATUS = 'ACCEPTED'
                WHERE FOLLOWER_NO = :requesterUserNo
                  AND FOLLOWING_NO = :loginUserNo
                  AND FOLLOW_STATUS = 'PENDING'
            `,
            {
                requesterUserNo: requesterUserNo,
                loginUserNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "팔로우 요청을 승인했습니다."
        });

    } catch (error) {
        console.error("request accept error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "팔로우 요청 승인 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 팔로우 요청 거절
router.post('/follow/request/reject', async (req, res) => {
    const { requesterUserNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        await connection.execute(
            `
                DELETE FROM USER_FOLLOW
                WHERE FOLLOWER_NO = :requesterUserNo
                  AND FOLLOWING_NO = :loginUserNo
                  AND FOLLOW_STATUS = 'PENDING'
            `,
            {
                requesterUserNo: requesterUserNo,
                loginUserNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "팔로우 요청을 거절했습니다."
        });

    } catch (error) {
        console.error("request reject error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "팔로우 요청 거절 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 팔로워 삭제
router.post('/follow/remove-follower', async (req, res) => {
    const { followerUserNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        await connection.execute(
            `
                DELETE FROM USER_FOLLOW
                WHERE FOLLOWER_NO = :followerUserNo
                  AND FOLLOWING_NO = :loginUserNo
            `,
            {
                followerUserNo: followerUserNo,
                loginUserNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "팔로워를 삭제했습니다."
        });

    } catch (error) {
        console.error("remove follower error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "팔로워 삭제 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 팔로우 / 언팔로우
router.post('/follow/toggle', async (req, res) => {
    const { targetUserNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (String(loginUser.userNo) === String(targetUserNo)) {
            return res.json({
                result: "fail",
                message: "자기 자신은 팔로우할 수 없습니다."
            });
        }

        connection = await db.getConnection();

        const blockStatus = await getBlockStatus(connection, loginUser.userNo, targetUserNo);

        if (blockStatus.blockedByMe || blockStatus.blockedMe) {
            return res.json({
                result: "fail",
                message: "팔로우할 수 없는 사용자입니다."
            });
        }

        const userCheckResult = await connection.execute(
            `
                SELECT
                    USER_NO,
                    ACCOUNT_PRIVATE_YN
                FROM USERS
                WHERE USER_NO = :targetUserNo
                  AND USER_STATUS = 'Y'
            `,
            {
                targetUserNo: targetUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (userCheckResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 사용자입니다."
            });
        }

        const targetUser = userCheckResult.rows[0];

        const followCheckResult = await connection.execute(
            `
                SELECT
                    FOLLOW_NO,
                    FOLLOW_STATUS
                FROM USER_FOLLOW
                WHERE FOLLOWER_NO = :followerNo
                  AND FOLLOWING_NO = :followingNo
            `,
            {
                followerNo: loginUser.userNo,
                followingNo: targetUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (followCheckResult.rows.length > 0) {
            await connection.execute(
                `
                    DELETE FROM USER_FOLLOW
                    WHERE FOLLOWER_NO = :followerNo
                      AND FOLLOWING_NO = :followingNo
                `,
                {
                    followerNo: loginUser.userNo,
                    followingNo: targetUserNo
                }
            );

            await connection.commit();

            return res.json({
                result: "success",
                followYn: "N",
                message: followCheckResult.rows[0].FOLLOW_STATUS === "PENDING" ? "팔로우 요청을 취소했습니다." : "팔로우를 취소했습니다."
            });
        }

        const followStatus = targetUser.ACCOUNT_PRIVATE_YN === "Y" ? "PENDING" : "ACCEPTED";

        await connection.execute(
            `
                INSERT INTO USER_FOLLOW (
                    FOLLOWER_NO,
                    FOLLOWING_NO,
                    FOLLOW_STATUS
                ) VALUES (
                    :followerNo,
                    :followingNo,
                    :followStatus
                )
            `,
            {
                followerNo: loginUser.userNo,
                followingNo: targetUserNo,
                followStatus: followStatus
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            followYn: followStatus === "ACCEPTED" ? "Y" : "P",
            message: followStatus === "ACCEPTED" ? "팔로우했습니다." : "팔로우 요청을 보냈습니다."
        });

    } catch (error) {
        console.error("follow toggle error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "팔로우 처리 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 차단 목록
router.get('/block/list', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT
                    U.USER_NO,
                    U.USER_ID,
                    U.NICKNAME,
                    U.USER_TYPE,
                    U.PROFILE_IMG,
                    U.BIO,
                    (
                        SELECT COUNT(*)
                        FROM FEED F
                        WHERE F.USER_NO = U.USER_NO
                    ) AS FEED_COUNT
                FROM USER_BLOCK UB
                INNER JOIN USERS U
                    ON UB.BLOCKED_NO = U.USER_NO
                WHERE UB.BLOCKER_NO = :loginUserNo
                  AND U.USER_STATUS = 'Y'
                ORDER BY UB.CDATE DESC
            `,
            {
                loginUserNo: loginUser.userNo
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
        console.error("block list error", error);

        res.status(500).json({
            result: "fail",
            message: "차단 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 차단 / 차단 해제
router.post('/block/toggle', async (req, res) => {
    const { targetUserNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (String(loginUser.userNo) === String(targetUserNo)) {
            return res.json({
                result: "fail",
                message: "자기 자신은 차단할 수 없습니다."
            });
        }

        connection = await db.getConnection();

        const checkResult = await connection.execute(
            `
                SELECT BLOCK_NO
                FROM USER_BLOCK
                WHERE BLOCKER_NO = :blockerNo
                  AND BLOCKED_NO = :blockedNo
            `,
            {
                blockerNo: loginUser.userNo,
                blockedNo: targetUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (checkResult.rows.length > 0) {
            await connection.execute(
                `
                    DELETE FROM USER_BLOCK
                    WHERE BLOCKER_NO = :blockerNo
                      AND BLOCKED_NO = :blockedNo
                `,
                {
                    blockerNo: loginUser.userNo,
                    blockedNo: targetUserNo
                }
            );

            await connection.commit();

            return res.json({
                result: "success",
                blockYn: "N",
                message: "차단을 해제했습니다."
            });
        }

        await connection.execute(
            `
                INSERT INTO USER_BLOCK (
                    BLOCKER_NO,
                    BLOCKED_NO
                ) VALUES (
                    :blockerNo,
                    :blockedNo
                )
            `,
            {
                blockerNo: loginUser.userNo,
                blockedNo: targetUserNo
            }
        );

        await connection.execute(
            `
                DELETE FROM USER_FOLLOW
                WHERE
                    (
                        FOLLOWER_NO = :loginUserNo
                        AND FOLLOWING_NO = :targetUserNo
                    )
                    OR
                    (
                        FOLLOWER_NO = :targetUserNo
                        AND FOLLOWING_NO = :loginUserNo
                    )
            `,
            {
                loginUserNo: loginUser.userNo,
                targetUserNo: targetUserNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            blockYn: "Y",
            message: "사용자를 차단했습니다."
        });

    } catch (error) {
        console.error("block toggle error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "차단 처리 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
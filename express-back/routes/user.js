const express = require('express');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require("../db");
const router = express.Router();

const profileUploadDir = path.join(__dirname, "..", "uploads", "profile");

if (!fs.existsSync(profileUploadDir)) {
    fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profileImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profileUploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const fileName = Date.now() + "-" + Math.round(Math.random() * 1000000000) + ext;

        cb(null, fileName);
    }
});

const uploadProfileImage = multer({
    storage: profileImageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("이미지 파일만 업로드할 수 있습니다."));
        }
    }
});

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

async function columnExists(connection, tableName, columnName) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM USER_TAB_COLUMNS
            WHERE TABLE_NAME = UPPER(:tableName)
              AND COLUMN_NAME = UPPER(:columnName)
        `,
        {
            tableName: tableName,
            columnName: columnName
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].CNT > 0;
}

async function ensureProfileImgColumn(connection) {
    const exists = await columnExists(connection, "USERS", "PROFILE_IMG");

    if (!exists) {
        await connection.execute(
            `
                ALTER TABLE USERS
                ADD PROFILE_IMG VARCHAR2(500)
            `
        );

        await connection.commit();
    }
}

async function getBlockStatus(connection, loginUserNo, targetUserNo) {
    const blockTableExists = await tableExists(connection, "USER_BLOCK");

    if (!blockTableExists) {
        return {
            blockedByMe: false,
            blockedMe: false
        };
    }

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

/* =========================
   아이디 중복체크
========================= */
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

/* =========================
   닉네임 중복체크
========================= */
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

/* =========================
   아이디 찾기
========================= */
router.post('/find-id', async (req, res) => {
    const { email, nickname } = req.body;

    let connection;

    try {
        if (!email || !nickname) {
            return res.json({
                result: "fail",
                message: "이메일과 닉네임을 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT USER_ID
                FROM USERS
                WHERE LOWER(TRIM(EMAIL)) = LOWER(TRIM(:email))
                  AND TRIM(NICKNAME) = TRIM(:nickname)
                  AND USER_STATUS = 'Y'
            `,
            {
                email: email,
                nickname: nickname
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "일치하는 계정을 찾을 수 없습니다."
            });
        }

        res.json({
            result: "success",
            message: "아이디를 찾았습니다.",
            userId: result.rows[0].USER_ID
        });

    } catch (error) {
        console.error("find id error", error);

        res.status(500).json({
            result: "fail",
            message: "아이디 찾기 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   비밀번호 재설정
========================= */
router.post('/password/reset', async (req, res) => {
    const { userId, email, newPassword, newPasswordConfirm } = req.body;

    let connection;

    try {
        if (!userId || !email || !newPassword || !newPasswordConfirm) {
            return res.json({
                result: "fail",
                message: "아이디, 이메일, 새 비밀번호를 모두 입력해주세요."
            });
        }

        if (newPassword !== newPasswordConfirm) {
            return res.json({
                result: "fail",
                message: "새 비밀번호가 서로 다릅니다."
            });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (!passwordRegex.test(newPassword)) {
            return res.json({
                result: "fail",
                message: "비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const userResult = await connection.execute(
            `
                SELECT USER_NO
                FROM USERS
                WHERE LOWER(TRIM(USER_ID)) = LOWER(TRIM(:userId))
                  AND LOWER(TRIM(EMAIL)) = LOWER(TRIM(:email))
                  AND USER_STATUS = 'Y'
            `,
            {
                userId: userId,
                email: email
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (userResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "아이디와 이메일이 일치하는 계정을 찾을 수 없습니다."
            });
        }

        const hashPassword = await bcrypt.hash(newPassword, 10);

        await connection.execute(
            `
                UPDATE USERS
                SET PASSWORD = :password
                WHERE USER_NO = :userNo
                  AND USER_STATUS = 'Y'
            `,
            {
                password: hashPassword,
                userNo: userResult.rows[0].USER_NO
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요."
        });

    } catch (error) {
        console.error("password reset error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "비밀번호 재설정 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   회원가입
========================= */
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

/* =========================
   로그인
========================= */
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

        await ensureProfileImgColumn(connection);

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

        if (user.PASSWORD && user.PASSWORD.startsWith("$2")) {
            isPasswordOk = await bcrypt.compare(password, user.PASSWORD);
        }

        if (!isPasswordOk && user.PASSWORD === password) {
            isPasswordOk = true;

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

/* =========================
   추천 사용자 목록
========================= */
router.get('/recommend/list', async (req, res) => {
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
                SELECT *
                FROM (
                    SELECT
                        U.USER_NO,
                        U.USER_ID,
                        U.NICKNAME,
                        U.USER_TYPE,
                        U.PROFILE_IMG,
                        U.BIO AS INTRO,
                        U.ACCOUNT_PRIVATE_YN,

                        (
                            SELECT COUNT(*)
                            FROM FEED F
                            WHERE F.USER_NO = U.USER_NO
                        ) AS FEED_COUNT,

                        (
                            SELECT COUNT(*)
                            FROM USER_FOLLOW UF
                            INNER JOIN USERS FU
                                ON UF.FOLLOWER_NO = FU.USER_NO
                            WHERE UF.FOLLOWING_NO = U.USER_NO
                              AND UF.FOLLOW_STATUS = 'ACCEPTED'
                              AND FU.USER_STATUS = 'Y'
                        ) AS FOLLOWER_COUNT,

                        CASE
                            WHEN U.USER_TYPE = 'GUIDE' THEN 1
                            WHEN U.USER_TYPE = 'LOCAL' THEN 2
                            ELSE 3
                        END AS USER_TYPE_ORDER

                    FROM USERS U
                    WHERE U.USER_STATUS = 'Y'
                      AND U.USER_NO <> :loginUserNo

                      AND NOT EXISTS (
                            SELECT 1
                            FROM USER_BLOCK UB
                            WHERE
                                (
                                    UB.BLOCKER_NO = :loginUserNo
                                    AND UB.BLOCKED_NO = U.USER_NO
                                )
                                OR
                                (
                                    UB.BLOCKER_NO = U.USER_NO
                                    AND UB.BLOCKED_NO = :loginUserNo
                                )
                      )

                      AND NOT EXISTS (
                            SELECT 1
                            FROM USER_FOLLOW UF
                            WHERE UF.FOLLOWER_NO = :loginUserNo
                              AND UF.FOLLOWING_NO = U.USER_NO
                              AND UF.FOLLOW_STATUS IN ('ACCEPTED', 'PENDING')
                      )

                    ORDER BY
                        USER_TYPE_ORDER,
                        FEED_COUNT DESC,
                        FOLLOWER_COUNT DESC,
                        U.USER_NO DESC
                )
                WHERE ROWNUM <= 10
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
        console.error("recommend list error", error);

        res.status(500).json({
            result: "fail",
            message: "추천 사용자 목록 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   프로필 조회
========================= */
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

        await ensureProfileImgColumn(connection);

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

/* =========================
   프로필 수정
========================= */
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
            message: "프로필이 수정되었습니다."
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

/* =========================
   프로필 이미지 변경
========================= */
router.post('/profile/image/update', uploadProfileImage.single("profileImage"), async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!req.file) {
            return res.json({
                result: "fail",
                message: "프로필 사진을 선택해주세요."
            });
        }

        const profileImg = "/uploads/profile/" + req.file.filename;

        connection = await db.getConnection();

        await ensureProfileImgColumn(connection);

        await connection.execute(
            `
                UPDATE USERS
                SET PROFILE_IMG = :profileImg
                WHERE USER_NO = :userNo
                  AND USER_STATUS = 'Y'
            `,
            {
                profileImg: profileImg,
                userNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "프로필 사진이 변경되었습니다.",
            profileImg: profileImg
        });

    } catch (error) {
        console.error("profile image update error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "프로필 사진 변경 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   프로필 피드 조회
========================= */
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
                message: "비공개 계정입니다.",
                list: []
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
                    U.PROFILE_IMG,

                    (
                        SELECT COUNT(*)
                        FROM FEED_LIKE FL
                        WHERE FL.FEED_NO = F.FEED_NO
                    ) AS LIKE_COUNT,

                    (
                        SELECT COUNT(*)
                        FROM FEED_COMMENT FC
                        WHERE FC.FEED_NO = F.FEED_NO
                          AND NVL(FC.COMMENT_STATUS, 'Y') = 'Y'
                    ) AS COMMENT_COUNT,

                    (
                        SELECT COUNT(*)
                        FROM FEED_BOOKMARK FB
                        WHERE FB.FEED_NO = F.FEED_NO
                    ) AS BOOKMARK_COUNT

                FROM FEED F
                INNER JOIN USERS U
                    ON F.USER_NO = U.USER_NO
                WHERE F.USER_NO = :userNo
                  AND U.USER_STATUS = 'Y'
                ORDER BY F.FEED_NO DESC
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

/* =========================
   프로필 즐겨찾기 조회
========================= */
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
                message: "즐겨찾기 목록이 비공개입니다.",
                list: []
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
                    U.PROFILE_IMG,

                    (
                        SELECT COUNT(*)
                        FROM FEED_LIKE FL
                        WHERE FL.FEED_NO = F.FEED_NO
                    ) AS LIKE_COUNT,

                    (
                        SELECT COUNT(*)
                        FROM FEED_COMMENT FC
                        WHERE FC.FEED_NO = F.FEED_NO
                          AND NVL(FC.COMMENT_STATUS, 'Y') = 'Y'
                    ) AS COMMENT_COUNT,

                    (
                        SELECT COUNT(*)
                        FROM FEED_BOOKMARK FB
                        WHERE FB.FEED_NO = F.FEED_NO
                    ) AS BOOKMARK_COUNT

                FROM FEED_BOOKMARK B
                INNER JOIN FEED F
                    ON B.FEED_NO = F.FEED_NO
                INNER JOIN USERS U
                    ON F.USER_NO = U.USER_NO
                WHERE B.USER_NO = :userNo
                  AND U.USER_STATUS = 'Y'
                ORDER BY B.BOOKMARK_NO DESC
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
        console.error("profile bookmark error", error);

        res.status(500).json({
            result: "fail",
            message: "즐겨찾기 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   팔로워 목록
========================= */
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
                message: "비공개 계정입니다.",
                list: []
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

/* =========================
   팔로잉 목록
========================= */
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
                message: "비공개 계정입니다.",
                list: []
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

/* =========================
   팔로우 / 팔로우 취소 / 요청
========================= */
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

        if (!targetUserNo) {
            return res.json({
                result: "fail",
                message: "대상 사용자 번호가 없습니다."
            });
        }

        if (String(loginUser.userNo) === String(targetUserNo)) {
            return res.json({
                result: "fail",
                message: "나 자신은 팔로우할 수 없습니다."
            });
        }

        connection = await db.getConnection();

        const targetResult = await connection.execute(
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

        if (targetResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 사용자입니다."
            });
        }

        const checkResult = await connection.execute(
            `
                SELECT FOLLOW_STATUS
                FROM USER_FOLLOW
                WHERE FOLLOWER_NO = :loginUserNo
                  AND FOLLOWING_NO = :targetUserNo
            `,
            {
                loginUserNo: loginUser.userNo,
                targetUserNo: targetUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (checkResult.rows.length > 0) {
            await connection.execute(
                `
                    DELETE FROM USER_FOLLOW
                    WHERE FOLLOWER_NO = :loginUserNo
                      AND FOLLOWING_NO = :targetUserNo
                `,
                {
                    loginUserNo: loginUser.userNo,
                    targetUserNo: targetUserNo
                }
            );

            await connection.commit();

            return res.json({
                result: "success",
                followYn: "N",
                message: "팔로우를 취소했습니다."
            });
        }

        const followStatus = targetResult.rows[0].ACCOUNT_PRIVATE_YN === "Y"
            ? "PENDING"
            : "ACCEPTED";

        await connection.execute(
            `
                INSERT INTO USER_FOLLOW (
                    FOLLOWER_NO,
                    FOLLOWING_NO,
                    FOLLOW_STATUS,
                    CDATE
                ) VALUES (
                    :followerNo,
                    :followingNo,
                    :followStatus,
                    SYSDATE
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

/* =========================
   팔로우 요청 목록
========================= */
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
                    UF.CDATE
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
        console.error("follow request list error", error);

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
        console.error("follow accept error", error);

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
        console.error("follow reject error", error);

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
            message: "팔로워에서 삭제했습니다."
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

/* =========================
   차단
========================= */
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

        if (!targetUserNo) {
            return res.json({
                result: "fail",
                message: "대상 사용자 번호가 없습니다."
            });
        }

        if (String(loginUser.userNo) === String(targetUserNo)) {
            return res.json({
                result: "fail",
                message: "나 자신은 차단할 수 없습니다."
            });
        }

        connection = await db.getConnection();

        const checkResult = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM USER_BLOCK
                WHERE BLOCKER_NO = :loginUserNo
                  AND BLOCKED_NO = :targetUserNo
            `,
            {
                loginUserNo: loginUser.userNo,
                targetUserNo: targetUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (checkResult.rows[0].CNT > 0) {
            await connection.execute(
                `
                    DELETE FROM USER_BLOCK
                    WHERE BLOCKER_NO = :loginUserNo
                      AND BLOCKED_NO = :targetUserNo
                `,
                {
                    loginUserNo: loginUser.userNo,
                    targetUserNo: targetUserNo
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
                    BLOCK_NO,
                    BLOCKER_NO,
                    BLOCKED_NO,
                    CDATE
                ) VALUES (
                    (SELECT NVL(MAX(BLOCK_NO), 0) + 1 FROM USER_BLOCK),
                    :blockerNo,
                    :blockedNo,
                    SYSDATE
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
                    U.BIO
                FROM USER_BLOCK B
                INNER JOIN USERS U
                    ON B.BLOCKED_NO = U.USER_NO
                WHERE B.BLOCKER_NO = :loginUserNo
                  AND U.USER_STATUS = 'Y'
                ORDER BY B.CDATE DESC
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

/* =========================
   공개 범위 / 알림
========================= */
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
            `,
            {
                userNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

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

        await connection.commit();

        res.json({
            result: "success",
            privateYn: nextYn,
            message: nextYn === "Y" ? "비공개 계정으로 변경했습니다." : "공개 계정으로 변경했습니다."
        });

    } catch (error) {
        console.error("privacy toggle error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "공개 범위 변경 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

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
            `,
            {
                userNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

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
            message: nextYn === "Y" ? "즐겨찾기 목록을 공개했습니다." : "즐겨찾기 목록을 비공개했습니다."
        });

    } catch (error) {
        console.error("bookmark privacy toggle error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "즐겨찾기 공개 설정 변경 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

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

/* =========================
   비밀번호 변경
========================= */
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
                message: "비밀번호를 모두 입력해주세요."
            });
        }

        if (newPassword !== newPasswordConfirm) {
            return res.json({
                result: "fail",
                message: "새 비밀번호가 서로 다릅니다."
            });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (!passwordRegex.test(newPassword)) {
            return res.json({
                result: "fail",
                message: "비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const userResult = await connection.execute(
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

        if (userResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "사용자를 찾을 수 없습니다."
            });
        }

        const user = userResult.rows[0];

        let isPasswordOk = false;

        if (user.PASSWORD && user.PASSWORD.startsWith("$2")) {
            isPasswordOk = await bcrypt.compare(currentPassword, user.PASSWORD);
        }

        if (!isPasswordOk && user.PASSWORD === currentPassword) {
            isPasswordOk = true;
        }

        if (!isPasswordOk) {
            return res.json({
                result: "fail",
                message: "현재 비밀번호가 틀렸습니다."
            });
        }

        const hashPassword = await bcrypt.hash(newPassword, 10);

        await connection.execute(
            `
                UPDATE USERS
                SET PASSWORD = :password
                WHERE USER_NO = :userNo
                  AND USER_STATUS = 'Y'
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

/* =========================
   회원탈퇴
========================= */
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

        const userResult = await connection.execute(
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

        if (userResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "사용자를 찾을 수 없습니다."
            });
        }

        const user = userResult.rows[0];

        let isPasswordOk = false;

        if (user.PASSWORD && user.PASSWORD.startsWith("$2")) {
            isPasswordOk = await bcrypt.compare(password, user.PASSWORD);
        }

        if (!isPasswordOk && user.PASSWORD === password) {
            isPasswordOk = true;
        }

        if (!isPasswordOk) {
            return res.json({
                result: "fail",
                message: "비밀번호가 틀렸습니다."
            });
        }

        await connection.execute(
            `
                UPDATE USERS
                SET USER_STATUS = 'N'
                WHERE USER_NO = :userNo
            `,
            {
                userNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "회원탈퇴가 완료되었습니다."
        });

    } catch (error) {
        console.error("leave error", error);

        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            result: "fail",
            message: "회원탈퇴 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
const express = require('express');
const oracledb = require('oracledb');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require("../db");
const router = express.Router();

/* =========================
   스토리 이미지 업로드 설정
========================= */

const storyUploadDir = path.join(__dirname, "..", "uploads", "story");

if (!fs.existsSync(storyUploadDir)) {
    fs.mkdirSync(storyUploadDir, { recursive: true });
}

const storyStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, storyUploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const fileName = Date.now() + "-" + Math.round(Math.random() * 1000000000) + ext;

        cb(null, fileName);
    }
});

const uploadStory = multer({
    storage: storyStorage,
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

function getLoginUserNo(loginUser) {
    if (!loginUser) {
        return "";
    }

    return (
        loginUser.userNo ||
        loginUser.USER_NO ||
        loginUser.user_no ||
        ""
    );
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

async function ensureStorySchema(connection) {
    const storyExists = await tableExists(connection, "STORY");

    if (!storyExists) {
        await connection.execute(
            `
                CREATE TABLE STORY (
                    STORY_NO NUMBER PRIMARY KEY,
                    USER_NO NUMBER NOT NULL,
                    STORY_IMG VARCHAR2(500),
                    STORY_CONTENT VARCHAR2(500),
                    STORY_STATUS VARCHAR2(20) DEFAULT 'Y',
                    CDATE DATE DEFAULT SYSDATE,
                    EXPIRE_DATE DATE
                )
            `
        );
    } else {
        const storyStatusExists = await columnExists(connection, "STORY", "STORY_STATUS");
        const expireDateExists = await columnExists(connection, "STORY", "EXPIRE_DATE");
        const storyContentExists = await columnExists(connection, "STORY", "STORY_CONTENT");

        if (!storyStatusExists) {
            await connection.execute(
                `
                    ALTER TABLE STORY ADD STORY_STATUS VARCHAR2(20) DEFAULT 'Y'
                `
            );
        }

        if (!expireDateExists) {
            await connection.execute(
                `
                    ALTER TABLE STORY ADD EXPIRE_DATE DATE
                `
            );
        }

        if (!storyContentExists) {
            await connection.execute(
                `
                    ALTER TABLE STORY ADD STORY_CONTENT VARCHAR2(500)
                `
            );
        }
    }

    const storyViewExists = await tableExists(connection, "STORY_VIEW");

    if (!storyViewExists) {
        await connection.execute(
            `
                CREATE TABLE STORY_VIEW (
                    VIEW_NO NUMBER PRIMARY KEY,
                    STORY_NO NUMBER NOT NULL,
                    USER_NO NUMBER NOT NULL,
                    CDATE DATE DEFAULT SYSDATE
                )
            `
        );
    } else {
        const viewNoExists = await columnExists(connection, "STORY_VIEW", "VIEW_NO");

        if (!viewNoExists) {
            await connection.execute(
                `
                    ALTER TABLE STORY_VIEW ADD VIEW_NO NUMBER
                `
            );
        }
    }

    const storyTextExists = await tableExists(connection, "STORY_TEXT");

    if (!storyTextExists) {
        await connection.execute(
            `
                CREATE TABLE STORY_TEXT (
                    TEXT_NO NUMBER PRIMARY KEY,
                    STORY_NO NUMBER NOT NULL,
                    TEXT_CONTENT VARCHAR2(500) NOT NULL,
                    POS_X NUMBER DEFAULT 50,
                    POS_Y NUMBER DEFAULT 50,
                    FONT_SIZE NUMBER DEFAULT 22,
                    FONT_COLOR VARCHAR2(30) DEFAULT '#FFFFFF',
                    BG_YN VARCHAR2(1) DEFAULT 'N',
                    CDATE DATE DEFAULT SYSDATE
                )
            `
        );
    }

    await connection.execute(
        `
            UPDATE STORY
            SET STORY_STATUS = 'Y'
            WHERE STORY_STATUS IS NULL
        `
    );

    await connection.execute(
        `
            UPDATE STORY
            SET EXPIRE_DATE = NVL(CDATE, SYSDATE) + 1
            WHERE EXPIRE_DATE IS NULL
        `
    );

    await connection.execute(
        `
            UPDATE STORY_VIEW
            SET VIEW_NO = ROWNUM
            WHERE VIEW_NO IS NULL
        `
    );

    await connection.commit();
}

async function getStoryViewCount(connection, storyNo) {
    const result = await connection.execute(
        `
            SELECT COUNT(DISTINCT SV.USER_NO) AS CNT
            FROM STORY_VIEW SV
            INNER JOIN STORY S
                ON SV.STORY_NO = S.STORY_NO
            WHERE SV.STORY_NO = :storyNo
              AND SV.USER_NO != S.USER_NO
        `,
        {
            storyNo: storyNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].CNT;
}

/* =========================
   스토리 업로드
========================= */
router.post('/add', uploadStory.single("storyImage"), async (req, res) => {
    const {
        content,
        textContent,
        textX,
        textY,
        fontSize,
        fontColor,
        textBgYn,
        textList
    } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!req.file) {
            return res.json({
                result: "fail",
                message: "스토리 이미지를 선택해주세요."
            });
        }

        connection = await db.getConnection();
        await ensureStorySchema(connection);

        const storyImg = "/uploads/story/" + req.file.filename;
        const cleanContent = content ? String(content).trim() : "";

        const insertResult = await connection.execute(
            `
                INSERT INTO STORY (
                    STORY_NO,
                    USER_NO,
                    STORY_IMG,
                    STORY_CONTENT,
                    STORY_STATUS,
                    CDATE,
                    EXPIRE_DATE
                ) VALUES (
                    (SELECT NVL(MAX(STORY_NO), 0) + 1 FROM STORY),
                    :userNo,
                    :storyImg,
                    :content,
                    'Y',
                    SYSDATE,
                    SYSDATE + 1
                )
                RETURNING STORY_NO INTO :storyNo
            `,
            {
                userNo: loginUserNo,
                storyImg: storyImg,
                content: cleanContent || null,
                storyNo: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.NUMBER
                }
            }
        );

        const storyNo = insertResult.outBinds.storyNo[0];

        let stickerList = [];

        if (textList) {
            try {
                const parsedList = JSON.parse(textList);

                if (Array.isArray(parsedList)) {
                    stickerList = parsedList;
                }
            } catch (parseError) {
                console.error("textList parse error", parseError);
                stickerList = [];
            }
        }

        if (stickerList.length === 0 && textContent && String(textContent).trim() !== "") {
            stickerList.push({
                textContent: textContent,
                posX: textX || 50,
                posY: textY || 50,
                fontSize: fontSize || 24,
                fontColor: fontColor || "#FFFFFF",
                bgYn: textBgYn === "Y" ? "Y" : "N"
            });
        }

        for (let i = 0; i < stickerList.length; i++) {
            const sticker = stickerList[i];
            const cleanTextContent =
                sticker.textContent !== undefined && sticker.textContent !== null
                    ? String(sticker.textContent).trim()
                    : "";

            if (cleanTextContent !== "") {
                await connection.execute(
                    `
                        INSERT INTO STORY_TEXT (
                            TEXT_NO,
                            STORY_NO,
                            TEXT_CONTENT,
                            POS_X,
                            POS_Y,
                            FONT_SIZE,
                            FONT_COLOR,
                            BG_YN,
                            CDATE
                        ) VALUES (
                            (SELECT NVL(MAX(TEXT_NO), 0) + 1 FROM STORY_TEXT),
                            :storyNo,
                            :textContent,
                            :posX,
                            :posY,
                            :fontSize,
                            :fontColor,
                            :bgYn,
                            SYSDATE
                        )
                    `,
                    {
                        storyNo: storyNo,
                        textContent: cleanTextContent,
                        posX: Number(sticker.posX || 50),
                        posY: Number(sticker.posY || 50),
                        fontSize: Number(sticker.fontSize || 24),
                        fontColor: sticker.fontColor || "#FFFFFF",
                        bgYn: sticker.bgYn === "Y" ? "Y" : "N"
                    }
                );
            }
        }

        await connection.commit();

        res.json({
            result: "success",
            message: "스토리가 등록되었습니다.",
            storyNo: storyNo,
            storyImg: storyImg
        });

    } catch (error) {
        console.error("story add error", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("story add rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "스토리 등록 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   멘션 사용자 검색
========================= */
router.get('/mention/search/:keyword', async (req, res) => {
    const { keyword } = req.params;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT
                    USER_NO,
                    USER_ID,
                    NICKNAME,
                    PROFILE_IMG,
                    USER_TYPE
                FROM USERS
                WHERE USER_STATUS = 'Y'
                  AND (
                        LOWER(USER_ID) = LOWER(:keyword)
                     OR LOWER(NICKNAME) = LOWER(:keyword)
                  )
                  AND ROWNUM = 1
            `,
            {
                keyword: keyword
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "해당 사용자를 찾을 수 없습니다."
            });
        }

        res.json({
            result: "success",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("story mention search error", error);

        res.status(500).json({
            result: "fail",
            message: "멘션 사용자 검색 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   홈 스토리 목록
========================= */
router.get('/list', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();
        await ensureStorySchema(connection);

        const result = await connection.execute(
            `
                SELECT
                    U.USER_NO,
                    U.USER_ID,
                    U.NICKNAME,
                    U.PROFILE_IMG,
                    U.USER_TYPE,
                    COUNT(DISTINCT S.STORY_NO) AS STORY_COUNT,
                    MAX(S.CDATE) AS LAST_STORY_DATE,
                    MAX(S.STORY_IMG) KEEP (DENSE_RANK LAST ORDER BY S.CDATE) AS FIRST_STORY_IMG,
                    COUNT(DISTINCT SV.STORY_NO) AS VIEWED_COUNT,
                    CASE
                        WHEN U.USER_NO = :loginUserNo THEN 'Y'
                        ELSE 'N'
                    END AS MINE_YN
                FROM USERS U
                INNER JOIN STORY S
                    ON U.USER_NO = S.USER_NO
                   AND NVL(S.STORY_STATUS, 'Y') = 'Y'
                   AND NVL(S.EXPIRE_DATE, SYSDATE + 1) > SYSDATE
                LEFT JOIN STORY_VIEW SV
                    ON S.STORY_NO = SV.STORY_NO
                   AND SV.USER_NO = :loginUserNo
                WHERE U.USER_STATUS = 'Y'
                GROUP BY
                    U.USER_NO,
                    U.USER_ID,
                    U.NICKNAME,
                    U.PROFILE_IMG,
                    U.USER_TYPE
                ORDER BY MAX(S.CDATE) DESC
            `,
            {
                loginUserNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        let list = result.rows || [];

        for (let i = 0; i < list.length; i++) {
            const storyCount = Number(list[i].STORY_COUNT || 0);
            const viewedCount = Number(list[i].VIEWED_COUNT || 0);

            if (storyCount > 0 && viewedCount >= storyCount) {
                list[i].ALL_VIEW_YN = "Y";
            } else {
                list[i].ALL_VIEW_YN = "N";
            }
        }

        const hasMine = list.some(item => String(item.USER_NO) === String(loginUserNo));

        if (!hasMine) {
            const myResult = await connection.execute(
                `
                    SELECT
                        USER_NO,
                        USER_ID,
                        NICKNAME,
                        PROFILE_IMG,
                        USER_TYPE
                    FROM USERS
                    WHERE USER_NO = :userNo
                      AND USER_STATUS = 'Y'
                `,
                {
                    userNo: loginUserNo
                },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );

            if (myResult.rows.length > 0) {
                list.unshift({
                    ...myResult.rows[0],
                    STORY_COUNT: 0,
                    FIRST_STORY_IMG: null,
                    VIEWED_COUNT: 0,
                    ALL_VIEW_YN: "Y",
                    MINE_YN: "Y"
                });
            }
        }

        list.sort((a, b) => {
            if (a.MINE_YN === "Y") {
                return -1;
            }

            if (b.MINE_YN === "Y") {
                return 1;
            }

            if (a.ALL_VIEW_YN !== b.ALL_VIEW_YN) {
                return a.ALL_VIEW_YN === "N" ? -1 : 1;
            }

            return 0;
        });

        res.json({
            result: "success",
            list: list
        });

    } catch (error) {
        console.error("story list error", error);

        res.status(500).json({
            result: "fail",
            message: "스토리 목록 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   특정 유저 스토리 목록
========================= */
router.get('/user/:userNo', async (req, res) => {
    const { userNo } = req.params;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();
        await ensureStorySchema(connection);

        const result = await connection.execute(
            `
                SELECT
                    S.STORY_NO,
                    S.USER_NO,
                    S.STORY_IMG,
                    S.STORY_CONTENT,
                    S.CDATE,
                    TO_CHAR(S.CDATE, 'YYYY-MM-DD HH24:MI') AS CDATE_TEXT,
                    U.USER_ID,
                    U.NICKNAME,
                    U.PROFILE_IMG,
                    U.USER_TYPE,
                    CASE
                        WHEN S.USER_NO = :loginUserNo THEN 'Y'
                        ELSE 'N'
                    END AS MINE_YN,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM STORY_VIEW SV
                            WHERE SV.STORY_NO = S.STORY_NO
                              AND SV.USER_NO = :loginUserNo
                        )
                        THEN 'Y'
                        ELSE 'N'
                    END AS VIEW_YN,
                    (
                        SELECT COUNT(DISTINCT SV2.USER_NO)
                        FROM STORY_VIEW SV2
                        WHERE SV2.STORY_NO = S.STORY_NO
                          AND SV2.USER_NO != S.USER_NO
                    ) AS VIEW_COUNT
                FROM STORY S
                INNER JOIN USERS U
                    ON S.USER_NO = U.USER_NO
                WHERE S.USER_NO = :userNo
                  AND NVL(S.STORY_STATUS, 'Y') = 'Y'
                  AND NVL(S.EXPIRE_DATE, SYSDATE + 1) > SYSDATE
                  AND U.USER_STATUS = 'Y'
                ORDER BY S.CDATE, S.STORY_NO
            `,
            {
                userNo: userNo,
                loginUserNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        const storyList = result.rows || [];
        const storyNoList = storyList.map(story => story.STORY_NO);

        if (storyNoList.length > 0) {
            const bindMap = {};

            for (let i = 0; i < storyNoList.length; i++) {
                bindMap["storyNo" + i] = storyNoList[i];
            }

            const textResult = await connection.execute(
                `
                    SELECT
                        TEXT_NO,
                        STORY_NO,
                        TEXT_CONTENT,
                        POS_X,
                        POS_Y,
                        FONT_SIZE,
                        FONT_COLOR,
                        BG_YN
                    FROM STORY_TEXT
                    WHERE STORY_NO IN (${storyNoList.map((_, index) => ":storyNo" + index).join(",")})
                    ORDER BY TEXT_NO
                `,
                bindMap,
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );

            const textList = textResult.rows || [];

            for (let i = 0; i < storyList.length; i++) {
                storyList[i].TEXT_LIST = textList.filter(text => {
                    return String(text.STORY_NO) === String(storyList[i].STORY_NO);
                });
            }
        } else {
            for (let i = 0; i < storyList.length; i++) {
                storyList[i].TEXT_LIST = [];
            }
        }

        res.json({
            result: "success",
            list: storyList
        });

    } catch (error) {
        console.error("story user list error", error);

        res.status(500).json({
            result: "fail",
            message: "유저 스토리 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   프로필 스토리 상태
========================= */
router.get('/profile/:userNo/status', async (req, res) => {
    const { userNo } = req.params;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();
        await ensureStorySchema(connection);

        const result = await connection.execute(
            `
                SELECT
                    COUNT(DISTINCT S.STORY_NO) AS STORY_COUNT,
                    COUNT(DISTINCT SV.STORY_NO) AS VIEWED_COUNT,
                    MAX(S.STORY_NO) KEEP (DENSE_RANK LAST ORDER BY S.CDATE) AS LATEST_STORY_NO
                FROM STORY S
                LEFT JOIN STORY_VIEW SV
                    ON S.STORY_NO = SV.STORY_NO
                   AND SV.USER_NO = :loginUserNo
                WHERE S.USER_NO = :userNo
                  AND NVL(S.STORY_STATUS, 'Y') = 'Y'
                  AND NVL(S.EXPIRE_DATE, SYSDATE + 1) > SYSDATE
            `,
            {
                userNo: userNo,
                loginUserNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        const row = result.rows[0];

        const storyCount = Number(row.STORY_COUNT || 0);
        const viewedCount = Number(row.VIEWED_COUNT || 0);

        let hasStoryYn = "N";
        let allViewYn = "Y";

        if (storyCount > 0) {
            hasStoryYn = "Y";

            if (viewedCount >= storyCount) {
                allViewYn = "Y";
            } else {
                allViewYn = "N";
            }
        }

        res.json({
            result: "success",
            hasStoryYn: hasStoryYn,
            allViewYn: allViewYn,
            storyCount: storyCount,
            viewedCount: viewedCount,
            latestStoryNo: row.LATEST_STORY_NO
        });

    } catch (error) {
        console.error("story profile status error", error);

        res.status(500).json({
            result: "fail",
            message: "프로필 스토리 상태 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   내 스토리 관리 목록
========================= */
router.get('/my/list', async (req, res) => {
    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();
        await ensureStorySchema(connection);

        const result = await connection.execute(
            `
                SELECT
                    S.STORY_NO,
                    S.USER_NO,
                    S.STORY_IMG,
                    S.STORY_CONTENT,
                    S.STORY_STATUS,
                    S.CDATE,
                    S.EXPIRE_DATE,
                    TO_CHAR(S.CDATE, 'YYYY-MM-DD HH24:MI') AS CDATE_TEXT,
                    TO_CHAR(S.EXPIRE_DATE, 'YYYY-MM-DD HH24:MI') AS EXPIRE_TEXT,
                    CASE
                        WHEN NVL(S.STORY_STATUS, 'Y') = 'Y'
                         AND NVL(S.EXPIRE_DATE, SYSDATE - 1) > SYSDATE
                        THEN 'Y'
                        ELSE 'N'
                    END AS ACTIVE_YN,
                    (
                        SELECT COUNT(DISTINCT SV.USER_NO)
                        FROM STORY_VIEW SV
                        WHERE SV.STORY_NO = S.STORY_NO
                          AND SV.USER_NO != S.USER_NO
                    ) AS VIEW_COUNT
                FROM STORY S
                WHERE S.USER_NO = :userNo
                  AND NVL(S.STORY_STATUS, 'Y') = 'Y'
                ORDER BY S.CDATE DESC
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
        console.error("story my list error", error);

        res.status(500).json({
            result: "fail",
            message: "내 스토리 목록 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   스토리 본 사람 목록
========================= */
router.get('/viewer/list/:storyNo', async (req, res) => {
    const { storyNo } = req.params;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        connection = await db.getConnection();
        await ensureStorySchema(connection);

        const storyResult = await connection.execute(
            `
                SELECT
                    STORY_NO,
                    USER_NO
                FROM STORY
                WHERE STORY_NO = :storyNo
            `,
            {
                storyNo: storyNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (storyResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 스토리입니다."
            });
        }

        const story = storyResult.rows[0];

        if (String(story.USER_NO) !== String(loginUserNo)) {
            return res.json({
                result: "fail",
                message: "내 스토리의 조회자만 확인할 수 있습니다."
            });
        }

        const result = await connection.execute(
            `
                SELECT
                    MAX(SV.VIEW_NO) AS VIEW_NO,
                    SV.STORY_NO,
                    SV.USER_NO,
                    MAX(SV.CDATE) AS CDATE,
                    TO_CHAR(MAX(SV.CDATE), 'YYYY-MM-DD HH24:MI') AS VIEW_DATE_TEXT,
                    U.USER_ID,
                    U.NICKNAME,
                    U.PROFILE_IMG,
                    U.USER_TYPE,
                    U.BIO
                FROM STORY_VIEW SV
                INNER JOIN USERS U
                    ON SV.USER_NO = U.USER_NO
                INNER JOIN STORY S
                    ON SV.STORY_NO = S.STORY_NO
                WHERE SV.STORY_NO = :storyNo
                  AND SV.USER_NO != S.USER_NO
                  AND U.USER_STATUS = 'Y'
                GROUP BY
                    SV.STORY_NO,
                    SV.USER_NO,
                    U.USER_ID,
                    U.NICKNAME,
                    U.PROFILE_IMG,
                    U.USER_TYPE,
                    U.BIO
                ORDER BY MAX(SV.CDATE) DESC
            `,
            {
                storyNo: storyNo
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
        console.error("story viewer list error", error);

        res.status(500).json({
            result: "fail",
            message: "스토리 조회자 목록 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   스토리 읽음 처리
========================= */
router.post('/view', async (req, res) => {
    const { storyNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!storyNo) {
            return res.json({
                result: "fail",
                message: "스토리 번호가 없습니다."
            });
        }

        connection = await db.getConnection();
        await ensureStorySchema(connection);

        const storyResult = await connection.execute(
            `
                SELECT
                    STORY_NO,
                    USER_NO
                FROM STORY
                WHERE STORY_NO = :storyNo
                  AND NVL(STORY_STATUS, 'Y') = 'Y'
                  AND NVL(EXPIRE_DATE, SYSDATE + 1) > SYSDATE
            `,
            {
                storyNo: storyNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (storyResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않거나 만료된 스토리입니다."
            });
        }

        const story = storyResult.rows[0];

        const checkResult = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM STORY_VIEW
                WHERE STORY_NO = :storyNo
                  AND USER_NO = :userNo
            `,
            {
                storyNo: storyNo,
                userNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (checkResult.rows[0].CNT === 0) {
            await connection.execute(
                `
                    INSERT INTO STORY_VIEW (
                        VIEW_NO,
                        STORY_NO,
                        USER_NO,
                        CDATE
                    ) VALUES (
                        (SELECT NVL(MAX(VIEW_NO), 0) + 1 FROM STORY_VIEW),
                        :storyNo,
                        :userNo,
                        SYSDATE
                    )
                `,
                {
                    storyNo: storyNo,
                    userNo: loginUserNo
                }
            );
        }

        const viewCount = await getStoryViewCount(connection, storyNo);

        await connection.commit();

        res.json({
            result: "success",
            message: "스토리 조회가 기록되었습니다.",
            mineYn: String(story.USER_NO) === String(loginUserNo) ? "Y" : "N",
            viewYn: "Y",
            viewCount: viewCount
        });

    } catch (error) {
        console.error("story view error", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("story view rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "스토리 조회 처리 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   내 스토리 삭제
========================= */
router.post('/remove', async (req, res) => {
    const { storyNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = getLoginUserNo(loginUser);

        if (!loginUserNo) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!storyNo) {
            return res.json({
                result: "fail",
                message: "스토리 번호가 없습니다."
            });
        }

        connection = await db.getConnection();
        await ensureStorySchema(connection);

        const storyResult = await connection.execute(
            `
                SELECT STORY_NO, USER_NO
                FROM STORY
                WHERE STORY_NO = :storyNo
                  AND NVL(STORY_STATUS, 'Y') = 'Y'
            `,
            {
                storyNo: storyNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (storyResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 스토리입니다."
            });
        }

        const story = storyResult.rows[0];

        if (String(story.USER_NO) !== String(loginUserNo)) {
            return res.json({
                result: "fail",
                message: "내 스토리만 삭제할 수 있습니다."
            });
        }

        await connection.execute(
            `
                UPDATE STORY
                SET STORY_STATUS = 'N'
                WHERE STORY_NO = :storyNo
            `,
            {
                storyNo: storyNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "스토리가 삭제되었습니다."
        });

    } catch (error) {
        console.error("story remove error", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("story remove rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "스토리 삭제 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
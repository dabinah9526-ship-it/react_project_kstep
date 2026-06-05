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

async function ensureSponsoredAdSaveTable(connection) {
    const saveTableExists = await tableExists(connection, "SPONSORED_AD_SAVE");

    if (!saveTableExists) {
        await connection.execute(
            `
                CREATE TABLE SPONSORED_AD_SAVE (
                    SAVE_NO NUMBER PRIMARY KEY,
                    AD_NO NUMBER NOT NULL,
                    USER_NO NUMBER NOT NULL,
                    CDATE DATE DEFAULT SYSDATE
                )
            `
        );

        await connection.commit();
    }
}

function normalizeLinkUrl(linkUrl) {
    if (!linkUrl) {
        return "";
    }

    const value = String(linkUrl).trim();

    if (value === "") {
        return "";
    }

    if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
    }

    return "https://" + value;
}

/* =========================
   Sponsored 광고 목록 조회
========================= */
router.get('/sponsor/list', async (req, res) => {
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

        const sponsoredAdExists = await tableExists(connection, "SPONSORED_AD");

        if (!sponsoredAdExists) {
            return res.json({
                result: "success",
                list: []
            });
        }

        await ensureSponsoredAdSaveTable(connection);

        const result = await connection.execute(
            `
                SELECT
                    A.AD_NO,
                    A.BUSINESS_NAME,
                    A.BUSINESS_TYPE,
                    A.AD_TITLE,
                    A.AD_TEXT,
                    A.AREA,
                    A.IMAGE_URL,
                    A.CTA_TEXT,
                    A.LINK_URL,
                    A.VIEW_COUNT,
                    A.CLICK_COUNT,
                    A.AD_STATUS,
                    A.DISPLAY_ORDER,
                    CASE
                        WHEN S.SAVE_NO IS NULL THEN 'N'
                        ELSE 'Y'
                    END AS SAVE_YN
                FROM SPONSORED_AD A
                LEFT JOIN SPONSORED_AD_SAVE S
                    ON A.AD_NO = S.AD_NO
                   AND S.USER_NO = :loginUserNo
                WHERE A.AD_STATUS = 'ACTIVE'
                ORDER BY A.DISPLAY_ORDER, A.AD_NO
            `,
            {
                loginUserNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        await connection.execute(
            `
                UPDATE SPONSORED_AD
                SET VIEW_COUNT = NVL(VIEW_COUNT, 0) + 1
                WHERE AD_STATUS = 'ACTIVE'
            `
        );

        await connection.commit();

        const list = result.rows.map(ad => {
            return {
                ...ad,
                LINK_URL: normalizeLinkUrl(ad.LINK_URL)
            };
        });

        res.json({
            result: "success",
            list: list
        });

    } catch (error) {
        console.error("sponsored ad list error", error);

        res.status(500).json({
            result: "fail",
            message: "광고 목록을 불러오는 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   Sponsored 광고 상세 조회
========================= */
router.get('/sponsor/detail/:adNo', async (req, res) => {
    const { adNo } = req.params;

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

        if (!adNo) {
            return res.json({
                result: "fail",
                message: "광고 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        const sponsoredAdExists = await tableExists(connection, "SPONSORED_AD");

        if (!sponsoredAdExists) {
            return res.json({
                result: "fail",
                message: "SPONSORED_AD 테이블이 없습니다."
            });
        }

        await ensureSponsoredAdSaveTable(connection);

        const result = await connection.execute(
            `
                SELECT
                    A.AD_NO,
                    A.BUSINESS_NAME,
                    A.BUSINESS_TYPE,
                    A.AD_TITLE,
                    A.AD_TEXT,
                    A.AREA,
                    A.IMAGE_URL,
                    A.CTA_TEXT,
                    A.LINK_URL,
                    A.VIEW_COUNT,
                    A.CLICK_COUNT,
                    A.AD_STATUS,
                    A.DISPLAY_ORDER,
                    CASE
                        WHEN S.SAVE_NO IS NULL THEN 'N'
                        ELSE 'Y'
                    END AS SAVE_YN
                FROM SPONSORED_AD A
                LEFT JOIN SPONSORED_AD_SAVE S
                    ON A.AD_NO = S.AD_NO
                   AND S.USER_NO = :loginUserNo
                WHERE A.AD_NO = :adNo
                  AND A.AD_STATUS = 'ACTIVE'
            `,
            {
                adNo: adNo,
                loginUserNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 광고입니다."
            });
        }

        await connection.execute(
            `
                UPDATE SPONSORED_AD
                SET VIEW_COUNT = NVL(VIEW_COUNT, 0) + 1
                WHERE AD_NO = :adNo
            `,
            {
                adNo: adNo
            }
        );

        await connection.commit();

        const ad = result.rows[0];

        res.json({
            result: "success",
            ad: {
                ...ad,
                LINK_URL: normalizeLinkUrl(ad.LINK_URL)
            }
        });

    } catch (error) {
        console.error("sponsored ad detail error", error);

        res.status(500).json({
            result: "fail",
            message: "광고 상세 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   Sponsored 광고 클릭 처리
========================= */
router.post('/sponsor/click', async (req, res) => {
    const { adNo } = req.body;

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

        if (!adNo) {
            return res.json({
                result: "fail",
                message: "광고 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        const sponsoredAdExists = await tableExists(connection, "SPONSORED_AD");

        if (!sponsoredAdExists) {
            return res.json({
                result: "fail",
                message: "SPONSORED_AD 테이블이 없습니다."
            });
        }

        const checkResult = await connection.execute(
            `
                SELECT
                    AD_NO,
                    LINK_URL
                FROM SPONSORED_AD
                WHERE AD_NO = :adNo
                  AND AD_STATUS = 'ACTIVE'
            `,
            {
                adNo: adNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (checkResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 광고입니다."
            });
        }

        await connection.execute(
            `
                UPDATE SPONSORED_AD
                SET CLICK_COUNT = NVL(CLICK_COUNT, 0) + 1
                WHERE AD_NO = :adNo
            `,
            {
                adNo: adNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "광고 클릭이 기록되었습니다.",
            linkUrl: normalizeLinkUrl(checkResult.rows[0].LINK_URL)
        });

    } catch (error) {
        console.error("sponsored ad click error", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("sponsored ad click rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "광고 클릭 처리 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   Sponsored 광고 저장 / 저장 취소
========================= */
router.post('/sponsor/save/toggle', async (req, res) => {
    const { adNo } = req.body;

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

        if (!adNo) {
            return res.json({
                result: "fail",
                message: "광고 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        const sponsoredAdExists = await tableExists(connection, "SPONSORED_AD");

        if (!sponsoredAdExists) {
            return res.json({
                result: "fail",
                message: "SPONSORED_AD 테이블이 없습니다."
            });
        }

        await ensureSponsoredAdSaveTable(connection);

        const adResult = await connection.execute(
            `
                SELECT
                    AD_NO
                FROM SPONSORED_AD
                WHERE AD_NO = :adNo
                  AND AD_STATUS = 'ACTIVE'
            `,
            {
                adNo: adNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (adResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 광고입니다."
            });
        }

        const checkResult = await connection.execute(
            `
                SELECT
                    SAVE_NO
                FROM SPONSORED_AD_SAVE
                WHERE AD_NO = :adNo
                  AND USER_NO = :userNo
            `,
            {
                adNo: adNo,
                userNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (checkResult.rows.length > 0) {
            await connection.execute(
                `
                    DELETE FROM SPONSORED_AD_SAVE
                    WHERE AD_NO = :adNo
                      AND USER_NO = :userNo
                `,
                {
                    adNo: adNo,
                    userNo: loginUserNo
                }
            );

            await connection.commit();

            return res.json({
                result: "success",
                saveYn: "N",
                message: "가게 저장을 해제했습니다."
            });
        }

        await connection.execute(
            `
                INSERT INTO SPONSORED_AD_SAVE (
                    SAVE_NO,
                    AD_NO,
                    USER_NO,
                    CDATE
                ) VALUES (
                    (SELECT NVL(MAX(SAVE_NO), 0) + 1 FROM SPONSORED_AD_SAVE),
                    :adNo,
                    :userNo,
                    SYSDATE
                )
            `,
            {
                adNo: adNo,
                userNo: loginUserNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            saveYn: "Y",
            message: "가게를 저장했습니다."
        });

    } catch (error) {
        console.error("sponsored ad save toggle error", error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("sponsored ad save rollback error", rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "가게 저장 처리 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

/* =========================
   저장한 Sponsored 광고 목록
========================= */
router.get('/sponsor/save/list', async (req, res) => {
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

        const sponsoredAdExists = await tableExists(connection, "SPONSORED_AD");

        if (!sponsoredAdExists) {
            return res.json({
                result: "success",
                list: []
            });
        }

        await ensureSponsoredAdSaveTable(connection);

        const result = await connection.execute(
            `
                SELECT
                    S.SAVE_NO,
                    S.CDATE AS SAVE_DATE,
                    A.AD_NO,
                    A.BUSINESS_NAME,
                    A.BUSINESS_TYPE,
                    A.AD_TITLE,
                    A.AD_TEXT,
                    A.AREA,
                    A.IMAGE_URL,
                    A.CTA_TEXT,
                    A.LINK_URL,
                    A.VIEW_COUNT,
                    A.CLICK_COUNT,
                    A.AD_STATUS,
                    A.DISPLAY_ORDER,
                    'Y' AS SAVE_YN
                FROM SPONSORED_AD_SAVE S
                INNER JOIN SPONSORED_AD A
                    ON S.AD_NO = A.AD_NO
                WHERE S.USER_NO = :userNo
                  AND A.AD_STATUS = 'ACTIVE'
                ORDER BY S.CDATE DESC, S.SAVE_NO DESC
            `,
            {
                userNo: loginUserNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        const list = result.rows.map(ad => {
            return {
                ...ad,
                LINK_URL: normalizeLinkUrl(ad.LINK_URL)
            };
        });

        res.json({
            result: "success",
            list: list
        });

    } catch (error) {
        console.error("sponsored ad save list error", error);

        res.status(500).json({
            result: "fail",
            message: "저장한 가게 목록 조회 중 오류가 발생했습니다.",
            error: error.message
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
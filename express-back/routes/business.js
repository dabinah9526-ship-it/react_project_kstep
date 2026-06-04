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
   Sponsored 광고 목록 조회
========================= */
router.get('/sponsor/list', async (req, res) => {
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

        const sponsoredAdExists = await tableExists(connection, "SPONSORED_AD");

        if (!sponsoredAdExists) {
            return res.json({
                result: "success",
                list: []
            });
        }

        const result = await connection.execute(
            `
                SELECT
                    AD_NO,
                    BUSINESS_NAME,
                    BUSINESS_TYPE,
                    AD_TITLE,
                    AD_TEXT,
                    AREA,
                    IMAGE_URL,
                    CTA_TEXT,
                    LINK_URL,
                    VIEW_COUNT,
                    CLICK_COUNT,
                    AD_STATUS,
                    DISPLAY_ORDER
                FROM SPONSORED_AD
                WHERE AD_STATUS = 'ACTIVE'
                ORDER BY DISPLAY_ORDER, AD_NO
            `,
            {},
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

        res.json({
            result: "success",
            list: result.rows
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
   Sponsored 광고 클릭 처리
========================= */
router.post('/sponsor/click', async (req, res) => {
    const { adNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
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
            linkUrl: checkResult.rows[0].LINK_URL
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

module.exports = router;
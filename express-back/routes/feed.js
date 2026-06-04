const express = require('express');
const oracledb = require('oracledb');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require("../db");
const router = express.Router();

/* =========================
   피드 이미지 여러 장 업로드 설정
========================= */

const feedUploadDir = path.join(__dirname, "..", "uploads", "feed");

if (!fs.existsSync(feedUploadDir)) {
    fs.mkdirSync(feedUploadDir, { recursive: true });
}

const feedImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, feedUploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const fileName = Date.now() + "-" + Math.round(Math.random() * 1000000000) + ext;

        cb(null, fileName);
    }
});

const uploadFeedImages = multer({
    storage: feedImageStorage,
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

async function canViewFeed(connection, loginUserNo, feedNo) {
    const feedResult = await connection.execute(
        `
            SELECT
                F.FEED_NO,
                F.USER_NO,
                U.ACCOUNT_PRIVATE_YN,
                U.USER_STATUS
            FROM FEED F
            INNER JOIN USERS U
                ON F.USER_NO = U.USER_NO
            WHERE F.FEED_NO = :feedNo
        `,
        {
            feedNo: feedNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    if (feedResult.rows.length === 0) {
        return {
            exists: false,
            canView: false
        };
    }

    const feed = feedResult.rows[0];

    if (feed.USER_STATUS !== "Y") {
        return {
            exists: false,
            canView: false
        };
    }

    const blockResult = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM USER_BLOCK
            WHERE
                (
                    BLOCKER_NO = :loginUserNo
                    AND BLOCKED_NO = :writerNo
                )
                OR
                (
                    BLOCKER_NO = :writerNo
                    AND BLOCKED_NO = :loginUserNo
                )
        `,
        {
            loginUserNo: loginUserNo,
            writerNo: feed.USER_NO
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    if (blockResult.rows[0].CNT > 0) {
        return {
            exists: true,
            canView: false
        };
    }

    if (String(feed.USER_NO) === String(loginUserNo)) {
        return {
            exists: true,
            canView: true
        };
    }

    if ((feed.ACCOUNT_PRIVATE_YN || "N") === "N") {
        return {
            exists: true,
            canView: true
        };
    }

    const followResult = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM USER_FOLLOW
            WHERE FOLLOWER_NO = :loginUserNo
              AND FOLLOWING_NO = :writerNo
              AND FOLLOW_STATUS = 'ACCEPTED'
        `,
        {
            loginUserNo: loginUserNo,
            writerNo: feed.USER_NO
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return {
        exists: true,
        canView: followResult.rows[0].CNT > 0
    };
}

async function getLikeCount(connection, feedNo) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM FEED_LIKE
            WHERE FEED_NO = :feedNo
        `,
        {
            feedNo: feedNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].CNT;
}

async function getCommentCount(connection, feedNo) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM FEED_COMMENT
            WHERE FEED_NO = :feedNo
              AND NVL(COMMENT_STATUS, 'Y') = 'Y'
        `,
        {
            feedNo: feedNo
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].CNT;
}

// 전체 피드 목록
router.get('/list', async (req, res) => {
    const { tag } = req.query;

    let connection;

    try {
        const loginUser = checkToken(req);
        const loginUserNo = loginUser ? loginUser.userNo : 0;
        const searchTag = tag ? tag.replace("#", "") : null;

        connection = await db.getConnection();

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
                    U.ACCOUNT_PRIVATE_YN,
                    CASE
                        WHEN B.BOOKMARK_NO IS NULL THEN 'N'
                        ELSE 'Y'
                    END AS BOOKMARK_YN,
                    CASE
                        WHEN L.USER_NO IS NULL THEN 'N'
                        ELSE 'Y'
                    END AS LIKE_YN,
                    (
                        SELECT COUNT(*)
                        FROM FEED_BOOKMARK FB
                        WHERE FB.FEED_NO = F.FEED_NO
                    ) AS BOOKMARK_COUNT,
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
                    ) AS COMMENT_COUNT
                FROM FEED F
                LEFT JOIN USERS U
                    ON F.USER_NO = U.USER_NO
                LEFT JOIN FEED_BOOKMARK B
                    ON F.FEED_NO = B.FEED_NO
                   AND B.USER_NO = :loginUserNo
                LEFT JOIN FEED_LIKE L
                    ON F.FEED_NO = L.FEED_NO
                   AND L.USER_NO = :loginUserNo
                WHERE U.USER_STATUS = 'Y'
                  AND NOT EXISTS (
                        SELECT 1
                        FROM USER_BLOCK UB
                        WHERE
                            (
                                UB.BLOCKER_NO = :loginUserNo
                                AND UB.BLOCKED_NO = F.USER_NO
                            )
                            OR
                            (
                                UB.BLOCKER_NO = F.USER_NO
                                AND UB.BLOCKED_NO = :loginUserNo
                            )
                  )
                  AND
                  (
                        NVL(U.ACCOUNT_PRIVATE_YN, 'N') = 'N'
                        OR F.USER_NO = :loginUserNo
                        OR EXISTS (
                            SELECT 1
                            FROM USER_FOLLOW UF
                            WHERE UF.FOLLOWER_NO = :loginUserNo
                              AND UF.FOLLOWING_NO = F.USER_NO
                              AND UF.FOLLOW_STATUS = 'ACCEPTED'
                        )
                  )
                  AND
                  (
                        :searchTag IS NULL
                        OR UPPER(F.HASHTAGS) LIKE '%' || UPPER(:searchTag) || '%'
                        OR UPPER(F.TITLE) LIKE '%' || UPPER(:searchTag) || '%'
                        OR UPPER(F.AREA) LIKE '%' || UPPER(:searchTag) || '%'
                        OR UPPER(F.CATEGORY) LIKE '%' || UPPER(:searchTag) || '%'
                        OR UPPER(F.ROUTE_SUMMARY) LIKE '%' || UPPER(:searchTag) || '%'
                  )
                ORDER BY F.FEED_NO DESC
            `,
            {
                loginUserNo: loginUserNo,
                searchTag: searchTag
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
        console.error('Error executing feed list query', error);

        res.status(500).json({
            result: "fail",
            message: "피드 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 팔로우한 사람 + 내 피드 목록
router.get('/following/list', async (req, res) => {
    const { tag } = req.query;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        const loginUserNo = loginUser.userNo;
        const searchTag = tag ? tag.replace("#", "") : null;

        connection = await db.getConnection();

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
                    U.ACCOUNT_PRIVATE_YN,
                    CASE
                        WHEN B.BOOKMARK_NO IS NULL THEN 'N'
                        ELSE 'Y'
                    END AS BOOKMARK_YN,
                    CASE
                        WHEN L.USER_NO IS NULL THEN 'N'
                        ELSE 'Y'
                    END AS LIKE_YN,
                    (
                        SELECT COUNT(*)
                        FROM FEED_BOOKMARK FB
                        WHERE FB.FEED_NO = F.FEED_NO
                    ) AS BOOKMARK_COUNT,
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
                    ) AS COMMENT_COUNT
                FROM FEED F
                LEFT JOIN USERS U
                    ON F.USER_NO = U.USER_NO
                LEFT JOIN FEED_BOOKMARK B
                    ON F.FEED_NO = B.FEED_NO
                   AND B.USER_NO = :loginUserNo
                LEFT JOIN FEED_LIKE L
                    ON F.FEED_NO = L.FEED_NO
                   AND L.USER_NO = :loginUserNo
                WHERE U.USER_STATUS = 'Y'
                  AND NOT EXISTS (
                        SELECT 1
                        FROM USER_BLOCK UB
                        WHERE
                            (
                                UB.BLOCKER_NO = :loginUserNo
                                AND UB.BLOCKED_NO = F.USER_NO
                            )
                            OR
                            (
                                UB.BLOCKER_NO = F.USER_NO
                                AND UB.BLOCKED_NO = :loginUserNo
                            )
                  )
                  AND
                  (
                        F.USER_NO = :loginUserNo
                        OR EXISTS (
                            SELECT 1
                            FROM USER_FOLLOW UF
                            WHERE UF.FOLLOWER_NO = :loginUserNo
                              AND UF.FOLLOWING_NO = F.USER_NO
                              AND UF.FOLLOW_STATUS = 'ACCEPTED'
                        )
                  )
                  AND
                  (
                        :searchTag IS NULL
                        OR UPPER(F.HASHTAGS) LIKE '%' || UPPER(:searchTag) || '%'
                        OR UPPER(F.TITLE) LIKE '%' || UPPER(:searchTag) || '%'
                        OR UPPER(F.AREA) LIKE '%' || UPPER(:searchTag) || '%'
                        OR UPPER(F.CATEGORY) LIKE '%' || UPPER(:searchTag) || '%'
                        OR UPPER(F.ROUTE_SUMMARY) LIKE '%' || UPPER(:searchTag) || '%'
                  )
                ORDER BY F.FEED_NO DESC
            `,
            {
                loginUserNo: loginUserNo,
                searchTag: searchTag
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
        console.error('Error executing following feed list query', error);

        res.status(500).json({
            result: "fail",
            message: "팔로우 피드 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 피드 작성
router.post('/add', uploadFeedImages.array("feedImages", 10), async (req, res) => {
    const {
        title,
        area,
        category,
        routeSummary,
        hashtags,
        content
    } = req.body;

    let spotList = [];
    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!title || !routeSummary || !content) {
            return res.json({
                result: "fail",
                message: "제목, 여행 루트, 여행 이야기는 필수입니다."
            });
        }

        if (req.body.spotList) {
            try {
                spotList = JSON.parse(req.body.spotList);
            } catch (error) {
                spotList = [];
            }
        }

        let cleanSpotList = [];

        if (Array.isArray(spotList)) {
            for (let i = 0; i < spotList.length; i++) {
                const spot = spotList[i] || {};

                const spotName = spot.spotName || "";
                const spotMemo = spot.spotMemo || "";
                const address = spot.address || "";
                const latValue = spot.lat || "";
                const lngValue = spot.lng || "";

                const hasInput =
                    String(spotName).trim() !== "" ||
                    String(spotMemo).trim() !== "" ||
                    String(address).trim() !== "" ||
                    String(latValue).trim() !== "" ||
                    String(lngValue).trim() !== "";

                if (hasInput) {
                    if (String(spotName).trim() === "") {
                        return res.json({
                            result: "fail",
                            message: (i + 1) + "번째 장소명을 입력해주세요."
                        });
                    }

                    let lat = null;
                    let lng = null;

                    if (String(latValue).trim() !== "") {
                        lat = Number(latValue);

                        if (Number.isNaN(lat)) {
                            return res.json({
                                result: "fail",
                                message: (i + 1) + "번째 위도는 숫자로 입력해주세요."
                            });
                        }
                    }

                    if (String(lngValue).trim() !== "") {
                        lng = Number(lngValue);

                        if (Number.isNaN(lng)) {
                            return res.json({
                                result: "fail",
                                message: (i + 1) + "번째 경도는 숫자로 입력해주세요."
                            });
                        }
                    }

                    cleanSpotList.push({
                        spotOrder: cleanSpotList.length + 1,
                        spotName: String(spotName).trim(),
                        spotMemo: String(spotMemo).trim(),
                        address: String(address).trim(),
                        lat: lat,
                        lng: lng
                    });
                }
            }
        }

        const uploadedFiles = req.files || [];
        const imageUrlList = [];

        for (let i = 0; i < uploadedFiles.length; i++) {
            imageUrlList.push("/uploads/feed/" + uploadedFiles[i].filename);
        }

        const mainImg = imageUrlList.length > 0 ? imageUrlList[0] : null;

        connection = await db.getConnection();

        if (cleanSpotList.length > 0) {
            const routeSpotExists = await tableExists(connection, "ROUTE_SPOT");

            if (!routeSpotExists) {
                return res.json({
                    result: "fail",
                    message: "ROUTE_SPOT 테이블이 없습니다. 먼저 ROUTE_SPOT 테이블을 생성해주세요."
                });
            }
        }

        if (imageUrlList.length > 0) {
            const feedImageExists = await tableExists(connection, "FEED_IMAGE");

            if (!feedImageExists) {
                return res.json({
                    result: "fail",
                    message: "FEED_IMAGE 테이블이 없습니다."
                });
            }
        }

        const insertFeedResult = await connection.execute(
            `
                INSERT INTO FEED (
                    TITLE,
                    CONTENT,
                    AREA,
                    CATEGORY,
                    MAIN_IMG,
                    ROUTE_SUMMARY,
                    HASHTAGS,
                    USER_NO
                ) VALUES (
                    :title,
                    :content,
                    :area,
                    :category,
                    :mainImg,
                    :routeSummary,
                    :hashtags,
                    :userNo
                )
                RETURNING FEED_NO INTO :feedNo
            `,
            {
                title: title,
                content: content,
                area: area,
                category: category,
                mainImg: mainImg,
                routeSummary: routeSummary,
                hashtags: hashtags || null,
                userNo: loginUser.userNo,
                feedNo: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.NUMBER
                }
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        const feedNo = insertFeedResult.outBinds.feedNo[0];

        for (let i = 0; i < imageUrlList.length; i++) {
            await connection.execute(
                `
                    INSERT INTO FEED_IMAGE (
                        IMAGE_NO,
                        IMAGE_URL,
                        IMAGE_ORDER,
                        FEED_NO
                    ) VALUES (
                        (SELECT NVL(MAX(IMAGE_NO), 0) + 1 FROM FEED_IMAGE),
                        :imageUrl,
                        :imageOrder,
                        :feedNo
                    )
                `,
                {
                    imageUrl: imageUrlList[i],
                    imageOrder: i + 1,
                    feedNo: feedNo
                }
            );
        }

        for (let i = 0; i < cleanSpotList.length; i++) {
            const spot = cleanSpotList[i];

            await connection.execute(
                `
                    INSERT INTO ROUTE_SPOT (
                        SPOT_NO,
                        SPOT_ORDER,
                        SPOT_NAME,
                        SPOT_MEMO,
                        ADDRESS,
                        LAT,
                        LNG,
                        FEED_NO
                    ) VALUES (
                        (SELECT NVL(MAX(SPOT_NO), 0) + 1 FROM ROUTE_SPOT),
                        :spotOrder,
                        :spotName,
                        :spotMemo,
                        :address,
                        :lat,
                        :lng,
                        :feedNo
                    )
                `,
                {
                    spotOrder: spot.spotOrder,
                    spotName: spot.spotName,
                    spotMemo: spot.spotMemo || null,
                    address: spot.address || null,
                    lat: spot.lat,
                    lng: spot.lng,
                    feedNo: feedNo
                }
            );
        }

        await connection.commit();

        res.json({
            result: "success",
            message: "피드가 등록되었습니다.",
            feedNo: feedNo,
            mainImg: mainImg,
            imageList: imageUrlList
        });

    } catch (error) {
        console.error('Error executing feed add query', error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error', rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "피드 등록 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 좋아요 추가 / 해제
router.post('/like/toggle', async (req, res) => {
    const { feedNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!feedNo) {
            return res.json({
                result: "fail",
                message: "피드 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        const accessInfo = await canViewFeed(connection, loginUser.userNo, feedNo);

        if (!accessInfo.exists) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 피드입니다."
            });
        }

        if (!accessInfo.canView) {
            return res.json({
                result: "private",
                message: "비공개 계정의 피드는 좋아요를 누를 수 없습니다."
            });
        }

        const checkResult = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM FEED_LIKE
                WHERE FEED_NO = :feedNo
                  AND USER_NO = :userNo
            `,
            {
                feedNo: feedNo,
                userNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (checkResult.rows[0].CNT > 0) {
            await connection.execute(
                `
                    DELETE FROM FEED_LIKE
                    WHERE FEED_NO = :feedNo
                      AND USER_NO = :userNo
                `,
                {
                    feedNo: feedNo,
                    userNo: loginUser.userNo
                }
            );

            const likeCount = await getLikeCount(connection, feedNo);

            await connection.commit();

            return res.json({
                result: "success",
                likeYn: "N",
                likeCount: likeCount,
                message: "좋아요를 취소했습니다."
            });
        }

        await connection.execute(
            `
                INSERT INTO FEED_LIKE (
                    FEED_NO,
                    USER_NO
                ) VALUES (
                    :feedNo,
                    :userNo
                )
            `,
            {
                feedNo: feedNo,
                userNo: loginUser.userNo
            }
        );

        const likeCount = await getLikeCount(connection, feedNo);

        await connection.commit();

        res.json({
            result: "success",
            likeYn: "Y",
            likeCount: likeCount,
            message: "좋아요를 눌렀습니다."
        });

    } catch (error) {
        console.error('Error executing like toggle query', error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error', rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "좋아요 처리 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 즐겨찾기 추가 / 해제
router.post('/bookmark/toggle', async (req, res) => {
    const { feedNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!feedNo) {
            return res.json({
                result: "fail",
                message: "피드 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        const accessInfo = await canViewFeed(connection, loginUser.userNo, feedNo);

        if (!accessInfo.exists) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 피드입니다."
            });
        }

        if (!accessInfo.canView) {
            return res.json({
                result: "private",
                message: "비공개 계정의 피드는 저장할 수 없습니다."
            });
        }

        const checkResult = await connection.execute(
            `
                SELECT BOOKMARK_NO
                FROM FEED_BOOKMARK
                WHERE FEED_NO = :feedNo
                  AND USER_NO = :userNo
            `,
            {
                feedNo: feedNo,
                userNo: loginUser.userNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (checkResult.rows.length > 0) {
            await connection.execute(
                `
                    DELETE FROM FEED_BOOKMARK
                    WHERE FEED_NO = :feedNo
                      AND USER_NO = :userNo
                `,
                {
                    feedNo: feedNo,
                    userNo: loginUser.userNo
                }
            );

            await connection.commit();

            return res.json({
                result: "success",
                bookmarkYn: "N",
                message: "즐겨찾기를 해제했습니다."
            });
        }

        await connection.execute(
            `
                INSERT INTO FEED_BOOKMARK (
                    BOOKMARK_NO,
                    FEED_NO,
                    USER_NO
                ) VALUES (
                    FEED_BOOKMARK_SEQ.NEXTVAL,
                    :feedNo,
                    :userNo
                )
            `,
            {
                feedNo: feedNo,
                userNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            bookmarkYn: "Y",
            message: "즐겨찾기에 추가했습니다."
        });

    } catch (error) {
        console.error('Error executing bookmark toggle query', error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error', rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "즐겨찾기 처리 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 피드 상세 조회
router.post('/detail', async (req, res) => {
    const { feedNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!feedNo) {
            return res.json({
                result: "fail",
                message: "피드 번호가 없습니다."
            });
        }

        const loginUserNo = loginUser.userNo;

        connection = await db.getConnection();

        const accessInfo = await canViewFeed(connection, loginUserNo, feedNo);

        if (!accessInfo.exists) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 피드입니다."
            });
        }

        if (!accessInfo.canView) {
            return res.json({
                result: "private",
                message: "비공개 계정의 피드입니다."
            });
        }

        await connection.execute(
            `
                UPDATE FEED
                SET VIEW_COUNT = NVL(VIEW_COUNT, 0) + 1
                WHERE FEED_NO = :feedNo
            `,
            {
                feedNo: feedNo
            }
        );

        await connection.commit();

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
                    U.ACCOUNT_PRIVATE_YN,
                    CASE
                        WHEN B.BOOKMARK_NO IS NULL THEN 'N'
                        ELSE 'Y'
                    END AS BOOKMARK_YN,
                    CASE
                        WHEN L.USER_NO IS NULL THEN 'N'
                        ELSE 'Y'
                    END AS LIKE_YN,
                    (
                        SELECT COUNT(*)
                        FROM FEED_BOOKMARK FB
                        WHERE FB.FEED_NO = F.FEED_NO
                    ) AS BOOKMARK_COUNT,
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
                    ) AS COMMENT_COUNT
                FROM FEED F
                LEFT JOIN USERS U
                    ON F.USER_NO = U.USER_NO
                LEFT JOIN FEED_BOOKMARK B
                    ON F.FEED_NO = B.FEED_NO
                   AND B.USER_NO = :loginUserNo
                LEFT JOIN FEED_LIKE L
                    ON F.FEED_NO = L.FEED_NO
                   AND L.USER_NO = :loginUserNo
                WHERE F.FEED_NO = :feedNo
            `,
            {
                feedNo: feedNo,
                loginUserNo: loginUserNo
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
            feed: result.rows[0]
        });

    } catch (error) {
        console.error('Error executing feed detail query', error);

        res.status(500).json({
            result: "fail",
            message: "피드 상세 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 피드 이미지 목록 조회
router.post('/image/list', async (req, res) => {
    const { feedNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!feedNo) {
            return res.json({
                result: "fail",
                message: "피드 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        const accessInfo = await canViewFeed(connection, loginUser.userNo, feedNo);

        if (!accessInfo.exists) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 피드입니다."
            });
        }

        if (!accessInfo.canView) {
            return res.json({
                result: "private",
                message: "비공개 계정의 피드입니다."
            });
        }

        const feedImageExists = await tableExists(connection, "FEED_IMAGE");

        let imageResult = {
            rows: []
        };

        if (feedImageExists) {
            imageResult = await connection.execute(
                `
                    SELECT
                        IMAGE_NO AS IMG_NO,
                        FEED_NO,
                        IMAGE_URL AS IMG_URL,
                        IMAGE_ORDER AS IMG_ORDER
                    FROM FEED_IMAGE
                    WHERE FEED_NO = :feedNo
                    ORDER BY IMAGE_ORDER, IMAGE_NO
                `,
                {
                    feedNo: feedNo
                },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );
        }

        if (imageResult.rows.length === 0) {
            const feedResult = await connection.execute(
                `
                    SELECT
                        FEED_NO,
                        MAIN_IMG
                    FROM FEED
                    WHERE FEED_NO = :feedNo
                `,
                {
                    feedNo: feedNo
                },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );

            if (feedResult.rows.length > 0 && feedResult.rows[0].MAIN_IMG) {
                imageResult.rows.push({
                    IMG_NO: 0,
                    FEED_NO: feedNo,
                    IMG_URL: feedResult.rows[0].MAIN_IMG,
                    IMG_ORDER: 1
                });
            }
        }

        res.json({
            result: "success",
            list: imageResult.rows
        });

    } catch (error) {
        console.error('Error executing feed image list query', error);

        res.status(500).json({
            result: "fail",
            message: "피드 이미지 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 여행 루트 장소 목록 조회
router.post('/route/spot/list', async (req, res) => {
    const { feedNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!feedNo) {
            return res.json({
                result: "fail",
                message: "피드 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        const accessInfo = await canViewFeed(connection, loginUser.userNo, feedNo);

        if (!accessInfo.exists) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 피드입니다."
            });
        }

        if (!accessInfo.canView) {
            return res.json({
                result: "private",
                message: "비공개 계정의 피드입니다."
            });
        }

        let result;

        const routeSpotExists = await tableExists(connection, "ROUTE_SPOT");
        const feedRouteExists = await tableExists(connection, "FEED_ROUTE");

        if (routeSpotExists) {
            result = await connection.execute(
                `
                    SELECT
                        SPOT_NO,
                        SPOT_ORDER,
                        SPOT_NAME,
                        SPOT_MEMO,
                        ADDRESS,
                        LAT,
                        LNG,
                        FEED_NO
                    FROM ROUTE_SPOT
                    WHERE FEED_NO = :feedNo
                    ORDER BY SPOT_ORDER
                `,
                {
                    feedNo: feedNo
                },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );
        } else if (feedRouteExists) {
            result = await connection.execute(
                `
                    SELECT
                        ROUTE_NO AS SPOT_NO,
                        PLACE_ORDER AS SPOT_ORDER,
                        PLACE_NAME AS SPOT_NAME,
                        MEMO AS SPOT_MEMO,
                        PLACE_ADDR AS ADDRESS,
                        LAT,
                        LNG,
                        FEED_NO
                    FROM FEED_ROUTE
                    WHERE FEED_NO = :feedNo
                    ORDER BY PLACE_ORDER
                `,
                {
                    feedNo: feedNo
                },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );
        } else {
            result = {
                rows: []
            };
        }

        res.json({
            result: "success",
            list: result.rows
        });

    } catch (error) {
        console.error('Error executing route spot list query', error);

        res.status(500).json({
            result: "fail",
            message: "여행 루트 장소 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 댓글 목록 조회
router.post('/comment/list', async (req, res) => {
    const { feedNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!feedNo) {
            return res.json({
                result: "fail",
                message: "피드 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        const accessInfo = await canViewFeed(connection, loginUser.userNo, feedNo);

        if (!accessInfo.exists) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 피드입니다."
            });
        }

        if (!accessInfo.canView) {
            return res.json({
                result: "private",
                message: "비공개 계정의 댓글은 볼 수 없습니다."
            });
        }

        const result = await connection.execute(
            `
                SELECT
                    FC.COMMENT_NO,
                    FC.FEED_NO,
                    FC.USER_NO,
                    FC.CONTENT,
                    FC.CDATE,
                    TO_CHAR(FC.CDATE, 'YYYY-MM-DD HH24:MI') AS CDATE_TEXT,
                    U.USER_ID,
                    U.NICKNAME,
                    U.PROFILE_IMG,
                    U.USER_TYPE,
                    CASE
                        WHEN FC.USER_NO = :loginUserNo THEN 'Y'
                        ELSE 'N'
                    END AS MINE_YN
                FROM FEED_COMMENT FC
                LEFT JOIN USERS U
                    ON FC.USER_NO = U.USER_NO
                WHERE FC.FEED_NO = :feedNo
                  AND NVL(FC.COMMENT_STATUS, 'Y') = 'Y'
                ORDER BY FC.COMMENT_NO DESC
            `,
            {
                feedNo: feedNo,
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
        console.error('Error executing comment list query', error);

        res.status(500).json({
            result: "fail",
            message: "댓글 목록 조회 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 댓글 작성
router.post('/comment/add', async (req, res) => {
    const { feedNo, content } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!feedNo) {
            return res.json({
                result: "fail",
                message: "피드 번호가 없습니다."
            });
        }

        const commentContent = content ? String(content).trim() : "";

        if (commentContent === "") {
            return res.json({
                result: "fail",
                message: "댓글 내용을 입력해주세요."
            });
        }

        if (commentContent.length > 500) {
            return res.json({
                result: "fail",
                message: "댓글은 500자 이하로 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const accessInfo = await canViewFeed(connection, loginUser.userNo, feedNo);

        if (!accessInfo.exists) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 피드입니다."
            });
        }

        if (!accessInfo.canView) {
            return res.json({
                result: "private",
                message: "비공개 계정의 피드에는 댓글을 작성할 수 없습니다."
            });
        }

        await connection.execute(
            `
                INSERT INTO FEED_COMMENT (
                    COMMENT_NO,
                    FEED_NO,
                    USER_NO,
                    CONTENT,
                    COMMENT_STATUS,
                    CDATE
                ) VALUES (
                    (SELECT NVL(MAX(COMMENT_NO), 0) + 1 FROM FEED_COMMENT),
                    :feedNo,
                    :userNo,
                    :content,
                    'Y',
                    SYSDATE
                )
            `,
            {
                feedNo: feedNo,
                userNo: loginUser.userNo,
                content: commentContent
            }
        );

        const commentCount = await getCommentCount(connection, feedNo);

        await connection.commit();

        res.json({
            result: "success",
            message: "댓글이 등록되었습니다.",
            commentCount: commentCount
        });

    } catch (error) {
        console.error('Error executing comment add query', error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error', rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "댓글 등록 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 댓글 수정
router.post('/comment/update', async (req, res) => {
    const { commentNo, content } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!commentNo) {
            return res.json({
                result: "fail",
                message: "댓글 번호가 없습니다."
            });
        }

        const commentContent = content ? String(content).trim() : "";

        if (commentContent === "") {
            return res.json({
                result: "fail",
                message: "댓글 내용을 입력해주세요."
            });
        }

        if (commentContent.length > 500) {
            return res.json({
                result: "fail",
                message: "댓글은 500자 이하로 입력해주세요."
            });
        }

        connection = await db.getConnection();

        const commentResult = await connection.execute(
            `
                SELECT
                    COMMENT_NO,
                    FEED_NO,
                    USER_NO
                FROM FEED_COMMENT
                WHERE COMMENT_NO = :commentNo
                  AND NVL(COMMENT_STATUS, 'Y') = 'Y'
            `,
            {
                commentNo: commentNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (commentResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 댓글입니다."
            });
        }

        const comment = commentResult.rows[0];

        if (String(comment.USER_NO) !== String(loginUser.userNo)) {
            return res.json({
                result: "fail",
                message: "내가 작성한 댓글만 수정할 수 있습니다."
            });
        }

        const accessInfo = await canViewFeed(connection, loginUser.userNo, comment.FEED_NO);

        if (!accessInfo.exists) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 피드의 댓글입니다."
            });
        }

        if (!accessInfo.canView) {
            return res.json({
                result: "private",
                message: "비공개 피드의 댓글은 수정할 수 없습니다."
            });
        }

        await connection.execute(
            `
                UPDATE FEED_COMMENT
                SET CONTENT = :content
                WHERE COMMENT_NO = :commentNo
                  AND USER_NO = :userNo
                  AND NVL(COMMENT_STATUS, 'Y') = 'Y'
            `,
            {
                content: commentContent,
                commentNo: commentNo,
                userNo: loginUser.userNo
            }
        );

        await connection.commit();

        res.json({
            result: "success",
            message: "댓글이 수정되었습니다."
        });

    } catch (error) {
        console.error('Error executing comment update query', error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error', rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "댓글 수정 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 댓글 삭제
router.post('/comment/remove', async (req, res) => {
    const { commentNo } = req.body;

    let connection;

    try {
        const loginUser = checkToken(req);

        if (!loginUser) {
            return res.status(401).json({
                result: "fail",
                message: "로그인이 필요합니다."
            });
        }

        if (!commentNo) {
            return res.json({
                result: "fail",
                message: "댓글 번호가 없습니다."
            });
        }

        connection = await db.getConnection();

        const commentResult = await connection.execute(
            `
                SELECT
                    COMMENT_NO,
                    FEED_NO,
                    USER_NO
                FROM FEED_COMMENT
                WHERE COMMENT_NO = :commentNo
                  AND NVL(COMMENT_STATUS, 'Y') = 'Y'
            `,
            {
                commentNo: commentNo
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (commentResult.rows.length === 0) {
            return res.json({
                result: "fail",
                message: "존재하지 않는 댓글입니다."
            });
        }

        const comment = commentResult.rows[0];

        if (String(comment.USER_NO) !== String(loginUser.userNo)) {
            return res.json({
                result: "fail",
                message: "내가 작성한 댓글만 삭제할 수 있습니다."
            });
        }

        await connection.execute(
            `
                UPDATE FEED_COMMENT
                SET COMMENT_STATUS = 'N'
                WHERE COMMENT_NO = :commentNo
            `,
            {
                commentNo: commentNo
            }
        );

        const commentCount = await getCommentCount(connection, comment.FEED_NO);

        await connection.commit();

        res.json({
            result: "success",
            message: "댓글이 삭제되었습니다.",
            commentCount: commentCount
        });

    } catch (error) {
        console.error('Error executing comment remove query', error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error', rollbackError);
            }
        }

        res.status(500).json({
            result: "fail",
            message: "댓글 삭제 중 오류가 발생했습니다."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
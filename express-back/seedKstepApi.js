const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
require("dotenv").config();

const db = require("./db");

const loginUserNo = Number(process.argv[2]);

const pexelsApiKey = process.env.PEXELS_API_KEY;

const authorList = [
    { userId: "kstep_food01", nickname: "로컬맛집러", userType: "LOCAL" },
    { userId: "kstep_cafe01", nickname: "카페산책자", userType: "TRAVELER" },
    { userId: "kstep_shop01", nickname: "골목쇼핑러", userType: "TRAVELER" },
    { userId: "kstep_tour01", nickname: "역사여행자", userType: "GUIDE" },
    { userId: "kstep_night01", nickname: "야경수집가", userType: "TRAVELER" },
    { userId: "kstep_nature01", nickname: "자연산책자", userType: "TRAVELER" },
    { userId: "kstep_busan01", nickname: "부산로컬", userType: "LOCAL" },
    { userId: "kstep_jeju01", nickname: "제주로컬", userType: "LOCAL" },
    { userId: "kstep_seoul01", nickname: "서울골목러", userType: "LOCAL" },
    { userId: "kstep_market01", nickname: "시장탐험가", userType: "TRAVELER" }
];

const feedList = [
    {
        authorUserId: "kstep_food01",
        title: "전주 로컬 맛집 코스",
        content: "전주에서 한식과 골목 간식을 함께 즐기는 맛집 루트입니다.",
        area: "전주",
        category: "맛집",
        imageQuery: "jeonju korean food market",
        routeSummary: "전주비빔밥 → 길거리 간식 → 전통 찻집",
        hashtags: "#맛집 #전주 #한식"
    },
    {
        authorUserId: "kstep_cafe01",
        title: "성수 감성 카페 루트",
        content: "성수 골목에서 카페와 소품샵을 함께 둘러보는 코스입니다.",
        area: "서울",
        category: "카페",
        imageQuery: "seoul cafe street aesthetic",
        routeSummary: "성수 카페 거리 → 소품샵 → 서울숲 산책",
        hashtags: "#카페 #서울 #성수"
    },
    {
        authorUserId: "kstep_shop01",
        title: "홍대 쇼핑 골목 루트",
        content: "홍대 주변 쇼핑과 카페를 같이 즐기는 코스입니다.",
        area: "서울",
        category: "쇼핑",
        imageQuery: "seoul shopping street",
        routeSummary: "홍대 거리 → 편집샵 → 디저트 카페",
        hashtags: "#쇼핑 #서울 #홍대"
    },
    {
        authorUserId: "kstep_tour01",
        title: "경주 역사 관광 루트",
        content: "경주의 대표 관광지를 천천히 걷는 여행 루트입니다.",
        area: "경주",
        category: "관광",
        imageQuery: "gyeongju korea traditional temple",
        routeSummary: "첨성대 → 대릉원 → 황리단길",
        hashtags: "#관광 #경주 #전통"
    },
    {
        authorUserId: "kstep_night01",
        title: "부산 야경 산책 코스",
        content: "부산 밤바다와 야경을 함께 즐기는 코스입니다.",
        area: "부산",
        category: "야경",
        imageQuery: "busan night view gwangalli",
        routeSummary: "광안리 해변 → 민락수변공원 → 야경 산책",
        hashtags: "#야경 #부산 #광안리"
    },
    {
        authorUserId: "kstep_nature01",
        title: "제주 자연 힐링 루트",
        content: "제주의 자연을 편하게 즐기는 산책 코스입니다.",
        area: "제주",
        category: "자연",
        imageQuery: "jeju island nature korea",
        routeSummary: "오름 산책 → 바다 전망 → 로컬 카페",
        hashtags: "#자연 #제주 #오름"
    },
    {
        authorUserId: "kstep_tour01",
        title: "안동 전통 마을 코스",
        content: "안동의 전통적인 분위기를 느끼는 관광 루트입니다.",
        area: "안동",
        category: "관광",
        imageQuery: "andong hahoe village korea",
        routeSummary: "하회마을 → 월영교 → 전통시장",
        hashtags: "#관광 #안동 #전통"
    },
    {
        authorUserId: "kstep_nature01",
        title: "포항 바다 산책 루트",
        content: "포항 바다를 중심으로 걷기 좋은 자연 루트입니다.",
        area: "포항",
        category: "자연",
        imageQuery: "pohang beach korea",
        routeSummary: "해변 산책 → 전망대 → 로컬 맛집",
        hashtags: "#자연 #포항 #바다"
    },
    {
        authorUserId: "kstep_cafe01",
        title: "강릉 바다 카페 루트",
        content: "강릉 바다를 보면서 카페를 즐기는 코스입니다.",
        area: "강릉",
        category: "카페",
        imageQuery: "gangneung beach cafe korea",
        routeSummary: "바다 카페 → 소품샵 → 해변 산책",
        hashtags: "#카페 #강릉 #바다"
    },
    {
        authorUserId: "kstep_food01",
        title: "부산 시장 맛집 루트",
        content: "부산 시장에서 다양한 로컬 음식을 즐기는 코스입니다.",
        area: "부산",
        category: "맛집",
        imageQuery: "busan food market korea",
        routeSummary: "시장 먹거리 → 로컬 식당 → 디저트",
        hashtags: "#맛집 #부산 #시장"
    },
    {
        authorUserId: "kstep_shop01",
        title: "대구 동성로 쇼핑 루트",
        content: "대구 동성로 중심의 쇼핑과 카페 루트입니다.",
        area: "대구",
        category: "쇼핑",
        imageQuery: "korea shopping street",
        routeSummary: "동성로 쇼핑 → 카페 → 야경 거리",
        hashtags: "#쇼핑 #대구 #동성로"
    },
    {
        authorUserId: "kstep_night01",
        title: "서울 한강 야경 루트",
        content: "서울 한강 주변에서 야경을 즐기는 코스입니다.",
        area: "서울",
        category: "야경",
        imageQuery: "seoul han river night",
        routeSummary: "한강공원 → 야경 산책 → 라이트 명소",
        hashtags: "#야경 #서울 #한강"
    },
    {
        authorUserId: "kstep_jeju01",
        title: "제주 동쪽 관광 루트",
        content: "제주 동쪽 관광 명소를 둘러보는 루트입니다.",
        area: "제주",
        category: "관광",
        imageQuery: "jeju seongsan sunrise peak",
        routeSummary: "성산일출봉 → 해안도로 → 로컬 맛집",
        hashtags: "#관광 #제주 #성산"
    },
    {
        authorUserId: "kstep_busan01",
        title: "해운대 카페 산책 코스",
        content: "해운대 근처 카페와 바다 산책을 함께 즐기는 코스입니다.",
        area: "부산",
        category: "카페",
        imageQuery: "haeundae busan cafe beach",
        routeSummary: "해운대 → 오션뷰 카페 → 해변 산책",
        hashtags: "#카페 #부산 #해운대"
    },
    {
        authorUserId: "kstep_seoul01",
        title: "북촌 관광 루트",
        content: "서울 북촌 골목과 전통 분위기를 즐기는 관광 루트입니다.",
        area: "서울",
        category: "관광",
        imageQuery: "bukchon hanok village seoul",
        routeSummary: "북촌 골목 → 전통 찻집 → 인사동",
        hashtags: "#관광 #서울 #북촌"
    },
    {
        authorUserId: "kstep_market01",
        title: "속초 시장 맛집 루트",
        content: "속초 시장에서 먹거리 중심으로 즐기는 루트입니다.",
        area: "속초",
        category: "맛집",
        imageQuery: "korea seafood market",
        routeSummary: "중앙시장 → 닭강정 → 카페",
        hashtags: "#맛집 #속초 #시장"
    }
];

const commentTextList = [
    "여기 코스 너무 예뻐요!",
    "저도 저장해뒀어요.",
    "다음 여행 때 참고할게요.",
    "사진 분위기 너무 좋아요.",
    "동선이 깔끔해서 좋네요.",
    "주말에 가면 사람 많을까요?",
    "이 루트 그대로 따라가보고 싶어요.",
    "로컬 느낌 나서 좋아요.",
    "친구랑 같이 가기 좋겠어요.",
    "저장 완료!"
];

const routeMap = {
    "서울": [
        { name: "성수역", lat: 37.5446, lng: 127.0557 },
        { name: "서울숲", lat: 37.5443, lng: 127.0374 },
        { name: "북촌한옥마을", lat: 37.5826, lng: 126.9830 },
        { name: "한강공원", lat: 37.5283, lng: 126.9326 }
    ],
    "부산": [
        { name: "광안리해수욕장", lat: 35.1532, lng: 129.1186 },
        { name: "해운대해수욕장", lat: 35.1587, lng: 129.1604 },
        { name: "서면", lat: 35.1577, lng: 129.0590 },
        { name: "민락수변공원", lat: 35.1539, lng: 129.1271 }
    ],
    "경주": [
        { name: "첨성대", lat: 35.8347, lng: 129.2190 },
        { name: "대릉원", lat: 35.8398, lng: 129.2118 },
        { name: "황리단길", lat: 35.8388, lng: 129.2128 },
        { name: "동궁과 월지", lat: 35.8345, lng: 129.2266 }
    ],
    "전주": [
        { name: "전주한옥마을", lat: 35.8151, lng: 127.1530 },
        { name: "경기전", lat: 35.8150, lng: 127.1499 },
        { name: "전동성당", lat: 35.8135, lng: 127.1490 },
        { name: "남부시장", lat: 35.8167, lng: 127.1458 }
    ],
    "제주": [
        { name: "성산일출봉", lat: 33.4580, lng: 126.9425 },
        { name: "사려니숲길", lat: 33.4507, lng: 126.5707 },
        { name: "동문시장", lat: 33.4996, lng: 126.5312 },
        { name: "서귀포해안", lat: 33.2448, lng: 126.5640 }
    ],
    "안동": [
        { name: "하회마을", lat: 36.5387, lng: 128.5186 },
        { name: "월영교", lat: 36.5658, lng: 128.7315 },
        { name: "안동민속촌", lat: 36.5669, lng: 128.7294 },
        { name: "안동구시장", lat: 36.5635, lng: 128.7302 }
    ],
    "포항": [
        { name: "영일대해수욕장", lat: 36.0570, lng: 129.3780 },
        { name: "호미곶", lat: 35.9919, lng: 129.5593 },
        { name: "죽도시장", lat: 36.0190, lng: 129.3435 },
        { name: "환호공원", lat: 36.0776, lng: 129.4110 }
    ],
    "강릉": [
        { name: "안목해변", lat: 37.7956, lng: 128.9179 },
        { name: "강릉카페거리", lat: 37.7913, lng: 128.9144 },
        { name: "중앙시장", lat: 37.7521, lng: 128.8760 },
        { name: "경포대", lat: 37.8058, lng: 128.9077 }
    ],
    "대구": [
        { name: "동성로", lat: 35.8690, lng: 128.5956 },
        { name: "반월당", lat: 35.8668, lng: 128.5945 },
        { name: "김광석거리", lat: 35.8880, lng: 128.6111 },
        { name: "서문시장", lat: 35.8562, lng: 128.5795 }
    ],
    "속초": [
        { name: "속초해수욕장", lat: 38.1904, lng: 128.6032 },
        { name: "속초중앙시장", lat: 38.2056, lng: 128.5918 },
        { name: "청초호", lat: 38.1807, lng: 128.5937 },
        { name: "설악산입구", lat: 38.1197, lng: 128.4656 }
    ]
};

async function searchPexelsImage(query) {
    if (!pexelsApiKey) {
        throw new Error(".env에 PEXELS_API_KEY가 없습니다.");
    }

    const url =
        "https://api.pexels.com/v1/search?query=" +
        encodeURIComponent(query) +
        "&per_page=1&orientation=portrait";

    const response = await fetch(url, {
        headers: {
            Authorization: pexelsApiKey
        }
    });

    if (!response.ok) {
        throw new Error("Pexels API 호출 실패: " + response.status);
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
        return null;
    }

    return data.photos[0].src.large2x || data.photos[0].src.portrait || data.photos[0].src.large;
}

async function tableExists(connection, tableName) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM USER_TABLES
            WHERE TABLE_NAME = UPPER(:tableName)
        `,
        { tableName },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows[0].CNT > 0;
}

async function executeDDL(connection, sql) {
    try {
        await connection.execute(sql);
    } catch (err) {
        if (!String(err.message).includes("ORA-00955")) {
            throw err;
        }
    }
}

async function ensureExtraTables(connection) {
    if (!(await tableExists(connection, "FEED_ROUTE"))) {
        await executeDDL(connection, `
            CREATE TABLE FEED_ROUTE (
                ROUTE_NO NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                FEED_NO NUMBER NOT NULL,
                PLACE_ORDER NUMBER NOT NULL,
                PLACE_NAME VARCHAR2(100) NOT NULL,
                PLACE_ADDR VARCHAR2(300),
                LAT NUMBER(12, 8),
                LNG NUMBER(12, 8),
                MEMO VARCHAR2(500),
                CDATE DATE DEFAULT SYSDATE
            )
        `);
    }

    if (!(await tableExists(connection, "FEED_COMMENT"))) {
        await executeDDL(connection, `
            CREATE TABLE FEED_COMMENT (
                COMMENT_NO NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                FEED_NO NUMBER NOT NULL,
                USER_NO NUMBER NOT NULL,
                CONTENT VARCHAR2(1000) NOT NULL,
                COMMENT_STATUS CHAR(1) DEFAULT 'Y',
                CDATE DATE DEFAULT SYSDATE
            )
        `);
    }

    if (!(await tableExists(connection, "FEED_LIKE"))) {
        await executeDDL(connection, `
            CREATE TABLE FEED_LIKE (
                LIKE_NO NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                FEED_NO NUMBER NOT NULL,
                USER_NO NUMBER NOT NULL,
                CDATE DATE DEFAULT SYSDATE
            )
        `);
    }

    if (!(await tableExists(connection, "FEED_BOOKMARK"))) {
        await executeDDL(connection, `
            CREATE TABLE FEED_BOOKMARK (
                BOOKMARK_NO NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                FEED_NO NUMBER NOT NULL,
                USER_NO NUMBER NOT NULL,
                CDATE DATE DEFAULT SYSDATE
            )
        `);
    }

    if (!(await tableExists(connection, "NOTIFICATION"))) {
        await executeDDL(connection, `
            CREATE TABLE NOTIFICATION (
                NOTI_NO NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                RECEIVER_NO NUMBER NOT NULL,
                SENDER_NO NUMBER,
                NOTI_TYPE VARCHAR2(30) NOT NULL,
                TARGET_NO NUMBER,
                CONTENT VARCHAR2(500),
                READ_YN CHAR(1) DEFAULT 'N',
                CDATE DATE DEFAULT SYSDATE
            )
        `);
    }
}

async function printUserList(connection) {
    const result = await connection.execute(
        `
            SELECT USER_NO, USER_ID, NICKNAME, USER_STATUS
            FROM USERS
            ORDER BY USER_NO
        `,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("");
    console.log("현재 USERS 목록");
    console.log("----------------------------------");

    for (const user of result.rows) {
        console.log(
            "USER_NO:",
            user.USER_NO,
            "/ USER_ID:",
            user.USER_ID,
            "/ NICKNAME:",
            user.NICKNAME,
            "/ STATUS:",
            user.USER_STATUS
        );
    }

    console.log("----------------------------------");
    console.log("사용법: node seedKstepApi.js 내_USER_NO");
    console.log("예시: node seedKstepApi.js 1");
    console.log("");
}

async function getUserNo(connection, userId) {
    const result = await connection.execute(
        `
            SELECT USER_NO
            FROM USERS
            WHERE USER_ID = :userId
        `,
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0].USER_NO;
}

async function ensureAuthor(connection, author, hashPassword) {
    let userNo = await getUserNo(connection, author.userId);

    if (userNo) {
        return userNo;
    }

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
                'Y',
                'Y',
                'Y',
                'Y',
                'Y',
                'Y'
            )
        `,
        {
            userId: author.userId,
            password: hashPassword,
            nickname: author.nickname,
            userType: author.userType,
            email: author.userId + "@kstep.local",
            bio: "K-STEP 샘플 여행자입니다."
        }
    );

    return await getUserNo(connection, author.userId);
}

async function ensureFollow(connection, followerNo, followingNo, status) {
    if (String(followerNo) === String(followingNo)) {
        return;
    }

    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM USER_FOLLOW
            WHERE FOLLOWER_NO = :followerNo
              AND FOLLOWING_NO = :followingNo
        `,
        { followerNo, followingNo },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows[0].CNT > 0) {
        return;
    }

    await connection.execute(
        `
            INSERT INTO USER_FOLLOW (
                FOLLOWER_NO,
                FOLLOWING_NO,
                FOLLOW_STATUS
            ) VALUES (
                :followerNo,
                :followingNo,
                :status
            )
        `,
        { followerNo, followingNo, status }
    );
}

async function getFeedNo(connection, title, userNo) {
    const result = await connection.execute(
        `
            SELECT FEED_NO
            FROM FEED
            WHERE TITLE = :title
              AND USER_NO = :userNo
        `,
        { title, userNo },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0].FEED_NO;
}

async function ensureFeed(connection, feed, authorNo, mainImg) {
    let feedNo = await getFeedNo(connection, feed.title, authorNo);

    if (feedNo) {
        return feedNo;
    }

    await connection.execute(
        `
            INSERT INTO FEED (
                USER_NO,
                TITLE,
                CONTENT,
                AREA,
                CATEGORY,
                MAIN_IMG,
                ROUTE_SUMMARY,
                HASHTAGS,
                VIEW_COUNT,
                CDATE
            ) VALUES (
                :userNo,
                :title,
                :content,
                :area,
                :category,
                :mainImg,
                :routeSummary,
                :hashtags,
                :viewCount,
                SYSDATE
            )
        `,
        {
            userNo: authorNo,
            title: feed.title,
            content: feed.content,
            area: feed.area,
            category: feed.category,
            mainImg: mainImg,
            routeSummary: feed.routeSummary,
            hashtags: feed.hashtags,
            viewCount: Math.floor(Math.random() * 80) + 10
        }
    );

    return await getFeedNo(connection, feed.title, authorNo);
}

async function ensureRoute(connection, feedNo, area, category) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM FEED_ROUTE
            WHERE FEED_NO = :feedNo
        `,
        { feedNo },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows[0].CNT > 0) {
        return;
    }

    const places = routeMap[area] || routeMap["서울"];

    for (let i = 0; i < places.length; i++) {
        const place = places[i];

        await connection.execute(
            `
                INSERT INTO FEED_ROUTE (
                    FEED_NO,
                    PLACE_ORDER,
                    PLACE_NAME,
                    PLACE_ADDR,
                    LAT,
                    LNG,
                    MEMO
                ) VALUES (
                    :feedNo,
                    :placeOrder,
                    :placeName,
                    :placeAddr,
                    :lat,
                    :lng,
                    :memo
                )
            `,
            {
                feedNo: feedNo,
                placeOrder: i + 1,
                placeName: place.name,
                placeAddr: area + " 추천 장소",
                lat: place.lat,
                lng: place.lng,
                memo: category + " 루트 " + (i + 1) + "번째 장소"
            }
        );
    }
}

async function ensureComment(connection, feedNo, userNo, content) {
    await connection.execute(
        `
            INSERT INTO FEED_COMMENT (
                FEED_NO,
                USER_NO,
                CONTENT,
                COMMENT_STATUS
            ) VALUES (
                :feedNo,
                :userNo,
                :content,
                'Y'
            )
        `,
        { feedNo, userNo, content }
    );
}

async function ensureLike(connection, feedNo, userNo) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM FEED_LIKE
            WHERE FEED_NO = :feedNo
              AND USER_NO = :userNo
        `,
        { feedNo, userNo },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows[0].CNT > 0) {
        return;
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
        { feedNo, userNo }
    );
}

async function ensureBookmark(connection, feedNo, userNo) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM FEED_BOOKMARK
            WHERE FEED_NO = :feedNo
              AND USER_NO = :userNo
        `,
        { feedNo, userNo },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows[0].CNT > 0) {
        return;
    }

    await connection.execute(
        `
            INSERT INTO FEED_BOOKMARK (
                FEED_NO,
                USER_NO
            ) VALUES (
                :feedNo,
                :userNo
            )
        `,
        { feedNo, userNo }
    );
}

async function ensureNotification(connection, receiverNo, senderNo, type, targetNo, content) {
    await connection.execute(
        `
            INSERT INTO NOTIFICATION (
                RECEIVER_NO,
                SENDER_NO,
                NOTI_TYPE,
                TARGET_NO,
                CONTENT,
                READ_YN
            ) VALUES (
                :receiverNo,
                :senderNo,
                :type,
                :targetNo,
                :content,
                'N'
            )
        `,
        { receiverNo, senderNo, type, targetNo, content }
    );
}

async function seed() {
    let connection;

    try {
        await db.init();
        connection = await db.getConnection();

        if (!loginUserNo) {
            await printUserList(connection);
            return;
        }

        const loginCheck = await connection.execute(
            `
                SELECT COUNT(*) AS CNT
                FROM USERS
                WHERE USER_NO = :loginUserNo
                  AND USER_STATUS = 'Y'
            `,
            { loginUserNo },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (loginCheck.rows[0].CNT === 0) {
            console.log("입력한 USER_NO가 없거나 탈퇴 상태입니다.");
            await printUserList(connection);
            return;
        }

        await ensureExtraTables(connection);

        const hashPassword = await bcrypt.hash("test1234", 10);

        const authorNoMap = {};
        const allUserNos = [loginUserNo];

        for (const author of authorList) {
            const userNo = await ensureAuthor(connection, author, hashPassword);
            authorNoMap[author.userId] = userNo;
            allUserNos.push(userNo);
        }

        for (const author of authorList) {
            await ensureFollow(connection, loginUserNo, authorNoMap[author.userId], "ACCEPTED");
        }

        for (let i = 0; i < authorList.length; i++) {
            const fromNo = authorNoMap[authorList[i].userId];
            const toNo = authorNoMap[authorList[(i + 1) % authorList.length].userId];

            await ensureFollow(connection, fromNo, loginUserNo, "ACCEPTED");
            await ensureFollow(connection, fromNo, toNo, "ACCEPTED");
        }

        const feedNoList = [];

        for (let i = 0; i < feedList.length; i++) {
            const feed = feedList[i];
            const authorNo = authorNoMap[feed.authorUserId];

            console.log("이미지 검색:", feed.imageQuery);
            const imageUrl = await searchPexelsImage(feed.imageQuery);

            const mainImg = imageUrl || "https://images.pexels.com/photos/10549898/pexels-photo-10549898.jpeg";

            const feedNo = await ensureFeed(connection, feed, authorNo, mainImg);
            feedNoList.push(feedNo);

            await ensureRoute(connection, feedNo, feed.area, feed.category);

            for (let j = 0; j < 4; j++) {
                const commentUserNo = allUserNos[(i + j) % allUserNos.length];
                const commentText = commentTextList[(i + j) % commentTextList.length];

                await ensureComment(connection, feedNo, commentUserNo, commentText);
            }

            for (let j = 0; j < 6; j++) {
                const likeUserNo = allUserNos[(i + j + 2) % allUserNos.length];
                await ensureLike(connection, feedNo, likeUserNo);
            }

            for (let j = 0; j < 3; j++) {
                const bookmarkUserNo = allUserNos[(i + j + 4) % allUserNos.length];
                await ensureBookmark(connection, feedNo, bookmarkUserNo);
            }

            if (i % 2 === 0) {
                await ensureBookmark(connection, feedNo, loginUserNo);
            }

            await ensureNotification(
                connection,
                loginUserNo,
                authorNo,
                "FEED",
                feedNo,
                feed.title + " 새 루트가 올라왔어요."
            );
        }

        await connection.commit();

        console.log("");
        console.log("외부 이미지 API 기반 샘플 데이터 입력 완료!");
        console.log("이미지 파일을 직접 넣을 필요 없이 MAIN_IMG에 Pexels 이미지 URL이 저장됐습니다.");
        console.log("샘플 계정 비밀번호: test1234");
        console.log("");

    } catch (err) {
        console.error("샘플 데이터 입력 중 오류", err);

        if (connection) {
            await connection.rollback();
        }

    } finally {
        if (connection) {
            await connection.close();
        }

        process.exit();
    }
}

seed();
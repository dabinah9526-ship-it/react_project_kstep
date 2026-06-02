const oracledb = require("oracledb");
const db = require("./db");

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
    "저장 완료!",
    "여행 일정 짤 때 도움 많이 될 것 같아요.",
    "여기 실제로 가봤는데 좋았어요.",
    "카페랑 산책 코스 같이 있는 거 좋네요.",
    "맛집 정보도 같이 있어서 편해요.",
    "다음에 가족이랑 가보고 싶어요.",
    "분위기 너무 제 스타일이에요.",
    "루트가 복잡하지 않아서 좋네요.",
    "초보 여행자도 따라가기 쉬울 것 같아요.",
    "지도랑 같이 보면 더 좋을 것 같아요.",
    "이런 로컬 코스 더 올려주세요."
];

async function getColumns(connection, tableName) {
    const result = await connection.execute(
        `
            SELECT COLUMN_NAME
            FROM USER_TAB_COLUMNS
            WHERE TABLE_NAME = UPPER(:tableName)
        `,
        {
            tableName: tableName
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows.map(row => row.COLUMN_NAME);
}

async function getIdentityColumns(connection, tableName) {
    const result = await connection.execute(
        `
            SELECT COLUMN_NAME
            FROM USER_TAB_IDENTITY_COLS
            WHERE TABLE_NAME = UPPER(:tableName)
        `,
        {
            tableName: tableName
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows.map(row => row.COLUMN_NAME);
}

function hasColumn(columns, columnName) {
    return columns.includes(columnName.toUpperCase());
}

async function getNextCommentNo(connection) {
    const result = await connection.execute(
        `
            SELECT NVL(MAX(COMMENT_NO), 0) + 1 AS NEXT_NO
            FROM FEED_COMMENT
        `,
        {},
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].NEXT_NO;
}

async function commentExists(connection, feedNo, userNo, content) {
    const result = await connection.execute(
        `
            SELECT COUNT(*) AS CNT
            FROM FEED_COMMENT
            WHERE FEED_NO = :feedNo
              AND USER_NO = :userNo
              AND CONTENT = :content
        `,
        {
            feedNo: feedNo,
            userNo: userNo,
            content: content
        },
        {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        }
    );

    return result.rows[0].CNT > 0;
}

async function insertComment(connection, commentColumns, identityColumns, commentNo, feedNo, userNo, content) {
    const insertColumns = [];
    const values = [];
    const binds = {};

    const commentNoIsIdentity = identityColumns.includes("COMMENT_NO");

    if (hasColumn(commentColumns, "COMMENT_NO") && !commentNoIsIdentity) {
        insertColumns.push("COMMENT_NO");
        values.push(":commentNo");
        binds.commentNo = commentNo;
    }

    if (hasColumn(commentColumns, "CONTENT")) {
        insertColumns.push("CONTENT");
        values.push(":content");
        binds.content = content;
    }

    if (hasColumn(commentColumns, "FEED_NO")) {
        insertColumns.push("FEED_NO");
        values.push(":feedNo");
        binds.feedNo = feedNo;
    }

    if (hasColumn(commentColumns, "CDATE")) {
        insertColumns.push("CDATE");
        values.push("SYSDATE");
    }

    if (hasColumn(commentColumns, "USER_NO")) {
        insertColumns.push("USER_NO");
        values.push(":userNo");
        binds.userNo = userNo;
    }

    if (hasColumn(commentColumns, "COMMENT_STATUS")) {
        insertColumns.push("COMMENT_STATUS");
        values.push("'Y'");
    }

    await connection.execute(
        `
            INSERT INTO FEED_COMMENT (
                ${insertColumns.join(", ")}
            ) VALUES (
                ${values.join(", ")}
            )
        `,
        binds
    );
}

async
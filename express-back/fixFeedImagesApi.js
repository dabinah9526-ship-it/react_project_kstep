const oracledb = require("oracledb");
require("dotenv").config();

const db = require("./db");

const pexelsApiKey = process.env.PEXELS_API_KEY;

function makeImageQuery(feed) {
    const area = feed.AREA || "";
    const category = feed.CATEGORY || "";
    const title = feed.TITLE || "";

    if (area.includes("전주") && category.includes("맛집")) {
        return "jeonju korean food market";
    }

    if (area.includes("서울") && category.includes("카페")) {
        return "seoul cafe street";
    }

    if (area.includes("서울") && category.includes("쇼핑")) {
        return "seoul shopping street";
    }

    if (area.includes("경주") || title.includes("경주")) {
        return "gyeongju korea traditional";
    }

    if (area.includes("부산") && category.includes("야경")) {
        return "busan night view";
    }

    if (area.includes("부산")) {
        return "busan korea travel";
    }

    if (area.includes("제주")) {
        return "jeju island korea nature";
    }

    if (area.includes("안동")) {
        return "andong hahoe village korea";
    }

    if (area.includes("강릉")) {
        return "gangneung beach korea";
    }

    if (area.includes("포항")) {
        return "pohang beach korea";
    }

    if (category.includes("맛집")) {
        return "korean food restaurant";
    }

    if (category.includes("카페")) {
        return "korea cafe";
    }

    if (category.includes("쇼핑")) {
        return "korea shopping street";
    }

    if (category.includes("관광")) {
        return "korea travel traditional";
    }

    if (category.includes("야경")) {
        return "korea city night";
    }

    if (category.includes("자연")) {
        return "korea nature landscape";
    }

    return "korea travel";
}

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
        return "https://images.pexels.com/photos/10549898/pexels-photo-10549898.jpeg";
    }

    return (
        data.photos[0].src.large2x ||
        data.photos[0].src.portrait ||
        data.photos[0].src.large ||
        data.photos[0].src.original
    );
}

async function fixImages() {
    let connection;

    try {
        await db.init();
        connection = await db.getConnection();

        const result = await connection.execute(
            `
                SELECT FEED_NO, TITLE, AREA, CATEGORY, MAIN_IMG
                FROM FEED
                WHERE MAIN_IMG IS NULL
                   OR MAIN_IMG = ''
                ORDER BY FEED_NO
            `,
            {},
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (result.rows.length === 0) {
            console.log("MAIN_IMG가 비어있는 피드가 없습니다.");
            return;
        }

        console.log("이미지 넣을 피드 개수:", result.rows.length);

        for (const feed of result.rows) {
            const query = makeImageQuery(feed);

            console.log("--------------------------------");
            console.log("FEED_NO:", feed.FEED_NO);
            console.log("TITLE:", feed.TITLE);
            console.log("검색어:", query);

            const imageUrl = await searchPexelsImage(query);

            await connection.execute(
                `
                    UPDATE FEED
                    SET MAIN_IMG = :imageUrl
                    WHERE FEED_NO = :feedNo
                `,
                {
                    imageUrl: imageUrl,
                    feedNo: feed.FEED_NO
                }
            );

            console.log("저장된 이미지:", imageUrl);
        }

        await connection.commit();

        console.log("");
        console.log("완료! FEED.MAIN_IMG에 외부 이미지 URL이 들어갔습니다.");
        console.log("");

    } catch (err) {
        console.error("이미지 업데이트 중 오류:", err);

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

fixImages();
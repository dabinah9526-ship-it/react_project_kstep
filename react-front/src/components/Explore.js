import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./Explore.css";

function Explore() {
    const navigate = useNavigate();

    const [language, setLanguage] = useState(getLang());

    const [feedList, setFeedList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    const [feedImageMap, setFeedImageMap] = useState({});
    const [imageIndexMap, setImageIndexMap] = useState({});

    useEffect(() => {
        function changeLanguage() {
            setLanguage(getLang());
        }

        window.addEventListener("kstepLanguageChange", changeLanguage);

        return () => {
            window.removeEventListener("kstepLanguageChange", changeLanguage);
        };
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert(t("loginRequired"));
            navigate("/");
            return;
        }

        getExploreFeed("");
    }, [navigate]);

    useEffect(() => {
        if (feedList.length === 0) {
            return;
        }

        getFeedImageMap(feedList);
    }, [feedList]);

    function getPageText(key) {
        const ko = {
            title: "여행 루트 탐색",
            subtitle: "다른 여행자들이 남긴 한국 여행 코스를 둘러보세요.",
            searchPlaceholder: "지역, 카테고리, 해시태그 검색",
            search: "검색",
            reset: "초기화",
            allPublicRoute: "전체 공개 루트",
            routeCount: "개의 여행 루트",
            loading: "탐색 피드를 불러오는 중입니다.",
            empty: "조건에 맞는 피드가 없습니다.",
            loadError: "탐색 피드를 불러오는 중 오류가 발생했습니다.",
            saveError: "저장 처리 중 오류가 발생했습니다.",
            profileAlt: "프로필",
            feedImageAlt: "피드 이미지",
            categoryDefault: "여행",
            likeCount: "좋아요",
            commentCount: "댓글",
            saveCount: "저장",
            countUnit: "개",
            titleEmpty: "제목 없음",
            routeEmpty: "등록된 루트 설명이 없습니다.",
            detail: "루트 자세히 보기"
        };

        const en = {
            title: "Explore Travel Routes",
            subtitle: "Browse Korea travel routes shared by other travelers.",
            searchPlaceholder: "Search area, category, or hashtag",
            search: "Search",
            reset: "Reset",
            allPublicRoute: "Public Routes",
            routeCount: " travel routes",
            loading: "Loading explore feed.",
            empty: "No feeds match your search.",
            loadError: "An error occurred while loading explore feed.",
            saveError: "An error occurred while saving.",
            profileAlt: "Profile",
            feedImageAlt: "Feed image",
            categoryDefault: "Travel",
            likeCount: "Likes",
            commentCount: "Comments",
            saveCount: "Saved",
            countUnit: "",
            titleEmpty: "Untitled",
            routeEmpty: "No route summary has been added.",
            detail: "View Route Detail"
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

    function getExploreFeed(keyword) {
        const token = localStorage.getItem("token");

        setLoading(true);

        let url = "http://localhost:3010/feed/list";

        if (keyword && keyword.trim() !== "") {
            url += "?tag=" + encodeURIComponent(keyword.trim());
        }

        fetch(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("탐색 피드 조회", data);

                if (data.result === "success") {
                    setFeedList(data.list || []);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("loadError"));
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function searchFeed() {
        getExploreFeed(searchKeyword);
    }

    function resetSearch() {
        setSearchKeyword("");
        getExploreFeed("");
    }

    function openFeedDetail(feedNo) {
        sessionStorage.setItem("selectedFeedNo", feedNo);

        navigate("/feed/detail", {
            state: {
                feedNo: feedNo
            }
        });
    }

    function moveProfile(e, userNo) {
        e.stopPropagation();

        if (!userNo) {
            return;
        }

        navigate("/profile/" + userNo);
    }

    function toggleBookmark(e, feedNo) {
        e.stopPropagation();

        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/feed/bookmark/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                feedNo: feedNo
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    setFeedList(feedList.map(feed => {
                        if (feed.FEED_NO === feedNo) {
                            let nextCount = feed.BOOKMARK_COUNT || 0;

                            if (data.bookmarkYn === "Y") {
                                nextCount = nextCount + 1;
                            } else {
                                nextCount = nextCount - 1;
                            }

                            if (nextCount < 0) {
                                nextCount = 0;
                            }

                            return {
                                ...feed,
                                BOOKMARK_YN: data.bookmarkYn,
                                BOOKMARK_COUNT: nextCount
                            };
                        }

                        return feed;
                    }));
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("saveError"));
            });
    }

    function getImageUrlByValue(value) {
        if (!value) {
            return "";
        }

        if (String(value).startsWith("http")) {
            return value;
        }

        if (String(value).startsWith("/images/")) {
            return value;
        }

        if (String(value).startsWith("/uploads/")) {
            return "http://localhost:3010" + value;
        }

        return "/images/" + value;
    }

    function getProfileImageUrl(value) {
        if (!value) {
            return "";
        }

        if (String(value).startsWith("http")) {
            return value;
        }

        if (String(value).startsWith("/uploads/")) {
            return "http://localhost:3010" + value;
        }

        if (String(value).startsWith("/images/")) {
            return value;
        }

        return "/images/" + value;
    }

    function getFeedImageMap(list) {
        const token = localStorage.getItem("token");

        const feedNoList = Array.from(new Set(
            list
                .map(feed => feed.FEED_NO)
                .filter(feedNo => feedNo !== undefined && feedNo !== null)
        ));

        Promise.all(
            feedNoList.map(feedNo => {
                return fetch("http://localhost:3010/feed/image/list", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({
                        feedNo: feedNo
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.result === "success") {
                            return {
                                feedNo: feedNo,
                                list: data.list || []
                            };
                        }

                        return {
                            feedNo: feedNo,
                            list: []
                        };
                    })
                    .catch(err => {
                        console.error("탐색 피드 이미지 목록 조회 실패", err);

                        return {
                            feedNo: feedNo,
                            list: []
                        };
                    });
            })
        ).then(resultList => {
            const nextMap = {};

            resultList.forEach(item => {
                nextMap[String(item.feedNo)] = item.list;
            });

            setFeedImageMap(prevMap => {
                return {
                    ...prevMap,
                    ...nextMap
                };
            });
        });
    }

    function getDisplayImageList(feed) {
        if (!feed) {
            return [];
        }

        const imageList = feedImageMap[String(feed.FEED_NO)] || [];

        if (imageList.length > 0) {
            return imageList;
        }

        if (feed.MAIN_IMG) {
            return [
                {
                    IMAGE_NO: 0,
                    IMAGE_URL: feed.MAIN_IMG,
                    IMAGE_ORDER: 1
                }
            ];
        }

        return [];
    }

    function getCurrentImageIndex(feed) {
        if (!feed) {
            return 0;
        }

        const displayImageList = getDisplayImageList(feed);
        let index = imageIndexMap[String(feed.FEED_NO)] || 0;

        if (index < 0 || index >= displayImageList.length) {
            index = 0;
        }

        return index;
    }

    function getSelectedImageUrl(feed) {
        const displayImageList = getDisplayImageList(feed);

        if (displayImageList.length === 0) {
            return "";
        }

        const index = getCurrentImageIndex(feed);
        const selectedImage = displayImageList[index];

        if (!selectedImage) {
            return "";
        }

        return getImageUrlByValue(selectedImage.IMAGE_URL || selectedImage.IMG_URL || selectedImage.MAIN_IMG);
    }

    function prevFeedImage(e, feed) {
        e.stopPropagation();

        const displayImageList = getDisplayImageList(feed);

        if (displayImageList.length <= 1) {
            return;
        }

        const currentIndex = getCurrentImageIndex(feed);
        let nextIndex = currentIndex - 1;

        if (nextIndex < 0) {
            nextIndex = displayImageList.length - 1;
        }

        setImageIndexMap({
            ...imageIndexMap,
            [String(feed.FEED_NO)]: nextIndex
        });
    }

    function nextFeedImage(e, feed) {
        e.stopPropagation();

        const displayImageList = getDisplayImageList(feed);

        if (displayImageList.length <= 1) {
            return;
        }

        const currentIndex = getCurrentImageIndex(feed);
        let nextIndex = currentIndex + 1;

        if (nextIndex >= displayImageList.length) {
            nextIndex = 0;
        }

        setImageIndexMap({
            ...imageIndexMap,
            [String(feed.FEED_NO)]: nextIndex
        });
    }

    function selectFeedImage(e, feed, index) {
        e.stopPropagation();

        setImageIndexMap({
            ...imageIndexMap,
            [String(feed.FEED_NO)]: index
        });
    }

    function getFirstLetter(value) {
        if (!value) {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
    }

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
    }

    function getDateText(dateValue) {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        if (language === "en") {
            return date.toLocaleDateString("en-US");
        }

        return date.toLocaleDateString("ko-KR");
    }

    function getTags(hashtags) {
        if (!hashtags) {
            return [];
        }

        return String(hashtags)
            .split(" ")
            .map(tag => tag.trim())
            .filter(tag => tag !== "");
    }

    return (
        <div className="explore-page" data-lang={language}>
            <PageDecor />

            <div className="explore-layout">
                <main className="explore-main">
                    <section className="explore-app-top">
                        <PageDecor variant="box" />

                        <div className="explore-brand-row">
                            <div className="explore-brand-mark">K</div>

                            <div>
                                <h1>{getPageText("title")}</h1>
                                <p>{getPageText("subtitle")}</p>
                            </div>
                        </div>

                        <div className="explore-top-icons">
                            <button
                                type="button"
                                onClick={() => navigate("/home")}
                                title={t("home")}
                            >
                                ⌂
                            </button>

                            <button
                                type="button"
                                className="write"
                                onClick={() => navigate("/feed/new")}
                                title={t("create")}
                            >
                                +
                            </button>
                        </div>
                    </section>

                    <section className="explore-search-line">
                        <div className="explore-search-input-wrap">
                            <span>⌕</span>

                            <input
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        searchFeed();
                                    }
                                }}
                                placeholder={getPageText("searchPlaceholder")}
                            />
                        </div>

                        <button type="button" onClick={searchFeed}>
                            {getPageText("search")}
                        </button>

                        <button type="button" className="reset" onClick={resetSearch}>
                            {getPageText("reset")}
                        </button>
                    </section>

                    <section className="explore-count-card">
                        <div>
                            <span>Explore</span>
                            <h2>{getPageText("allPublicRoute")}</h2>
                        </div>

                        <p>
                            <strong>{feedList.length}</strong>
                            {getPageText("routeCount")}
                        </p>
                    </section>

                    {loading && (
                        <div className="explore-empty-box">
                            {getPageText("loading")}
                        </div>
                    )}

                    {!loading && feedList.length === 0 && (
                        <div className="explore-empty-box">
                            {getPageText("empty")}
                        </div>
                    )}

                    {!loading && feedList.length > 0 && (
                        <section className="explore-feed-grid">
                            {feedList.map((feed) => (
                                <article
                                    className="explore-feed-card"
                                    key={feed.FEED_NO}
                                    onClick={() => openFeedDetail(feed.FEED_NO)}
                                >
                                    <div className="explore-card-head">
                                        <div
                                            className="explore-avatar"
                                            onClick={(e) => moveProfile(e, feed.USER_NO)}
                                        >
                                            {getProfileImageUrl(feed.PROFILE_IMG) !== "" ? (
                                                <img
                                                    src={getProfileImageUrl(feed.PROFILE_IMG)}
                                                    alt={safeText(feed.NICKNAME, getPageText("profileAlt"))}
                                                />
                                            ) : (
                                                <span>{getFirstLetter(feed.NICKNAME || feed.USER_ID)}</span>
                                            )}
                                        </div>

                                        <div className="explore-card-user">
                                            <strong onClick={(e) => moveProfile(e, feed.USER_NO)}>
                                                {safeText(feed.NICKNAME, "traveler")}
                                            </strong>

                                            <p>
                                                {safeText(feed.AREA, "Korea")} · {getDateText(feed.CDATE)}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className={feed.BOOKMARK_YN === "Y" ? "explore-mini-save active" : "explore-mini-save"}
                                            onClick={(e) => toggleBookmark(e, feed.FEED_NO)}
                                        >
                                            {feed.BOOKMARK_YN === "Y" ? "🔖" : "♡"}
                                        </button>
                                    </div>

                                    <div className="explore-feed-image">
                                        {getSelectedImageUrl(feed) !== "" ? (
                                            <img
                                                src={getSelectedImageUrl(feed)}
                                                alt={safeText(feed.TITLE, getPageText("feedImageAlt"))}
                                            />
                                        ) : (
                                            <div className="explore-no-image">
                                                K-STEP
                                            </div>
                                        )}

                                        {getDisplayImageList(feed).length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="explore-image-arrow explore-image-prev"
                                                    onClick={(e) => prevFeedImage(e, feed)}
                                                >
                                                    ‹
                                                </button>

                                                <button
                                                    type="button"
                                                    className="explore-image-arrow explore-image-next"
                                                    onClick={(e) => nextFeedImage(e, feed)}
                                                >
                                                    ›
                                                </button>

                                                <div className="explore-image-count">
                                                    {getCurrentImageIndex(feed) + 1} / {getDisplayImageList(feed).length}
                                                </div>

                                                <div className="explore-image-dot-row">
                                                    {getDisplayImageList(feed).map((image, index) => (
                                                        <button
                                                            type="button"
                                                            key={image.IMAGE_NO || image.IMG_NO || index}
                                                            className={getCurrentImageIndex(feed) === index ? "explore-image-dot active" : "explore-image-dot"}
                                                            onClick={(e) => selectFeedImage(e, feed, index)}
                                                        ></button>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        <div className="explore-image-chip-row">
                                            <span>{safeText(feed.CATEGORY, getPageText("categoryDefault"))}</span>
                                            <span>{safeText(feed.AREA, "Korea")}</span>
                                        </div>
                                    </div>

                                    <div className="explore-card-body">
                                        <div className="explore-count-line">
                                            <strong>{getPageText("likeCount")} {feed.LIKE_COUNT || 0}{getPageText("countUnit")}</strong>
                                            <span>{getPageText("commentCount")} {feed.COMMENT_COUNT || 0}{getPageText("countUnit")}</span>
                                            <span>{getPageText("saveCount")} {feed.BOOKMARK_COUNT || 0}{getPageText("countUnit")}</span>
                                        </div>

                                        <h2>{safeText(feed.TITLE, getPageText("titleEmpty"))}</h2>

                                        <p className="explore-caption">
                                            <strong>{safeText(feed.NICKNAME, "traveler")}</strong>
                                            {" "}
                                            {safeText(feed.ROUTE_SUMMARY || feed.CONTENT, getPageText("routeEmpty"))}
                                        </p>

                                        {getTags(feed.HASHTAGS).length > 0 && (
                                            <div className="explore-tag-row">
                                                {getTags(feed.HASHTAGS).map((tag, index) => (
                                                    <button
                                                        type="button"
                                                        key={index}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSearchKeyword(tag.replace("#", ""));
                                                            getExploreFeed(tag.replace("#", ""));
                                                        }}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="explore-detail-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openFeedDetail(feed.FEED_NO);
                                            }}
                                        >
                                            {getPageText("detail")}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}
                </main>
            </div>

            <ScrollTopButton />
        </div>
    );
}

export default Explore;
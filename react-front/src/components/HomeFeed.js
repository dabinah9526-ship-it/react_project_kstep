import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeFeed.css";

function HomeFeed() {
    const navigate = useNavigate();

    const [feedList, setFeedList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        getHomeFeed("");
    }, [navigate]);

    function getHomeFeed(tag) {
        const token = localStorage.getItem("token");

        setLoading(true);

        let url = "http://localhost:3010/feed/following/list";

        if (tag && tag.trim() !== "") {
            url += "?tag=" + encodeURIComponent(tag.trim());
        }

        fetch(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("홈 피드 조회", data);

                if (data.result === "success") {
                    setFeedList(data.list || []);
                } else {
                    alert(data.message || "홈 피드를 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("홈 피드를 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function searchFeed() {
        getHomeFeed(searchText);
    }

    function enterSearch(e) {
        if (e.key === "Enter") {
            searchFeed();
        }
    }

    function resetSearch() {
        setSearchText("");
        getHomeFeed("");
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

    function getImageUrl(feed) {
        if (!feed || !feed.MAIN_IMG) {
            return "";
        }

        if (feed.MAIN_IMG.startsWith("http")) {
            return feed.MAIN_IMG;
        }

        if (feed.MAIN_IMG.startsWith("/images/")) {
            return feed.MAIN_IMG;
        }

        if (feed.MAIN_IMG.startsWith("/uploads/")) {
            return "http://localhost:3010" + feed.MAIN_IMG;
        }

        return "/images/" + feed.MAIN_IMG;
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
        return date.toLocaleDateString("ko-KR");
    }

    return (
        <div className="home-page">
            <div className="home-bg-flower home-flower-one">✿</div>
            <div className="home-bg-flower home-flower-two">❀</div>

            <div className="home-container">
                <section className="home-top-card">
                    <div className="home-title-box">
                        <p>K-STEP</p>
                        <h1>홈 피드</h1>
                        <span>내가 팔로우한 여행자들의 새로운 루트</span>
                    </div>

                    <button
                        className="home-write-btn"
                        onClick={() => navigate("/feed/new")}
                    >
                        + 루트 작성하기
                    </button>
                </section>

                <section className="home-search-card">
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={enterSearch}
                        placeholder="지역, 카테고리, 키워드 검색"
                    />

                    <button onClick={searchFeed}>
                        검색
                    </button>

                    <button className="home-reset-btn" onClick={resetSearch}>
                        초기화
                    </button>
                </section>

                {loading && (
                    <div className="home-empty-box">
                        홈 피드를 불러오는 중입니다...
                    </div>
                )}

                {!loading && feedList.length === 0 && (
                    <div className="home-empty-box">
                        아직 홈 피드가 없습니다. 관심 있는 여행자를 팔로우해보세요.
                    </div>
                )}

                {!loading && feedList.length > 0 && (
                    <section className="home-feed-grid">
                        {feedList.map((feed) => (
                            <article
                                className="home-feed-card"
                                key={feed.FEED_NO}
                                onClick={() => openFeedDetail(feed.FEED_NO)}
                            >
                                <div className="home-feed-image-box">
                                    {getImageUrl(feed) !== "" ? (
                                        <img
                                            src={getImageUrl(feed)}
                                            alt={safeText(feed.TITLE, "피드 이미지")}
                                        />
                                    ) : (
                                        <div className="home-no-image">
                                            K-STEP
                                        </div>
                                    )}

                                    <div className="home-feed-badge-row">
                                        <span>{safeText(feed.AREA, "Korea")}</span>
                                        <span>{safeText(feed.CATEGORY, "여행")}</span>
                                    </div>
                                </div>

                                <div className="home-feed-content">
                                    <div className="home-writer-row">
                                        <div
                                            className="home-avatar"
                                            onClick={(e) => moveProfile(e, feed.USER_NO)}
                                        >
                                            {getFirstLetter(feed.NICKNAME || feed.USER_ID)}
                                        </div>

                                        <div>
                                            <strong onClick={(e) => moveProfile(e, feed.USER_NO)}>
                                                {safeText(feed.NICKNAME, "traveler")}
                                            </strong>
                                            <p>{getDateText(feed.CDATE)}</p>
                                        </div>
                                    </div>

                                    <h2>{safeText(feed.TITLE, "제목 없음")}</h2>

                                    <p className="home-route-summary">
                                        {safeText(feed.ROUTE_SUMMARY || feed.CONTENT, "등록된 루트 설명이 없습니다.")}
                                    </p>

                                    <div className="home-feed-count-row">
                                        <span>조회 {feed.VIEW_COUNT || 0}</span>
                                        <span>♡ {feed.LIKE_COUNT || 0}</span>
                                        <span>💬 {feed.COMMENT_COUNT || 0}</span>
                                        <span>🔖 {feed.BOOKMARK_COUNT || 0}</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
}

export default HomeFeed;
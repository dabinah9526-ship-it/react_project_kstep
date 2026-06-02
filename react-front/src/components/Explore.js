import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Explore.css";

function Explore() {
    const navigate = useNavigate();

    const [feedList, setFeedList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        getExploreFeed("");
    }, [navigate]);

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
                    setFeedList(data.list);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("탐색 피드를 불러오는 중 오류가 발생했습니다.");
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
                            return {
                                ...feed,
                                BOOKMARK_YN: data.bookmarkYn
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
                alert("저장 처리 중 오류가 발생했습니다.");
            });
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

    function getFirstLetter(nickname) {
        if (!nickname) {
            return "K";
        }

        return nickname.substring(0, 1).toUpperCase();
    }

    return (
        <div className="explore-page">
            <div className="soft-cloud explore-cloud-one"></div>
            <div className="soft-cloud explore-cloud-two"></div>

            <div className="traditional-motif explore-motif-left"></div>
            <div className="traditional-motif explore-motif-right"></div>

            <div className="bojagi-shape explore-bojagi-one"></div>
            <div className="bojagi-shape explore-bojagi-two"></div>

            <div className="flower-mark explore-flower-one">✿</div>
            <div className="flower-mark explore-flower-two">❀</div>

            <div className="explore-container">
                <section className="explore-header-card">
                    <div className="card-soft-glow"></div>

                    <div className="norigae">
                        <div className="norigae-string"></div>
                        <div className="norigae-knot"></div>
                        <div className="norigae-ribbon">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>

                    <div className="traditional-band">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <div className="explore-header-copy">
                        <p className="explore-page-label">탐색</p>

                        <h1>
                            전체 여행 루트<br />
                            둘러보기
                        </h1>
                    </div>

                    <div className="explore-search-card">
                        <div className="explore-search-row">
                            <input
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        searchFeed();
                                    }
                                }}
                                placeholder="지역, 키워드 검색"
                            />

                            <button onClick={searchFeed}>
                                검색
                            </button>

                            <button className="explore-reset-btn" onClick={resetSearch}>
                                초기화
                            </button>
                        </div>
                    </div>
                </section>

                <section className="explore-count-row">
                    <strong>{feedList.length}</strong>
                    <span>개의 루트</span>
                </section>

                {loading && (
                    <div className="explore-empty">
                        탐색 피드를 불러오는 중입니다...
                    </div>
                )}

                {!loading && feedList.length === 0 && (
                    <div className="explore-empty">
                        조건에 맞는 피드가 없습니다.
                    </div>
                )}

                {!loading && feedList.length > 0 && (
                    <section className="explore-grid">
                        {feedList.map((feed) => (
                            <article
                                className="explore-card"
                                key={feed.FEED_NO}
                                onClick={() => openFeedDetail(feed.FEED_NO)}
                            >
                                <div className="explore-image-box">
                                    {getImageUrl(feed) !== "" ? (
                                        <img src={getImageUrl(feed)} alt={feed.TITLE} />
                                    ) : (
                                        <div className="explore-placeholder">
                                            <span>{feed.AREA || "K-STEP"}</span>
                                        </div>
                                    )}

                                    <button
                                        className={feed.BOOKMARK_YN === "Y" ? "explore-save-btn active" : "explore-save-btn"}
                                        onClick={(e) => toggleBookmark(e, feed.FEED_NO)}
                                    >
                                        {feed.BOOKMARK_YN === "Y" ? "✓" : "+"}
                                    </button>

                                    <div className="explore-overlay">
                                        <div className="explore-user-row">
                                            <div
                                                className="explore-avatar"
                                                onClick={(e) => moveProfile(e, feed.USER_NO)}
                                            >
                                                {getFirstLetter(feed.NICKNAME)}
                                            </div>

                                            <span>{feed.NICKNAME || "traveler"}</span>
                                        </div>

                                        <h3>{feed.TITLE}</h3>

                                        <p>{feed.AREA || "Korea"} · {feed.CATEGORY || "여행"}</p>

                                        <div className="explore-card-stats">
                                            <span>저장 {feed.BOOKMARK_COUNT || 0}</span>
                                            <span>좋아요 {feed.LIKE_COUNT || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="explore-card-bottom">
                                    <strong>{feed.TITLE}</strong>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
}

export default Explore;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Explore.css";

function Explore() {
    const navigate = useNavigate();

    const [feedList, setFeedList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    const [feedImageMap, setFeedImageMap] = useState({});
    const [imageIndexMap, setImageIndexMap] = useState({});

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
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

        if (String(feed.MAIN_IMG).startsWith("http")) {
            return feed.MAIN_IMG;
        }

        if (String(feed.MAIN_IMG).startsWith("/images/")) {
            return feed.MAIN_IMG;
        }

        if (String(feed.MAIN_IMG).startsWith("/uploads/")) {
            return "http://localhost:3010" + feed.MAIN_IMG;
        }

        return "/images/" + feed.MAIN_IMG;
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

    function getFirstLetter(nickname) {
        if (!nickname) {
            return "K";
        }

        return String(nickname).substring(0, 1).toUpperCase();
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
                                    {getSelectedImageUrl(feed) !== "" ? (
                                        <img src={getSelectedImageUrl(feed)} alt={feed.TITLE} />
                                    ) : (
                                        <div className="explore-placeholder">
                                            <span>{feed.AREA || "K-STEP"}</span>
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
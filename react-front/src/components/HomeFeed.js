import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoryBar from "./StoryBar";
import "./HomeFeed.css";

function HomeFeed() {
    const navigate = useNavigate();

    const [feedList, setFeedList] = useState([]);
    const [sponsoredAdList, setSponsoredAdList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [heartFeedNo, setHeartFeedNo] = useState(null);

    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [selectedFeed, setSelectedFeed] = useState(null);
    const [commentList, setCommentList] = useState([]);
    const [commentContent, setCommentContent] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    const [recommendUserList, setRecommendUserList] = useState([]);

    const nickname = localStorage.getItem("nickname") || "여행자";

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        getHomeFeed("");
        getRecommendUserList();
        getSponsoredAdList();
    }, [navigate]);

    function getToken() {
        return localStorage.getItem("token");
    }

    function getLoginUserNo() {
        const userNo =
            localStorage.getItem("userNo") ||
            localStorage.getItem("USER_NO") ||
            localStorage.getItem("loginUserNo");

        if (userNo) {
            return userNo;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            return "";
        }

        try {
            const payload = token.split(".")[1];

            if (!payload) {
                return "";
            }

            const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
            const decoded = JSON.parse(window.atob(base64));

            return decoded.userNo || decoded.USER_NO || decoded.user_no || "";
        } catch (err) {
            console.error("토큰에서 userNo 읽기 실패", err);
            return "";
        }
    }

    function moveMyProfile() {
        const userNo = getLoginUserNo();

        if (userNo) {
            navigate("/profile/" + userNo);
            return;
        }

        navigate("/profile");
    }

    function getHomeFeed(tag) {
        const token = getToken();

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

    function getSponsoredAdList() {
        const token = getToken();

        fetch("http://localhost:3010/business/sponsor/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("스폰서 광고 목록", data);

                if (data.result === "success") {
                    setSponsoredAdList(data.list || []);
                } else {
                    console.log(data.message || "광고 목록을 불러오지 못했습니다.");
                    setSponsoredAdList([]);
                }
            })
            .catch(err => {
                console.error(err);
                setSponsoredAdList([]);
            });
    }

    function getRecommendUserList() {
        const token = getToken();

        fetch("http://localhost:3010/user/recommend/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("추천 여행자 목록", data);

                if (data.result === "success") {
                    setRecommendUserList(data.list || []);
                } else {
                    console.log(data.message || "추천 여행자 목록을 불러오지 못했습니다.");
                    setRecommendUserList([]);
                }
            })
            .catch(err => {
                console.error(err);
                setRecommendUserList([]);
            });
    }

    function updateFeedInList(feedNo, updater) {
        setFeedList(prevList =>
            prevList.map(feed => {
                if (String(feed.FEED_NO) === String(feedNo)) {
                    return updater(feed);
                }

                return feed;
            })
        );
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

    function getAdImageUrl(ad) {
        if (!ad || !ad.IMAGE_URL) {
            return "";
        }

        if (String(ad.IMAGE_URL).startsWith("http")) {
            return ad.IMAGE_URL;
        }

        if (String(ad.IMAGE_URL).startsWith("/uploads/")) {
            return "http://localhost:3010" + ad.IMAGE_URL;
        }

        if (String(ad.IMAGE_URL).startsWith("/images/")) {
            return ad.IMAGE_URL;
        }

        return "/images/" + ad.IMAGE_URL;
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

    function clickSponsoredAd(e, ad) {
        e.stopPropagation();

        if (!ad) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/business/sponsor/click", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                adNo: ad.AD_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("광고 클릭 처리", data);

                if (data.result === "success") {
                    if (data.linkUrl) {
                        window.open(data.linkUrl, "_blank");
                    } else {
                        alert("광고 상세 페이지는 다음 단계에서 연결하면 됩니다.");
                    }
                } else {
                    alert(data.message || "광고 클릭 처리에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("광고 클릭 처리 중 오류가 발생했습니다.");
            });
    }

    function toggleLike(e, feed) {
        e.stopPropagation();

        if (!feed) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/feed/like/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                feedNo: feed.FEED_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("홈 좋아요 처리", data);

                if (data.result === "success") {
                    updateFeedInList(feed.FEED_NO, oldFeed => {
                        return {
                            ...oldFeed,
                            LIKE_YN: data.likeYn,
                            LIKE_COUNT: data.likeCount
                        };
                    });
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("좋아요 처리 중 오류가 발생했습니다.");
            });
    }

    function doubleClickLike(e, feed) {
        e.stopPropagation();

        if (!feed) {
            return;
        }

        setHeartFeedNo(feed.FEED_NO);

        setTimeout(() => {
            setHeartFeedNo(null);
        }, 750);

        if (feed.LIKE_YN === "Y") {
            return;
        }

        toggleLike(e, feed);
    }

    function toggleBookmark(e, feed) {
        e.stopPropagation();

        if (!feed) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/feed/bookmark/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                feedNo: feed.FEED_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("홈 저장 처리", data);

                if (data.result === "success") {
                    updateFeedInList(feed.FEED_NO, oldFeed => {
                        let nextCount = oldFeed.BOOKMARK_COUNT || 0;

                        if (data.bookmarkYn === "Y") {
                            nextCount = nextCount + 1;
                        } else {
                            nextCount = nextCount - 1;
                        }

                        if (nextCount < 0) {
                            nextCount = 0;
                        }

                        return {
                            ...oldFeed,
                            BOOKMARK_YN: data.bookmarkYn,
                            BOOKMARK_COUNT: nextCount
                        };
                    });
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("저장 처리 중 오류가 발생했습니다.");
            });
    }

    function openCommentModal(e, feed) {
        e.stopPropagation();

        if (!feed) {
            return;
        }

        setSelectedFeed(feed);
        setCommentContent("");
        setCommentModalOpen(true);
        getCommentList(feed.FEED_NO);
    }

    function closeCommentModal() {
        setCommentModalOpen(false);
        setSelectedFeed(null);
        setCommentList([]);
        setCommentContent("");
    }

    function getCommentList(feedNo) {
        const token = getToken();

        setCommentLoading(true);

        fetch("http://localhost:3010/feed/comment/list", {
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
                console.log("홈 댓글 목록", data);

                if (data.result === "success") {
                    setCommentList(data.list || []);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("댓글 목록을 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setCommentLoading(false);
            });
    }

    function addComment() {
        if (!selectedFeed) {
            return;
        }

        const content = commentContent.trim();

        if (content === "") {
            alert("댓글 내용을 입력해주세요.");
            return;
        }

        if (content.length > 500) {
            alert("댓글은 500자 이하로 입력해주세요.");
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/feed/comment/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                feedNo: selectedFeed.FEED_NO,
                content: content
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("홈 댓글 작성", data);

                if (data.result === "success") {
                    setCommentContent("");
                    getCommentList(selectedFeed.FEED_NO);

                    updateFeedInList(selectedFeed.FEED_NO, oldFeed => {
                        return {
                            ...oldFeed,
                            COMMENT_COUNT: data.commentCount
                        };
                    });

                    setSelectedFeed({
                        ...selectedFeed,
                        COMMENT_COUNT: data.commentCount
                    });
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("댓글 등록 중 오류가 발생했습니다.");
            });
    }

    function removeComment(commentNo) {
        if (!selectedFeed) {
            return;
        }

        if (!window.confirm("댓글을 삭제할까요?")) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/feed/comment/remove", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                commentNo: commentNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("홈 댓글 삭제", data);

                if (data.result === "success") {
                    getCommentList(selectedFeed.FEED_NO);

                    updateFeedInList(selectedFeed.FEED_NO, oldFeed => {
                        return {
                            ...oldFeed,
                            COMMENT_COUNT: data.commentCount
                        };
                    });

                    setSelectedFeed({
                        ...selectedFeed,
                        COMMENT_COUNT: data.commentCount
                    });
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("댓글 삭제 중 오류가 발생했습니다.");
            });
    }

    function enterComment(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            addComment();
        }
    }

    function makeHomeItemList() {
        const result = [];
        let adIndex = 0;

        for (let i = 0; i < feedList.length; i++) {
            result.push({
                type: "feed",
                data: feedList[i],
                key: "feed-" + feedList[i].FEED_NO
            });

            if (sponsoredAdList.length > 0 && (i + 1) % 3 === 0) {
                result.push({
                    type: "ad",
                    data: sponsoredAdList[adIndex % sponsoredAdList.length],
                    key: "ad-" + i + "-" + sponsoredAdList[adIndex % sponsoredAdList.length].AD_NO
                });

                adIndex++;
            }
        }

        return result;
    }

    function renderSponsoredPost(ad) {
        if (!ad) {
            return null;
        }

        return (
            <article
                className="home-feed-card home-ad-card"
                onClick={(e) => clickSponsoredAd(e, ad)}
            >
                <div className="home-card-head">
                    <div className="home-avatar ad">
                        {getFirstLetter(ad.BUSINESS_NAME)}
                    </div>

                    <div className="home-card-user">
                        <strong>{safeText(ad.BUSINESS_NAME, "로컬 스폰서")}</strong>
                        <p>Sponsored · {safeText(ad.AREA, "Korea")}</p>
                    </div>

                    <button
                        type="button"
                        className="home-card-menu"
                        onClick={(e) => {
                            e.stopPropagation();
                            alert("광고 메뉴는 다음 단계에서 숨기기/신고로 연결하면 됩니다.");
                        }}
                    >
                        ···
                    </button>
                </div>

                <div className="home-ad-visual">
                    {getAdImageUrl(ad) !== "" ? (
                        <img src={getAdImageUrl(ad)} alt={safeText(ad.AD_TITLE, "광고 이미지")} />
                    ) : (
                        <div className="home-ad-gradient">
                            <span>{safeText(ad.BUSINESS_TYPE, "LOCAL")}</span>
                            <strong>{safeText(ad.BUSINESS_NAME, "K-STEP AD")}</strong>
                            <p>{safeText(ad.AREA, "Korea")}</p>
                        </div>
                    )}
                </div>

                <div className="home-card-body">
                    <div className="home-action-row">
                        <div className="home-left-actions">
                            <button type="button">♡</button>
                            <button type="button">💬</button>
                            <button type="button">↗</button>
                        </div>

                        <button type="button" className="home-save-action">
                            🔖
                        </button>
                    </div>

                    <div className="home-ad-label-line">
                        <span>Sponsored</span>
                        <em>{safeText(ad.BUSINESS_TYPE, "LOCAL")}</em>
                    </div>

                    <h2>{safeText(ad.AD_TITLE, "추천 광고")}</h2>

                    <p className="home-caption">
                        <strong>{safeText(ad.BUSINESS_NAME, "로컬 스폰서")}</strong>
                        {" "}
                        {safeText(ad.AD_TEXT, "여행자에게 추천하는 로컬 장소입니다.")}
                    </p>

                    <button
                        type="button"
                        className="home-ad-cta"
                        onClick={(e) => clickSponsoredAd(e, ad)}
                    >
                        {safeText(ad.CTA_TEXT, "자세히 보기")}
                    </button>
                </div>
            </article>
        );
    }

    function renderFeedPost(feed) {
        return (
            <article
                className="home-feed-card"
                onClick={() => openFeedDetail(feed.FEED_NO)}
            >
                <div className="home-card-head">
                    <div
                        className="home-avatar"
                        onClick={(e) => moveProfile(e, feed.USER_NO)}
                    >
                        {getProfileImageUrl(feed.PROFILE_IMG) !== "" ? (
                            <img
                                src={getProfileImageUrl(feed.PROFILE_IMG)}
                                alt={safeText(feed.NICKNAME, "프로필")}
                            />
                        ) : (
                            <span>{getFirstLetter(feed.NICKNAME || feed.USER_ID)}</span>
                        )}
                    </div>

                    <div className="home-card-user">
                        <strong onClick={(e) => moveProfile(e, feed.USER_NO)}>
                            {safeText(feed.NICKNAME, "traveler")}
                        </strong>

                        <p>
                            {safeText(feed.AREA, "Korea")} · {getDateText(feed.CDATE)}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="home-card-menu"
                        onClick={(e) => {
                            e.stopPropagation();
                            alert("게시물 메뉴는 다음 단계에서 신고/공유/수정/삭제로 붙이면 됩니다.");
                        }}
                    >
                        ···
                    </button>
                </div>

                <div
                    className="home-feed-image"
                    onDoubleClick={(e) => doubleClickLike(e, feed)}
                >
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

                    {heartFeedNo === feed.FEED_NO && (
                        <div className="home-heart-burst">
                            ♥
                        </div>
                    )}

                    <div className="home-image-chip-row">
                        <span>{safeText(feed.CATEGORY, "여행")}</span>
                        <span>{safeText(feed.AREA, "Korea")}</span>
                    </div>
                </div>

                <div className="home-card-body">
                    <div className="home-action-row">
                        <div className="home-left-actions">
                            <button
                                type="button"
                                className={feed.LIKE_YN === "Y" ? "active" : ""}
                                onClick={(e) => toggleLike(e, feed)}
                            >
                                {feed.LIKE_YN === "Y" ? "♥" : "♡"}
                            </button>

                            <button
                                type="button"
                                onClick={(e) => openCommentModal(e, feed)}
                            >
                                💬
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    alert("공유 기능은 다음 단계에서 붙일 수 있습니다.");
                                }}
                            >
                                ↗
                            </button>
                        </div>

                        <button
                            type="button"
                            className={feed.BOOKMARK_YN === "Y" ? "home-save-action active" : "home-save-action"}
                            onClick={(e) => toggleBookmark(e, feed)}
                        >
                            {feed.BOOKMARK_YN === "Y" ? "🔖" : "♡"}
                        </button>
                    </div>

                    <div className="home-count-line">
                        <strong>좋아요 {feed.LIKE_COUNT || 0}개</strong>
                        <span>댓글 {feed.COMMENT_COUNT || 0}개</span>
                        <span>저장 {feed.BOOKMARK_COUNT || 0}개</span>
                    </div>

                    <h2>{safeText(feed.TITLE, "제목 없음")}</h2>

                    <p className="home-caption">
                        <strong>{safeText(feed.NICKNAME, "traveler")}</strong>
                        {" "}
                        {safeText(feed.ROUTE_SUMMARY || feed.CONTENT, "등록된 루트 설명이 없습니다.")}
                    </p>

                    {getTags(feed.HASHTAGS).length > 0 && (
                        <div className="home-tag-row">
                            {getTags(feed.HASHTAGS).map((tag, index) => (
                                <button
                                    type="button"
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchText(tag.replace("#", ""));
                                        getHomeFeed(tag.replace("#", ""));
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        className="home-open-comment-btn"
                        onClick={(e) => openCommentModal(e, feed)}
                    >
                        댓글 모두 보기
                    </button>
                </div>
            </article>
        );
    }

    const homeItemList = makeHomeItemList();

    return (
        <div className="home-page">
            <div className="home-bg-flower home-flower-one">✿</div>
            <div className="home-bg-flower home-flower-two">❀</div>

            <div className="home-layout">
                <main className="home-main">
                    <section className="home-app-top">
                        <div className="home-brand-row">
                            <div className="home-brand-mark">K</div>

                            <div>
                                <h1>여행자 홈</h1>
                                <p>루트, 스토리, 추천 콘텐츠를 한눈에 확인해요.</p>
                            </div>
                        </div>

                        <div className="home-top-icons">
                            <button
                                type="button"
                                onClick={() => navigate("/chat")}
                            >
                                💬
                            </button>

                            <button
                                type="button"
                                className="write"
                                onClick={() => navigate("/feed/new")}
                            >
                                +
                            </button>
                        </div>
                    </section>

                    <section className="home-search-line">
                        <div className="home-search-input-wrap">
                            <span>⌕</span>

                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={enterSearch}
                                placeholder="지역, 카테고리, 해시태그 검색"
                            />
                        </div>

                        <button type="button" onClick={searchFeed}>
                            검색
                        </button>

                        <button type="button" className="reset" onClick={resetSearch}>
                            초기화
                        </button>
                    </section>

                    <StoryBar />

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
                        <section className="home-feed-list">
                            {homeItemList.map(item => (
                                <div key={item.key}>
                                    {item.type === "feed" && renderFeedPost(item.data)}
                                    {item.type === "ad" && renderSponsoredPost(item.data)}
                                </div>
                            ))}
                        </section>
                    )}
                </main>

                <aside className="home-side">
                    <div
                        className="home-my-card"
                        onClick={moveMyProfile}
                    >
                        <div className="home-side-avatar">
                            {getFirstLetter(nickname)}
                        </div>

                        <div>
                            <strong>{nickname}</strong>
                            <p>K-STEP traveler</p>
                        </div>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                moveMyProfile();
                            }}
                        >
                            보기
                        </button>
                    </div>

                    {sponsoredAdList.length > 0 && (
                        <div
                            className="home-side-ad"
                            onClick={(e) => clickSponsoredAd(e, sponsoredAdList[0])}
                        >
                            <div className="home-side-ad-top">
                                <span>Sponsored</span>
                                <em>{safeText(sponsoredAdList[0].BUSINESS_TYPE, "LOCAL")}</em>
                            </div>

                            <h3>{safeText(sponsoredAdList[0].BUSINESS_NAME, "로컬 스폰서")}</h3>

                            <p>{safeText(sponsoredAdList[0].AD_TITLE, "여행자에게 추천하는 로컬 광고")}</p>

                            <button type="button">
                                {safeText(sponsoredAdList[0].CTA_TEXT, "자세히 보기")}
                            </button>
                        </div>
                    )}

                    <div className="home-side-card">
                        <div className="home-side-title">
                            <strong>추천 여행자</strong>

                            <button
                                type="button"
                                onClick={() => navigate("/search")}
                            >
                                더보기
                            </button>
                        </div>

                        {recommendUserList.length === 0 && (
                            <div className="home-recommend-empty">
                                추천할 여행자가 아직 없습니다.
                            </div>
                        )}

                        {recommendUserList.map(user => (
                            <div className="home-recommend-item" key={user.USER_NO}>
                                <div
                                    className="home-recommend-avatar"
                                    onClick={(e) => moveProfile(e, user.USER_NO)}
                                >
                                    {getFirstLetter(user.NICKNAME)}
                                </div>

                                <div>
                                    <strong onClick={(e) => moveProfile(e, user.USER_NO)}>
                                        {safeText(user.NICKNAME, "traveler")}
                                    </strong>

                                    <p>
                                        {safeText(user.INTRO || user.BIO, "소개가 없습니다.")}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => moveProfile(e, user.USER_NO)}
                                >
                                    보기
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            {commentModalOpen && selectedFeed && (
                <div className="home-comment-modal-bg" onClick={closeCommentModal}>
                    <div className="home-comment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="home-comment-image-area">
                            {getImageUrl(selectedFeed) !== "" ? (
                                <img
                                    src={getImageUrl(selectedFeed)}
                                    alt={safeText(selectedFeed.TITLE, "피드 이미지")}
                                />
                            ) : (
                                <div className="home-no-image">
                                    K-STEP
                                </div>
                            )}
                        </div>

                        <div className="home-comment-panel">
                            <div className="home-comment-head">
                                <div className="home-avatar small">
                                    <span>{getFirstLetter(selectedFeed.NICKNAME || selectedFeed.USER_ID)}</span>
                                </div>

                                <div>
                                    <strong>{safeText(selectedFeed.NICKNAME, "traveler")}</strong>
                                    <p>{safeText(selectedFeed.TITLE, "제목 없음")}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeCommentModal}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="home-comment-list">
                                {commentLoading && (
                                    <div className="home-comment-empty">
                                        댓글을 불러오는 중입니다...
                                    </div>
                                )}

                                {!commentLoading && commentList.length === 0 && (
                                    <div className="home-comment-empty">
                                        아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
                                    </div>
                                )}

                                {!commentLoading && commentList.map(comment => (
                                    <div className="home-comment-item" key={comment.COMMENT_NO}>
                                        <div
                                            className="home-comment-avatar"
                                            onClick={(e) => moveProfile(e, comment.USER_NO)}
                                        >
                                            {getFirstLetter(comment.NICKNAME || comment.USER_ID)}
                                        </div>

                                        <div className="home-comment-content">
                                            <div>
                                                <strong onClick={(e) => moveProfile(e, comment.USER_NO)}>
                                                    {safeText(comment.NICKNAME, "traveler")}
                                                </strong>

                                                <span>{comment.CDATE_TEXT || getDateText(comment.CDATE)}</span>
                                            </div>

                                            <p>{comment.CONTENT}</p>
                                        </div>

                                        {comment.MINE_YN === "Y" && (
                                            <button
                                                type="button"
                                                className="home-comment-delete-btn"
                                                onClick={() => removeComment(comment.COMMENT_NO)}
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="home-comment-input-box">
                                <textarea
                                    value={commentContent}
                                    maxLength={500}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    onKeyDown={enterComment}
                                    placeholder="댓글 달기..."
                                ></textarea>

                                <span>{commentContent.length}/500</span>

                                <button
                                    type="button"
                                    className={commentContent.trim() === "" ? "disabled" : ""}
                                    onClick={addComment}
                                >
                                    게시
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomeFeed;
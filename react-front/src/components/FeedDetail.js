import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./FeedDetail.css";

function FeedDetail() {
    const navigate = useNavigate();
    const location = useLocation();

    const [feed, setFeed] = useState(null);
    const [imageList, setImageList] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const [spotList, setSpotList] = useState([]);
    const [selectedSpotIndex, setSelectedSpotIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const [commentList, setCommentList] = useState([]);
    const [commentContent, setCommentContent] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    const feedNo = location.state?.feedNo || sessionStorage.getItem("selectedFeedNo");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        if (!feedNo) {
            alert("피드 정보가 없습니다.");
            navigate("/home");
            return;
        }

        getFeedDetail();
        getFeedImageList();
        getRouteSpotList();
        getCommentList();
    }, [feedNo, navigate]);

    function getFeedDetail() {
        const token = localStorage.getItem("token");

        setLoading(true);

        fetch("http://localhost:3010/feed/detail", {
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
                console.log("피드 상세 조회 결과", data);

                if (data.result === "success") {
                    setFeed(data.feed);

                    if (data.feed && data.feed.MAIN_IMG) {
                        setImageList([
                            {
                                IMG_NO: 0,
                                IMG_URL: data.feed.MAIN_IMG,
                                IMG_ORDER: 1
                            }
                        ]);
                        setSelectedImageIndex(0);
                    }
                } else {
                    alert(data.message);
                    navigate("/home");
                }
            })
            .catch(err => {
                console.error(err);
                alert("피드 상세 정보를 불러오는 중 오류가 발생했습니다.");
                navigate("/home");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function getFeedImageList() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/feed/image/list", {
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
                console.log("피드 이미지 목록 조회 결과", data);

                if (data.result === "success") {
                    const list = data.list || [];

                    if (list.length > 0) {
                        setImageList(list);
                        setSelectedImageIndex(0);
                    }
                } else {
                    console.log(data.message);
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    function getRouteSpotList() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/feed/route/spot/list", {
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
                console.log("여행 루트 장소 조회 결과", data);

                if (data.result === "success") {
                    const list = data.list || [];

                    setSpotList(list);

                    if (list.length > 0) {
                        setSelectedSpotIndex(0);
                    }
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("여행 루트 장소를 불러오는 중 오류가 발생했습니다.");
            });
    }

    function getCommentList() {
        const token = localStorage.getItem("token");

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
                console.log("댓글 목록 조회 결과", data);

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

    function toggleLike() {
        const token = localStorage.getItem("token");

        if (!feed) {
            return;
        }

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
                console.log("좋아요 처리 결과", data);

                if (data.result === "success") {
                    setFeed({
                        ...feed,
                        LIKE_YN: data.likeYn,
                        LIKE_COUNT: data.likeCount
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

    function addComment() {
        const token = localStorage.getItem("token");
        const content = commentContent.trim();

        if (content === "") {
            alert("댓글 내용을 입력해주세요.");
            return;
        }

        if (content.length > 500) {
            alert("댓글은 500자 이하로 입력해주세요.");
            return;
        }

        fetch("http://localhost:3010/feed/comment/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                feedNo: feedNo,
                content: content
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("댓글 작성 결과", data);

                if (data.result === "success") {
                    setCommentContent("");
                    getCommentList();

                    if (feed) {
                        setFeed({
                            ...feed,
                            COMMENT_COUNT: data.commentCount
                        });
                    }
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
        const token = localStorage.getItem("token");

        if (!window.confirm("댓글을 삭제할까요?")) {
            return;
        }

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
                console.log("댓글 삭제 결과", data);

                if (data.result === "success") {
                    getCommentList();

                    if (feed) {
                        setFeed({
                            ...feed,
                            COMMENT_COUNT: data.commentCount
                        });
                    }
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("댓글 삭제 중 오류가 발생했습니다.");
            });
    }

    function toggleBookmark() {
        const token = localStorage.getItem("token");

        if (!feed) {
            return;
        }

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
                console.log("저장 처리 결과", data);

                if (data.result === "success") {
                    let count = feed.BOOKMARK_COUNT || 0;

                    if (data.bookmarkYn === "Y") {
                        count = count + 1;
                    } else {
                        count = count - 1;
                    }

                    if (count < 0) {
                        count = 0;
                    }

                    setFeed({
                        ...feed,
                        BOOKMARK_YN: data.bookmarkYn,
                        BOOKMARK_COUNT: count
                    });
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("즐겨찾기 처리 중 오류가 발생했습니다.");
            });
    }

    function getImageUrlByValue(imgValue) {
        if (!imgValue) {
            return "";
        }

        if (String(imgValue).startsWith("http")) {
            return imgValue;
        }

        if (String(imgValue).startsWith("/uploads/")) {
            return "http://localhost:3010" + imgValue;
        }

        if (String(imgValue).startsWith("/images/")) {
            return imgValue;
        }

        return "/images/" + imgValue;
    }

    function getSelectedImageUrl() {
        if (imageList.length === 0) {
            return "";
        }

        const selectedImage = imageList[selectedImageIndex];

        if (!selectedImage) {
            return "";
        }

        return getImageUrlByValue(selectedImage.IMG_URL || selectedImage.MAIN_IMG || selectedImage.IMAGE_URL);
    }

    function prevImage() {
        if (imageList.length <= 1) {
            return;
        }

        if (selectedImageIndex === 0) {
            setSelectedImageIndex(imageList.length - 1);
        } else {
            setSelectedImageIndex(selectedImageIndex - 1);
        }
    }

    function nextImage() {
        if (imageList.length <= 1) {
            return;
        }

        if (selectedImageIndex === imageList.length - 1) {
            setSelectedImageIndex(0);
        } else {
            setSelectedImageIndex(selectedImageIndex + 1);
        }
    }

    function getTags(hashtags) {
        if (!hashtags) {
            return [];
        }

        return hashtags.split(" ").filter(tag => tag !== "");
    }

    function getRouteSteps(routeSummary) {
        if (!routeSummary) {
            return [];
        }

        return routeSummary
            .split("→")
            .map(step => step.trim())
            .filter(step => step !== "");
    }

    function getWriterName() {
        if (feed && feed.NICKNAME) {
            return feed.NICKNAME;
        }

        return "traveler";
    }

    function getFirstLetter(value) {
        if (!value) {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
    }

    function getDateText(dateValue) {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);
        return date.toLocaleDateString("ko-KR");
    }

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
    }

    function moveProfile(userNo) {
        if (!userNo) {
            return;
        }

        navigate("/profile/" + userNo);
    }

    if (loading) {
        return (
            <div className="detail-page">
                <div className="detail-loading-box">
                    피드 상세 정보를 불러오는 중입니다...
                </div>
            </div>
        );
    }

    if (!feed) {
        return (
            <div className="detail-page">
                <div className="detail-loading-box">
                    피드 정보가 없습니다.
                </div>
            </div>
        );
    }

    const selectedSpot = spotList.length > 0 ? spotList[selectedSpotIndex] : null;
    const selectedImageUrl = getSelectedImageUrl();

    return (
        <div className="detail-page">
            <div className="detail-bg-flower detail-flower-one">✿</div>
            <div className="detail-bg-flower detail-flower-two">❀</div>

            <div className="detail-container">
                <button className="detail-back-btn" onClick={() => navigate("/home")}>
                    ← 피드로 돌아가기
                </button>

                <section className="detail-hero-card">
                    <div className="detail-hero-image detail-gallery-image">
                        {selectedImageUrl !== "" ? (
                            <img src={selectedImageUrl} alt={safeText(feed.TITLE, "피드 이미지")} />
                        ) : (
                            <div className="detail-no-image">
                                이미지가 없습니다
                            </div>
                        )}

                        {imageList.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="detail-gallery-arrow detail-gallery-prev"
                                    onClick={prevImage}
                                >
                                    ‹
                                </button>

                                <button
                                    type="button"
                                    className="detail-gallery-arrow detail-gallery-next"
                                    onClick={nextImage}
                                >
                                    ›
                                </button>

                                <div className="detail-gallery-count">
                                    {selectedImageIndex + 1} / {imageList.length}
                                </div>
                            </>
                        )}

                        <div className="detail-area-badge">
                            {safeText(feed.AREA, "Korea")}
                        </div>

                        <div className="detail-category-badge">
                            {safeText(feed.CATEGORY, "여행")}
                        </div>

                        {selectedImageUrl === "" && (
                            <div className="detail-image-flower">✿</div>
                        )}

                        {imageList.length > 1 && (
                            <div className="detail-gallery-thumb-row">
                                {imageList.map((item, index) => (
                                    <button
                                        type="button"
                                        key={item.IMG_NO || index}
                                        className={selectedImageIndex === index ? "detail-gallery-thumb active" : "detail-gallery-thumb"}
                                        onClick={() => setSelectedImageIndex(index)}
                                    >
                                        <img
                                            src={getImageUrlByValue(item.IMG_URL || item.MAIN_IMG || item.IMAGE_URL)}
                                            alt={"피드 썸네일 " + (index + 1)}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="detail-hero-content">
                        <div className="detail-writer-row">
                            <div
                                className="detail-avatar"
                                onClick={() => navigate(`/profile/${feed.USER_NO}`)}
                            >
                                {getFirstLetter(getWriterName())}
                            </div>

                            <div>
                                <strong>{getWriterName()}</strong>
                                <p>{getDateText(feed.CDATE)}</p>
                            </div>
                        </div>

                        <h1>{safeText(feed.TITLE, "제목 없음")}</h1>

                        <p className="detail-route-summary">
                            {safeText(feed.ROUTE_SUMMARY, "등록된 루트 요약이 없습니다.")}
                        </p>

                        <div className="detail-tag-row">
                            {getTags(feed.HASHTAGS).map((tag, index) => (
                                <span key={index}>{tag}</span>
                            ))}
                        </div>

                        <div className="detail-count-row">
                            <span>조회 {feed.VIEW_COUNT || 0}</span>
                            <span>💬 {feed.COMMENT_COUNT || 0}</span>

                            <button
                                className={feed.LIKE_YN === "Y" ? "detail-like-btn active" : "detail-like-btn"}
                                onClick={toggleLike}
                            >
                                {feed.LIKE_YN === "Y" ? "♥ 좋아요" : "♡ 좋아요"} {feed.LIKE_COUNT || 0}
                            </button>

                            <button
                                className={feed.BOOKMARK_YN === "Y" ? "detail-bookmark-btn active" : "detail-bookmark-btn"}
                                onClick={toggleBookmark}
                            >
                                {feed.BOOKMARK_YN === "Y" ? "🔖 저장됨" : "🔖 저장"} {feed.BOOKMARK_COUNT || 0}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="detail-layout">
                    <article className="detail-content-card">
                        <div className="detail-section-title">
                            <span>✦</span>
                            <div>
                                <h2>여행 이야기</h2>
                                <p>작성자가 남긴 여행 기록이에요.</p>
                            </div>
                        </div>

                        <p className="detail-content-text">
                            {safeText(feed.CONTENT, "작성된 여행 이야기가 없습니다.")}
                        </p>
                    </article>

                    <aside className="detail-route-card sns-route-card">
                        <div className="detail-section-title">
                            <span>✦</span>
                            <div>
                                <h2>여행 루트</h2>
                                <p>장소를 눌러 위치를 가볍게 확인해보세요.</p>
                            </div>
                        </div>

                        {spotList.length > 0 ? (
                            <>
                                <div className="sns-route-line">
                                    {spotList.map((spot, index) => (
                                        <button
                                            key={spot.SPOT_NO || spot.ROUTE_NO || index}
                                            className={selectedSpotIndex === index ? "sns-route-chip active" : "sns-route-chip"}
                                            onClick={() => setSelectedSpotIndex(index)}
                                        >
                                            <span>
                                                {spot.SPOT_ORDER || spot.PLACE_ORDER || index + 1}
                                            </span>
                                            {spot.SPOT_NAME || spot.PLACE_NAME}
                                        </button>
                                    ))}
                                </div>

                                {selectedSpot && (
                                    <div className="sns-selected-spot">
                                        <div className="sns-selected-head">
                                            <div className="sns-selected-number">
                                                {selectedSpot.SPOT_ORDER || selectedSpot.PLACE_ORDER || selectedSpotIndex + 1}
                                            </div>

                                            <div>
                                                <h3>{selectedSpot.SPOT_NAME || selectedSpot.PLACE_NAME}</h3>
                                                <p>{selectedSpot.SPOT_MEMO || selectedSpot.MEMO}</p>
                                            </div>
                                        </div>

                                        <div className="sns-selected-address">
                                            <span>📍</span>
                                            <p>{selectedSpot.ADDRESS || selectedSpot.PLACE_ADDR || "주소 정보가 없습니다."}</p>
                                        </div>

                                        <div className="sns-map-preview">
                                            <iframe
                                                title={selectedSpot.SPOT_NAME || selectedSpot.PLACE_NAME || "지도"}
                                                src={`https://maps.google.com/maps?q=${selectedSpot.LAT},${selectedSpot.LNG}&z=15&output=embed`}
                                                loading="lazy"
                                            ></iframe>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="detail-route-list">
                                {getRouteSteps(feed.ROUTE_SUMMARY).length > 0 ? (
                                    getRouteSteps(feed.ROUTE_SUMMARY).map((step, index) => (
                                        <div className="detail-route-item" key={index}>
                                            <div className="detail-route-number">
                                                {index + 1}
                                            </div>

                                            <div>
                                                <strong>{step}</strong>
                                                <p>{index + 1}번째 코스</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="detail-empty-text">
                                        등록된 루트 정보가 없습니다.
                                    </p>
                                )}
                            </div>
                        )}
                    </aside>
                </section>

                <section className="detail-comment-section">
                    <div className="detail-section-title">
                        <span>✦</span>

                        <div>
                            <h2>댓글</h2>
                            <p>여행 루트에 대한 이야기를 남겨보세요.</p>
                        </div>
                    </div>

                    <div className="detail-comment-form">
                        <div className="detail-comment-textarea-wrap">
                            <textarea
                                value={commentContent}
                                maxLength={500}
                                onChange={(e) => setCommentContent(e.target.value)}
                                placeholder="댓글을 입력하세요."
                            />

                            <span>{commentContent.length}/500</span>
                        </div>

                        <button onClick={addComment}>
                            등록
                        </button>
                    </div>

                    <div className="detail-comment-list">
                        {commentLoading && (
                            <div className="detail-comment-empty">
                                댓글을 불러오는 중입니다...
                            </div>
                        )}

                        {!commentLoading && commentList.length === 0 && (
                            <div className="detail-comment-empty">
                                아직 댓글이 없습니다.
                            </div>
                        )}

                        {!commentLoading && commentList.length > 0 && (
                            <>
                                {commentList.map((comment) => (
                                    <div className="detail-comment-item" key={comment.COMMENT_NO}>
                                        <div
                                            className="detail-comment-avatar"
                                            onClick={() => moveProfile(comment.USER_NO)}
                                        >
                                            {getFirstLetter(comment.NICKNAME || comment.USER_ID)}
                                        </div>

                                        <div className="detail-comment-body">
                                            <div className="detail-comment-head">
                                                <strong onClick={() => moveProfile(comment.USER_NO)}>
                                                    {safeText(comment.NICKNAME, "traveler")}
                                                </strong>

                                                <span>
                                                    {comment.CDATE_TEXT || getDateText(comment.CDATE)}
                                                </span>
                                            </div>

                                            <p>
                                                {comment.CONTENT}
                                            </p>
                                        </div>

                                        {comment.MINE_YN === "Y" && (
                                            <button
                                                className="detail-comment-delete-btn"
                                                onClick={() => removeComment(comment.COMMENT_NO)}
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default FeedDetail;
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import "./FeedDetail.css";

function FeedDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const mapRef = useRef(null);

    const [feed, setFeed] = useState(null);
    const [imageList, setImageList] = useState([]);
    const [spotList, setSpotList] = useState([]);
    const [commentList, setCommentList] = useState([]);

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedSpotIndex, setSelectedSpotIndex] = useState(0);
    const [commentContent, setCommentContent] = useState("");

    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [mapMessage, setMapMessage] = useState("");

    useEffect(() => {
        const token = getToken();

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        const feedNo = getFeedNo();

        if (!feedNo) {
            alert("피드 번호가 없습니다.");
            navigate("/home");
            return;
        }

        getFeedDetail(feedNo);
        getFeedImageList(feedNo);
        getRouteSpotList(feedNo);
        getCommentList(feedNo);
    }, []);

    useEffect(() => {
        if (canShowKakaoMap()) {
            drawRouteMap();
        } else {
            setMapMessage("");
        }
    }, [feed, spotList, selectedSpotIndex]);

    function getToken() {
        return localStorage.getItem("token");
    }

    function getLoginUserNo() {
        return localStorage.getItem("userNo") || localStorage.getItem("USER_NO") || "";
    }

    function getFeedNo() {
        return (
            location.state?.feedNo ||
            searchParams.get("feedNo") ||
            sessionStorage.getItem("selectedFeedNo") ||
            ""
        );
    }

    function isMyFeed() {
        const loginUserNo = getLoginUserNo();

        if (!feed || !loginUserNo) {
            return false;
        }

        return String(feed.USER_NO) === String(loginUserNo);
    }

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
    }

    function getFirstLetter(value) {
        if (!value) {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
    }

    function getImageUrl(value) {
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

    function getDateText(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);

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

    function getFeedDetail(feedNo) {
        const token = getToken();

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
                console.log("피드 상세 조회", data);

                if (data.result === "success") {
                    setFeed(data.feed);
                    sessionStorage.setItem("selectedFeedNo", feedNo);
                } else if (data.result === "private") {
                    alert(data.message || "비공개 피드입니다.");
                    navigate("/home");
                } else {
                    alert(data.message || "피드를 불러오지 못했습니다.");
                    navigate("/home");
                }
            })
            .catch(err => {
                console.error(err);
                alert("피드 상세 조회 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function getFeedImageList(feedNo) {
        const token = getToken();

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
                console.log("피드 이미지 목록", data);

                if (data.result === "success") {
                    setImageList(data.list || []);
                    setSelectedImageIndex(0);
                } else {
                    setImageList([]);
                }
            })
            .catch(err => {
                console.error(err);
                setImageList([]);
            });
    }

    function getRouteSpotList(feedNo) {
        const token = getToken();

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
                console.log("여행 루트 장소 목록", data);

                if (data.result === "success") {
                    setSpotList(data.list || []);
                    setSelectedSpotIndex(0);
                } else {
                    setSpotList([]);
                    setSelectedSpotIndex(0);
                }
            })
            .catch(err => {
                console.error(err);
                setSpotList([]);
                setSelectedSpotIndex(0);
            });
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
                console.log("댓글 목록", data);

                if (data.result === "success") {
                    setCommentList(data.list || []);
                } else {
                    setCommentList([]);
                }
            })
            .catch(err => {
                console.error(err);
                setCommentList([]);
            })
            .finally(() => {
                setCommentLoading(false);
            });
    }

    function getDisplayImageList() {
        if (imageList.length > 0) {
            return imageList;
        }

        if (feed && feed.MAIN_IMG) {
            return [
                {
                    IMG_NO: 0,
                    IMG_URL: feed.MAIN_IMG,
                    IMG_ORDER: 1
                }
            ];
        }

        return [];
    }

    function getSelectedImageUrl() {
        const list = getDisplayImageList();

        if (list.length === 0) {
            return "";
        }

        let index = selectedImageIndex;

        if (index < 0 || index >= list.length) {
            index = 0;
        }

        const image = list[index];

        return getImageUrl(
            image.IMG_URL ||
            image.IMAGE_URL ||
            image.MAIN_IMG
        );
    }

    function getRouteSummarySpotList() {
        if (!feed || !feed.ROUTE_SUMMARY) {
            return [];
        }

        const naturalMemoList = [
            "중간에 천천히 둘러보기 좋은 장소예요.",
            "잠깐 쉬어가며 분위기를 느끼기 좋아요.",
            "사진 남기기 좋은 포인트로 넣어두면 좋아요.",
            "가볍게 산책하면서 들르기 좋은 곳이에요.",
            "다음 장소로 이동하기 전에 여유를 갖기 좋아요."
        ];

        return String(feed.ROUTE_SUMMARY)
            .split("→")
            .map(text => text.trim())
            .filter(text => text !== "")
            .map((name, index, list) => {
                let memo = naturalMemoList[index % naturalMemoList.length];

                if (index === 0) {
                    memo = "여행을 시작하기 좋은 첫 번째 장소예요.";
                }

                if (index === list.length - 1 && list.length > 1) {
                    memo = "코스를 마무리하며 들르기 좋은 장소예요.";
                }

                return {
                    SPOT_NO: "summary-" + index,
                    SPOT_ORDER: index + 1,
                    SPOT_NAME: name,
                    SPOT_MEMO: memo,
                    ADDRESS: "",
                    LAT: null,
                    LNG: null,
                    SUMMARY_YN: "Y"
                };
            });
    }

    function getRouteDisplayList() {
        if (spotList.length > 0) {
            return spotList;
        }

        return getRouteSummarySpotList();
    }

    function getSelectedRouteSpot() {
        const routeDisplayList = getRouteDisplayList();

        if (routeDisplayList.length === 0) {
            return null;
        }

        let index = selectedSpotIndex;

        if (index < 0 || index >= routeDisplayList.length) {
            index = 0;
        }

        return routeDisplayList[index];
    }

    function hasCoordinateSpot() {
        const routeDisplayList = getRouteDisplayList();

        for (let i = 0; i < routeDisplayList.length; i++) {
            const spot = routeDisplayList[i];

            if (
                spot.LAT !== null &&
                spot.LNG !== null &&
                spot.LAT !== undefined &&
                spot.LNG !== undefined &&
                !Number.isNaN(Number(spot.LAT)) &&
                !Number.isNaN(Number(spot.LNG))
            ) {
                return true;
            }
        }

        return false;
    }

    function canShowKakaoMap() {
        if (!hasCoordinateSpot()) {
            return false;
        }

        if (window.kakao && window.kakao.maps) {
            return true;
        }

        const kakaoKey = process.env.REACT_APP_KAKAO_MAP_KEY || "";

        return kakaoKey !== "";
    }

    function getFallbackMapUrl() {
        const selectedSpot = getSelectedRouteSpot();

        let keyword = "";

        if (selectedSpot) {
            keyword =
                safeText(selectedSpot.ADDRESS, "") + " " +
                safeText(selectedSpot.SPOT_NAME, "");
        }

        if (keyword.trim() === "" && feed) {
            keyword =
                safeText(feed.AREA, "한국") + " " +
                safeText(feed.TITLE, "여행지");
        }

        if (keyword.trim() === "") {
            keyword = "한국 여행";
        }

        return "https://maps.google.com/maps?q=" + encodeURIComponent(keyword.trim()) + "&output=embed";
    }

    function prevImage() {
        const list = getDisplayImageList();

        if (list.length <= 1) {
            return;
        }

        let nextIndex = selectedImageIndex - 1;

        if (nextIndex < 0) {
            nextIndex = list.length - 1;
        }

        setSelectedImageIndex(nextIndex);
    }

    function nextImage() {
        const list = getDisplayImageList();

        if (list.length <= 1) {
            return;
        }

        let nextIndex = selectedImageIndex + 1;

        if (nextIndex >= list.length) {
            nextIndex = 0;
        }

        setSelectedImageIndex(nextIndex);
    }

    function moveProfile(userNo) {
        if (!userNo) {
            return;
        }

        navigate("/profile/" + userNo);
    }

    function moveEditFeed() {
        if (!feed) {
            return;
        }

        sessionStorage.setItem("editFeedNo", feed.FEED_NO);

        navigate("/feed/new", {
            state: {
                mode: "edit",
                feedNo: feed.FEED_NO
            }
        });
    }

    function removeFeed() {
        if (!feed) {
            return;
        }

        if (!window.confirm("이 게시물을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.")) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/feed/remove", {
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
                console.log("피드 삭제", data);

                if (data.result === "success") {
                    alert("게시물이 삭제되었습니다.");
                    navigate("/home");
                } else {
                    alert(data.message || "게시물 삭제에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("게시물 삭제 중 오류가 발생했습니다.");
            });
    }

    function toggleLike() {
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
                console.log("상세 좋아요 처리", data);

                if (data.result === "success") {
                    setFeed({
                        ...feed,
                        LIKE_YN: data.likeYn,
                        LIKE_COUNT: data.likeCount
                    });
                } else {
                    alert(data.message || "좋아요 처리에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("좋아요 처리 중 오류가 발생했습니다.");
            });
    }

    function toggleBookmark() {
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
                console.log("상세 루트 저장 처리", data);

                if (data.result === "success") {
                    setFeed({
                        ...feed,
                        BOOKMARK_YN: data.bookmarkYn,
                        BOOKMARK_COUNT: data.bookmarkCount
                    });

                    alert(data.message);
                } else {
                    alert(data.message || "루트 저장 처리에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("루트 저장 처리 중 오류가 발생했습니다.");
            });
    }

    function addComment() {
        if (!feed) {
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
                feedNo: feed.FEED_NO,
                content: content
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("상세 댓글 작성", data);

                if (data.result === "success") {
                    setCommentContent("");
                    getCommentList(feed.FEED_NO);

                    setFeed({
                        ...feed,
                        COMMENT_COUNT: data.commentCount
                    });
                } else {
                    alert(data.message || "댓글 등록에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("댓글 등록 중 오류가 발생했습니다.");
            });
    }

    function removeComment(commentNo) {
        if (!feed) {
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
                console.log("상세 댓글 삭제", data);

                if (data.result === "success") {
                    getCommentList(feed.FEED_NO);

                    setFeed({
                        ...feed,
                        COMMENT_COUNT: data.commentCount
                    });
                } else {
                    alert(data.message || "댓글 삭제에 실패했습니다.");
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

    function shareFeed() {
        if (!feed) {
            return;
        }

        const shareUrl = window.location.origin + "/feed/detail?feedNo=" + feed.FEED_NO;
        const title = safeText(feed.TITLE, "K-STEP 여행 루트");

        if (navigator.share) {
            navigator.share({
                title: title,
                text: title + " 루트를 확인해보세요.",
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert("피드 링크가 복사되었습니다.");
            })
            .catch(err => {
                console.error(err);
                alert("링크 복사에 실패했습니다.");
            });
    }

    function drawRouteMap() {
        const routeDisplayList = getRouteDisplayList();

        const validSpotList = routeDisplayList.filter(spot => {
            return spot.LAT !== null &&
                spot.LNG !== null &&
                spot.LAT !== undefined &&
                spot.LNG !== undefined &&
                !Number.isNaN(Number(spot.LAT)) &&
                !Number.isNaN(Number(spot.LNG));
        });

        if (validSpotList.length === 0) {
            setMapMessage("");
            return;
        }

        if (!mapRef.current) {
            return;
        }

        if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
                renderKakaoMap(validSpotList);
            });
            return;
        }

        const kakaoKey = process.env.REACT_APP_KAKAO_MAP_KEY || "";

        if (!kakaoKey) {
            setMapMessage("");
            return;
        }

        const oldScript = document.getElementById("kakao-map-script");

        if (oldScript) {
            oldScript.onload = function () {
                if (window.kakao && window.kakao.maps) {
                    window.kakao.maps.load(() => {
                        renderKakaoMap(validSpotList);
                    });
                }
            };
            return;
        }

        const script = document.createElement("script");
        script.id = "kakao-map-script";
        script.async = true;
        script.src = "//dapi.kakao.com/v2/maps/sdk.js?appkey=" + kakaoKey + "&autoload=false";

        script.onload = function () {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    renderKakaoMap(validSpotList);
                });
            }
        };

        script.onerror = function () {
            setMapMessage("지도를 불러오지 못했습니다. 카카오 지도 설정을 확인해주세요.");
        };

        document.head.appendChild(script);
    }

    function renderKakaoMap(validSpotList) {
        if (!mapRef.current || !window.kakao || !window.kakao.maps) {
            return;
        }

        setMapMessage("");

        const kakao = window.kakao;

        const firstSpot = validSpotList[0];
        const center = new kakao.maps.LatLng(Number(firstSpot.LAT), Number(firstSpot.LNG));

        const map = new kakao.maps.Map(mapRef.current, {
            center: center,
            level: 6
        });

        const bounds = new kakao.maps.LatLngBounds();
        const linePath = [];

        for (let i = 0; i < validSpotList.length; i++) {
            const spot = validSpotList[i];
            const position = new kakao.maps.LatLng(Number(spot.LAT), Number(spot.LNG));

            bounds.extend(position);
            linePath.push(position);

            const marker = new kakao.maps.Marker({
                position: position,
                map: map
            });

            const overlay = new kakao.maps.CustomOverlay({
                position: position,
                yAnchor: 1.85,
                content:
                    '<div class="detail-map-label">' +
                    '<span>' + (i + 1) + '</span>' +
                    '<strong>' + safeText(spot.SPOT_NAME, "장소") + '</strong>' +
                    '</div>'
            });

            overlay.setMap(map);

            kakao.maps.event.addListener(marker, "click", function () {
                map.panTo(position);
            });
        }

        if (linePath.length >= 2) {
            const polyline = new kakao.maps.Polyline({
                path: linePath,
                strokeWeight: 4,
                strokeColor: "#df6f8e",
                strokeOpacity: 0.85,
                strokeStyle: "solid"
            });

            polyline.setMap(map);
        }

        if (validSpotList.length > 1) {
            map.setBounds(bounds);
        }
    }

    if (loading && !feed) {
        return (
            <div className="detail-page">
                <PageDecor />

                <div className="detail-layout">
                    <div className="detail-empty-box">
                        피드 상세를 불러오는 중입니다...
                    </div>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    if (!feed) {
        return (
            <div className="detail-page">
                <PageDecor />

                <div className="detail-layout">
                    <div className="detail-empty-box">
                        피드를 찾을 수 없습니다.

                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    const displayImageList = getDisplayImageList();
    const selectedImageUrl = getSelectedImageUrl();
    const routeDisplayList = getRouteDisplayList();
    const useKakaoMap = canShowKakaoMap();
    const fallbackMapUrl = getFallbackMapUrl();

    return (
        <div className="detail-page">
            <PageDecor />

            <div className="detail-layout">
                <section className="detail-app-top">
                    <PageDecor variant="box" />

                    <div className="detail-brand-row">
                        <div className="detail-brand-mark">K</div>

                        <div>
                            <h1>여행 루트 상세</h1>
                            <p>사진, 장소, 댓글까지 한 번에 확인해요.</p>
                        </div>
                    </div>

                    <div className="detail-top-actions">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            title="뒤로가기"
                            aria-label="뒤로가기"
                        >
                            ↩
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                            title="홈으로"
                            aria-label="홈으로"
                        >
                            ⌂
                        </button>

                        <button
                            type="button"
                            className="write"
                            onClick={() => navigate("/feed/new")}
                            title="작성"
                            aria-label="작성"
                        >
                            +
                        </button>
                    </div>
                </section>

                <section className="detail-post-shell">
                    <div className="detail-left">
                        <div className="detail-media-card">
                            <div className="detail-image-box">
                                {selectedImageUrl !== "" ? (
                                    <img
                                        src={selectedImageUrl}
                                        alt={safeText(feed.TITLE, "피드 이미지")}
                                    />
                                ) : (
                                    <div className="detail-no-image">
                                        K-STEP
                                    </div>
                                )}

                                {displayImageList.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            className="detail-image-arrow detail-image-prev"
                                            onClick={prevImage}
                                        >
                                            ‹
                                        </button>

                                        <button
                                            type="button"
                                            className="detail-image-arrow detail-image-next"
                                            onClick={nextImage}
                                        >
                                            ›
                                        </button>

                                        <div className="detail-image-count">
                                            {selectedImageIndex + 1} / {displayImageList.length}
                                        </div>

                                        <div className="detail-image-dot-row">
                                            {displayImageList.map((image, index) => (
                                                <button
                                                    type="button"
                                                    key={image.IMG_NO || image.IMAGE_NO || index}
                                                    className={selectedImageIndex === index ? "detail-image-dot active" : "detail-image-dot"}
                                                    onClick={() => setSelectedImageIndex(index)}
                                                ></button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="detail-owner-row">
                                <div
                                    className="detail-avatar"
                                    onClick={() => moveProfile(feed.USER_NO)}
                                >
                                    {getImageUrl(feed.PROFILE_IMG) !== "" ? (
                                        <img
                                            src={getImageUrl(feed.PROFILE_IMG)}
                                            alt={safeText(feed.NICKNAME, "프로필")}
                                        />
                                    ) : (
                                        <span>{getFirstLetter(feed.NICKNAME || feed.USER_ID)}</span>
                                    )}
                                </div>

                                <div>
                                    <strong onClick={() => moveProfile(feed.USER_NO)}>
                                        {safeText(feed.NICKNAME, "traveler")}
                                    </strong>

                                    <p>{safeText(feed.AREA, "Korea")} · {getDateText(feed.CDATE)}</p>
                                </div>
                            </div>
                        </div>

                        <section className="detail-route-card">
                            <div className="detail-section-title">
                                <div>
                                    <span>Travel Route</span>
                                    <h2>여행 루트 지도</h2>
                                </div>

                                <p>{routeDisplayList.length}개의 장소</p>
                            </div>

                            <div className="detail-map-box">
                                {useKakaoMap ? (
                                    <div ref={mapRef} className="detail-map"></div>
                                ) : (
                                    <iframe
                                        className="detail-map"
                                        src={fallbackMapUrl}
                                        title="여행 루트 지도"
                                        loading="lazy"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                    ></iframe>
                                )}

                                {mapMessage !== "" && (
                                    <div className="detail-map-message">
                                        {mapMessage}
                                    </div>
                                )}
                            </div>

                            {routeDisplayList.length === 0 ? (
                                <div className="detail-route-empty">
                                    등록된 여행 루트 장소가 없습니다.
                                </div>
                            ) : (
                                <div className="detail-spot-list">
                                    {routeDisplayList.map((spot, index) => (
                                        <div
                                            className="detail-spot-item"
                                            key={spot.SPOT_NO || index}
                                            onClick={() => setSelectedSpotIndex(index)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="detail-spot-number">
                                                {index + 1}
                                            </div>

                                            <div className="detail-spot-content">
                                                <strong>{safeText(spot.SPOT_NAME, "장소명 없음")}</strong>

                                                {spot.ADDRESS && (
                                                    <p>{spot.ADDRESS}</p>
                                                )}

                                                {spot.SPOT_MEMO && (
                                                    <span>{spot.SPOT_MEMO}</span>
                                                )}

                                                {!spot.ADDRESS && !spot.SPOT_MEMO && (
                                                    <p>코스에 포함된 장소예요.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="detail-right">
                        <div className="detail-info-panel">
                            <div className="detail-title-area">
                                <div className="detail-chip-row">
                                    <span>{safeText(feed.CATEGORY, "여행")}</span>
                                    <span>{safeText(feed.AREA, "Korea")}</span>
                                </div>

                                <h1>{safeText(feed.TITLE, "제목 없음")}</h1>

                                <p className="detail-route-summary-text">
                                    {safeText(feed.ROUTE_SUMMARY, "등록된 루트 설명이 없습니다.")}
                                </p>

                                <div className="detail-story-box">
                                    <strong>여행 이야기</strong>

                                    <p>
                                        {safeText(feed.CONTENT, "작성자가 남긴 여행 이야기가 없습니다.")}
                                    </p>
                                </div>

                                {getTags(feed.HASHTAGS).length > 0 && (
                                    <div className="detail-tag-row">
                                        {getTags(feed.HASHTAGS).map((tag, index) => (
                                            <button
                                                type="button"
                                                key={index}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="detail-action-row">
                                <button
                                    type="button"
                                    className={feed.LIKE_YN === "Y" ? "active" : ""}
                                    onClick={toggleLike}
                                >
                                    {feed.LIKE_YN === "Y" ? "♥" : "♡"}
                                    <span>{feed.LIKE_COUNT || 0}</span>
                                </button>

                                <button
                                    type="button"
                                    className={feed.BOOKMARK_YN === "Y" ? "active" : ""}
                                    onClick={toggleBookmark}
                                >
                                    {feed.BOOKMARK_YN === "Y" ? "저장됨" : "루트 저장"}
                                </button>

                                <button
                                    type="button"
                                    onClick={shareFeed}
                                >
                                    공유
                                </button>
                            </div>

                            {isMyFeed() && (
                                <div className="detail-owner-action-row">
                                    <button
                                        type="button"
                                        className="edit"
                                        onClick={moveEditFeed}
                                    >
                                        게시물 수정
                                    </button>

                                    <button
                                        type="button"
                                        className="delete"
                                        onClick={removeFeed}
                                    >
                                        게시물 삭제
                                    </button>
                                </div>
                            )}

                            <div className="detail-count-row">
                                <span>댓글 {feed.COMMENT_COUNT || 0}</span>
                                <span>저장 {feed.BOOKMARK_COUNT || 0}</span>
                                <span>조회 {feed.VIEW_COUNT || 0}</span>
                            </div>
                        </div>

                        <div className="detail-comment-panel">
                            <div className="detail-comment-head">
                                <div>
                                    <strong>댓글</strong>
                                    <p>여행자들의 반응을 바로 확인해요.</p>
                                </div>

                                <span>{commentList.length}</span>
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
                                        <br />
                                        첫 댓글을 남겨보세요.
                                    </div>
                                )}

                                {!commentLoading && commentList.map(comment => (
                                    <div className="detail-comment-item" key={comment.COMMENT_NO}>
                                        <div
                                            className="detail-comment-avatar"
                                            onClick={() => moveProfile(comment.USER_NO)}
                                        >
                                            {getImageUrl(comment.PROFILE_IMG) !== "" ? (
                                                <img
                                                    src={getImageUrl(comment.PROFILE_IMG)}
                                                    alt={safeText(comment.NICKNAME, "프로필")}
                                                />
                                            ) : (
                                                <span>{getFirstLetter(comment.NICKNAME || comment.USER_ID)}</span>
                                            )}
                                        </div>

                                        <div className="detail-comment-content">
                                            <div>
                                                <strong onClick={() => moveProfile(comment.USER_NO)}>
                                                    {safeText(comment.NICKNAME, "traveler")}
                                                </strong>

                                                <span>{safeText(comment.CDATE_TEXT, getDateText(comment.CDATE))}</span>
                                            </div>

                                            <p>{comment.CONTENT}</p>
                                        </div>

                                        {comment.MINE_YN === "Y" && (
                                            <button
                                                type="button"
                                                className="detail-comment-delete-btn"
                                                onClick={() => removeComment(comment.COMMENT_NO)}
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="detail-comment-input-box">
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
                    </aside>
                </section>
            </div>

            <ScrollTopButton />
        </div>
    );
}

export default FeedDetail;
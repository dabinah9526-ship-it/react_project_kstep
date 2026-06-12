import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./FeedDetail.css";

function FeedDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const mapRef = useRef(null);

    const [language, setLanguage] = useState(getLang());

    const [feed, setFeed] = useState(null);
    const [imageList, setImageList] = useState([]);
    const [spotList, setSpotList] = useState([]);
    const [commentList, setCommentList] = useState([]);

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedSpotIndex, setSelectedSpotIndex] = useState(0);
    const [commentContent, setCommentContent] = useState("");

    const [replyTargetCommentNo, setReplyTargetCommentNo] = useState("");
    const [replyContent, setReplyContent] = useState("");

    const [editingCommentNo, setEditingCommentNo] = useState("");
    const [editContent, setEditContent] = useState("");

    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [mapMessage, setMapMessage] = useState("");

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
        const token = getToken();

        if (!token) {
            alert(t("loginRequired"));
            navigate("/");
            return;
        }

        const feedNo = getFeedNo();

        if (!feedNo) {
            alert(language === "en" ? "Feed number is missing." : "피드 번호가 없습니다.");
            navigate("/home");
            return;
        }

        getFeedDetail(feedNo);
        getFeedImageList(feedNo);
        getRouteSpotList(feedNo);
        getCommentList(feedNo);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (canShowKakaoMap()) {
            drawRouteMap();
        } else {
            setMapMessage("");
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feed, spotList, selectedSpotIndex, language]);

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

    function getCommentText(key) {
        const ko = {
            reply: "답글",
            edit: "수정",
            save: "저장",
            cancel: "취소",
            delete: "삭제",
            replyPlaceholder: "답글을 입력해주세요.",
            editPlaceholder: "댓글을 수정해주세요.",
            replyEmpty: "답글 내용을 입력해주세요.",
            editEmpty: "수정할 내용을 입력해주세요.",
            replyFail: "답글 등록에 실패했습니다.",
            replyError: "답글 등록 중 오류가 발생했습니다.",
            editFail: "댓글 수정에 실패했습니다.",
            editError: "댓글 수정 중 오류가 발생했습니다."
        };

        const en = {
            reply: "Reply",
            edit: "Edit",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            replyPlaceholder: "Write a reply.",
            editPlaceholder: "Edit your comment.",
            replyEmpty: "Please write a reply.",
            editEmpty: "Please write your edit.",
            replyFail: "Failed to add reply.",
            replyError: "An error occurred while adding reply.",
            editFail: "Failed to edit comment.",
            editError: "An error occurred while editing comment."
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

    function isReplyComment(comment) {
        if (!comment) {
            return false;
        }

        if (
            comment.PARENT_COMMENT_NO !== null &&
            comment.PARENT_COMMENT_NO !== undefined &&
            comment.PARENT_COMMENT_NO !== ""
        ) {
            return true;
        }

        if (Number(comment.COMMENT_DEPTH) === 1) {
            return true;
        }

        return false;
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
                    alert(data.message || (language === "en" ? "This is a private feed." : "비공개 피드입니다."));
                    navigate("/home");
                } else {
                    alert(data.message || (language === "en" ? "Failed to load feed." : "피드를 불러오지 못했습니다."));
                    navigate("/home");
                }
            })
            .catch(err => {
                console.error(err);
                alert(language === "en" ? "An error occurred while loading feed detail." : "피드 상세 조회 중 오류가 발생했습니다.");
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
            t("memo1"),
            t("memo2"),
            t("memo3"),
            t("memo4"),
            t("memo5")
        ];

        return String(feed.ROUTE_SUMMARY)
            .split("→")
            .map(text => text.trim())
            .filter(text => text !== "")
            .map((name, index, list) => {
                let memo = naturalMemoList[index % naturalMemoList.length];

                if (index === 0) {
                    memo = t("firstPlaceMemo");
                }

                if (index === list.length - 1 && list.length > 1) {
                    memo = t("lastPlaceMemo");
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
                safeText(feed.AREA, "Korea") + " " +
                safeText(feed.TITLE, "travel");
        }

        if (keyword.trim() === "") {
            keyword = "Korea travel";
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

        if (!window.confirm(t("deleteFeedConfirm"))) {
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
                    alert(t("deleteFeedDone"));
                    navigate("/home");
                } else {
                    alert(data.message || (language === "en" ? "Failed to delete post." : "게시물 삭제에 실패했습니다."));
                }
            })
            .catch(err => {
                console.error(err);
                alert(language === "en" ? "An error occurred while deleting post." : "게시물 삭제 중 오류가 발생했습니다.");
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
                    alert(data.message || t("likeFailed"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(t("likeFailed"));
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
                    alert(data.message || t("bookmarkFailed"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(t("bookmarkFailed"));
            });
    }

    function addComment() {
        if (!feed) {
            return;
        }

        const content = commentContent.trim();

        if (content === "") {
            alert(language === "en" ? "Please write a comment." : "댓글 내용을 입력해주세요.");
            return;
        }

        if (content.length > 500) {
            alert(language === "en" ? "Comments can be up to 500 characters." : "댓글은 500자 이하로 입력해주세요.");
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
                    alert(data.message || t("commentFailed"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(t("commentFailed"));
            });
    }

    function startReply(comment) {
        if (!comment) {
            return;
        }

        setReplyTargetCommentNo(comment.COMMENT_NO);
        setReplyContent("");
        setEditingCommentNo("");
        setEditContent("");
    }

    function cancelReply() {
        setReplyTargetCommentNo("");
        setReplyContent("");
    }

    function addReply(commentNo) {
        if (!feed) {
            return;
        }

        const content = replyContent.trim();

        if (content === "") {
            alert(getCommentText("replyEmpty"));
            return;
        }

        if (content.length > 500) {
            alert(language === "en" ? "Comments can be up to 500 characters." : "댓글은 500자 이하로 입력해주세요.");
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
                content: content,
                parentCommentNo: commentNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("상세 답글 작성", data);

                if (data.result === "success") {
                    setReplyTargetCommentNo("");
                    setReplyContent("");
                    getCommentList(feed.FEED_NO);

                    setFeed({
                        ...feed,
                        COMMENT_COUNT: data.commentCount
                    });
                } else {
                    alert(data.message || getCommentText("replyFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getCommentText("replyError"));
            });
    }

    function startEditComment(comment) {
        if (!comment) {
            return;
        }

        setEditingCommentNo(comment.COMMENT_NO);
        setEditContent(comment.CONTENT || "");
        setReplyTargetCommentNo("");
        setReplyContent("");
    }

    function cancelEditComment() {
        setEditingCommentNo("");
        setEditContent("");
    }

    function updateComment(commentNo) {
        if (!feed) {
            return;
        }

        const content = editContent.trim();

        if (content === "") {
            alert(getCommentText("editEmpty"));
            return;
        }

        if (content.length > 500) {
            alert(language === "en" ? "Comments can be up to 500 characters." : "댓글은 500자 이하로 입력해주세요.");
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/feed/comment/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                commentNo: commentNo,
                content: content
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("상세 댓글 수정", data);

                if (data.result === "success") {
                    setEditingCommentNo("");
                    setEditContent("");
                    getCommentList(feed.FEED_NO);
                } else {
                    alert(data.message || getCommentText("editFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getCommentText("editError"));
            });
    }

    function removeComment(commentNo) {
        if (!feed) {
            return;
        }

        if (!window.confirm(t("deleteCommentConfirm"))) {
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
                    alert(data.message || (language === "en" ? "Failed to delete comment." : "댓글 삭제에 실패했습니다."));
                }
            })
            .catch(err => {
                console.error(err);
                alert(language === "en" ? "An error occurred while deleting comment." : "댓글 삭제 중 오류가 발생했습니다.");
            });
    }

    function enterComment(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            addComment();
        }
    }

    function enterReply(e, commentNo) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            addReply(commentNo);
        }
    }

    function enterEditComment(e, commentNo) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            updateComment(commentNo);
        }
    }

    function shareFeed() {
        if (!feed) {
            return;
        }

        const shareUrl = window.location.origin + "/feed/detail?feedNo=" + feed.FEED_NO;
        const title = safeText(feed.TITLE, "K-STEP Travel Route");

        if (navigator.share) {
            navigator.share({
                title: title,
                text: title,
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert(language === "en" ? "The feed link has been copied." : "피드 링크가 복사되었습니다.");
            })
            .catch(err => {
                console.error(err);
                alert(language === "en" ? "Failed to copy link." : "링크 복사에 실패했습니다.");
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
            setMapMessage(language === "en" ? "Failed to load the map." : "지도를 불러오지 못했습니다. 카카오 지도 설정을 확인해주세요.");
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
                    '<strong>' + safeText(spot.SPOT_NAME, "Place") + '</strong>' +
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
            <div className="detail-page" data-lang={language}>
                <PageDecor />

                <div className="detail-layout">
                    <div className="detail-empty-box">
                        {language === "en" ? "Loading feed detail..." : "피드 상세를 불러오는 중입니다..."}
                    </div>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    if (!feed) {
        return (
            <div className="detail-page" data-lang={language}>
                <PageDecor />

                <div className="detail-layout">
                    <div className="detail-empty-box">
                        {language === "en" ? "Feed not found." : "피드를 찾을 수 없습니다."}

                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                        >
                            {t("goHome")}
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
        <div className="detail-page" data-lang={language}>
            <PageDecor />

            <div className="detail-layout">
                <section className="detail-app-top">
                    <PageDecor variant="box" />

                    <div className="detail-brand-row">
                        <div className="detail-brand-mark">K</div>

                        <div>
                            <h1>{t("feedDetailTitle")}</h1>
                            <p>{t("feedDetailSub")}</p>
                        </div>
                    </div>

                    <div className="detail-top-actions">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            title={t("back")}
                            aria-label={t("back")}
                        >
                            ↩
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                            title={t("home")}
                            aria-label={t("home")}
                        >
                            ⌂
                        </button>

                        <button
                            type="button"
                            className="write"
                            onClick={() => navigate("/feed/new")}
                            title={t("create")}
                            aria-label={t("create")}
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
                                        alt={safeText(feed.TITLE, "feed image")}
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
                                            alt={safeText(feed.NICKNAME, "profile")}
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
                                    <h2>{t("travelRoute")}</h2>
                                </div>

                                <p>{routeDisplayList.length}{t("placeCount")}</p>
                            </div>

                            <div className="detail-map-box">
                                {useKakaoMap ? (
                                    <div ref={mapRef} className="detail-map"></div>
                                ) : (
                                    <iframe
                                        className="detail-map detail-map-frame"
                                        src={fallbackMapUrl}
                                        title={t("travelRoute")}
                                        loading="lazy"
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
                                    {t("noRouteSpot")}
                                </div>
                            ) : (
                                <div className="detail-spot-list">
                                    {routeDisplayList.map((spot, index) => (
                                        <div
                                            className="detail-spot-item detail-spot-clickable"
                                            key={spot.SPOT_NO || index}
                                            onClick={() => setSelectedSpotIndex(index)}
                                        >
                                            <div className="detail-spot-number">
                                                {index + 1}
                                            </div>

                                            <div className="detail-spot-content">
                                                <strong>{safeText(spot.SPOT_NAME, language === "en" ? "Unnamed place" : "장소명 없음")}</strong>

                                                {spot.ADDRESS && (
                                                    <p>{spot.ADDRESS}</p>
                                                )}

                                                {spot.SPOT_MEMO && (
                                                    <span>{spot.SPOT_MEMO}</span>
                                                )}

                                                {!spot.ADDRESS && !spot.SPOT_MEMO && (
                                                    <p>{t("coursePlace")}</p>
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
                                    <span>{safeText(feed.CATEGORY, "Travel")}</span>
                                    <span>{safeText(feed.AREA, "Korea")}</span>
                                </div>

                                <h1>{safeText(feed.TITLE, language === "en" ? "Untitled" : "제목 없음")}</h1>

                                <p className="detail-route-summary-text">
                                    {safeText(feed.ROUTE_SUMMARY, t("routeSummaryEmpty"))}
                                </p>

                                <div className="detail-story-box">
                                    <strong>{t("travelStory")}</strong>

                                    <p>
                                        {safeText(feed.CONTENT, t("storyEmpty"))}
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
                                    {feed.BOOKMARK_YN === "Y" ? t("saved") : t("routeSave")}
                                </button>

                                <button
                                    type="button"
                                    onClick={shareFeed}
                                >
                                    {t("share")}
                                </button>
                            </div>

                            {isMyFeed() && (
                                <div className="detail-owner-action-row">
                                    <button
                                        type="button"
                                        className="edit"
                                        onClick={moveEditFeed}
                                    >
                                        {t("editPost")}
                                    </button>

                                    <button
                                        type="button"
                                        className="delete"
                                        onClick={removeFeed}
                                    >
                                        {t("deletePost")}
                                    </button>
                                </div>
                            )}

                            <div className="detail-count-row">
                                <span>{t("comments")} {feed.COMMENT_COUNT || 0}</span>
                                <span>{t("bookmarkCount")} {feed.BOOKMARK_COUNT || 0}</span>
                                <span>{t("viewCount")} {feed.VIEW_COUNT || 0}</span>
                            </div>
                        </div>

                        <div className="detail-comment-panel">
                            <div className="detail-comment-head">
                                <div>
                                    <strong>{t("comments")}</strong>
                                    <p>{t("commentSub")}</p>
                                </div>

                                <span>{commentList.length}</span>
                            </div>

                            <div className="detail-comment-list">
                                {commentLoading && (
                                    <div className="detail-comment-empty">
                                        {language === "en" ? "Loading comments..." : "댓글을 불러오는 중입니다..."}
                                    </div>
                                )}

                                {!commentLoading && commentList.length === 0 && (
                                    <div className="detail-comment-empty">
                                        {t("noComment").split("\n").map((line, index) => (
                                            <span key={index}>
                                                {line}
                                                {index === 0 && <br />}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {!commentLoading && commentList.map(comment => (
                                    <div
                                        className={isReplyComment(comment) ? "detail-comment-item reply" : "detail-comment-item"}
                                        key={comment.COMMENT_NO}
                                    >
                                        <div
                                            className="detail-comment-avatar"
                                            onClick={() => moveProfile(comment.USER_NO)}
                                        >
                                            {getImageUrl(comment.PROFILE_IMG) !== "" ? (
                                                <img
                                                    src={getImageUrl(comment.PROFILE_IMG)}
                                                    alt={safeText(comment.NICKNAME, "profile")}
                                                />
                                            ) : (
                                                <span>{getFirstLetter(comment.NICKNAME || comment.USER_ID)}</span>
                                            )}
                                        </div>

                                        <div className="detail-comment-content">
                                            <div>
                                                {isReplyComment(comment) && (
                                                    <em className="detail-reply-mark">↳</em>
                                                )}

                                                <strong onClick={() => moveProfile(comment.USER_NO)}>
                                                    {safeText(comment.NICKNAME, "traveler")}
                                                </strong>

                                                <span>{safeText(comment.CDATE_TEXT, getDateText(comment.CDATE))}</span>
                                            </div>

                                            {String(editingCommentNo) === String(comment.COMMENT_NO) ? (
                                                <div className="detail-comment-edit-box">
                                                    <textarea
                                                        value={editContent}
                                                        maxLength={500}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        onKeyDown={(e) => enterEditComment(e, comment.COMMENT_NO)}
                                                        placeholder={getCommentText("editPlaceholder")}
                                                    ></textarea>

                                                    <div className="detail-comment-form-bottom">
                                                        <span>{editContent.length}/500</span>

                                                        <div>
                                                            <button
                                                                type="button"
                                                                className="save"
                                                                onClick={() => updateComment(comment.COMMENT_NO)}
                                                            >
                                                                {getCommentText("save")}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={cancelEditComment}
                                                            >
                                                                {getCommentText("cancel")}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p>{comment.CONTENT}</p>
                                            )}

                                            {String(replyTargetCommentNo) === String(comment.COMMENT_NO) && (
                                                <div className="detail-comment-reply-box">
                                                    <textarea
                                                        value={replyContent}
                                                        maxLength={500}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        onKeyDown={(e) => enterReply(e, comment.COMMENT_NO)}
                                                        placeholder={getCommentText("replyPlaceholder")}
                                                    ></textarea>

                                                    <div className="detail-comment-form-bottom">
                                                        <span>{replyContent.length}/500</span>

                                                        <div>
                                                            <button
                                                                type="button"
                                                                className="save"
                                                                onClick={() => addReply(comment.COMMENT_NO)}
                                                            >
                                                                {getCommentText("reply")}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={cancelReply}
                                                            >
                                                                {getCommentText("cancel")}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="detail-comment-action-column">
                                            <button
                                                type="button"
                                                className="detail-comment-mini-btn"
                                                onClick={() => startReply(comment)}
                                            >
                                                {getCommentText("reply")}
                                            </button>

                                            {comment.MINE_YN === "Y" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="detail-comment-mini-btn"
                                                        onClick={() => startEditComment(comment)}
                                                    >
                                                        {getCommentText("edit")}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="detail-comment-mini-btn danger"
                                                        onClick={() => removeComment(comment.COMMENT_NO)}
                                                    >
                                                        {getCommentText("delete")}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="detail-comment-input-box">
                                <textarea
                                    value={commentContent}
                                    maxLength={500}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    onKeyDown={enterComment}
                                    placeholder={t("commentPlaceholder")}
                                ></textarea>

                                <span>{commentContent.length}/500</span>

                                <button
                                    type="button"
                                    className={commentContent.trim() === "" ? "disabled" : ""}
                                    onClick={addComment}
                                >
                                    {t("post")}
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
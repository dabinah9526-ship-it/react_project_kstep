import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoryBar from "./StoryBar";
import "./HomeFeed.css";

function HomeFeed() {
    const navigate = useNavigate();

    const [feedList, setFeedList] = useState([]);
    const [sponsoredAdList, setSponsoredAdList] = useState([]);
    const [hiddenAdNoList, setHiddenAdNoList] = useState([]);
    const [adSlideIndex, setAdSlideIndex] = useState(0);
    const [openMenuKey, setOpenMenuKey] = useState("");
    const [savedAdNoList, setSavedAdNoList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [heartFeedNo, setHeartFeedNo] = useState(null);

    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [selectedFeed, setSelectedFeed] = useState(null);
    const [commentList, setCommentList] = useState([]);
    const [commentContent, setCommentContent] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    const [recommendUserList, setRecommendUserList] = useState([]);

    const [feedImageMap, setFeedImageMap] = useState({});
    const [imageIndexMap, setImageIndexMap] = useState({});

    const nickname = localStorage.getItem("nickname") || "여행자";

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
            return;
        }

        getHomeFeed("");
        getRecommendUserList();
        getSponsoredAdList();
        getSavedSponsoredAdList();
    }, [navigate]);

    useEffect(() => {
        if (feedList.length === 0) {
            return;
        }

        getFeedImageMap(feedList);
    }, [feedList]);

    useEffect(() => {
        const visibleAdList = getVisibleSponsoredAdList();

        if (visibleAdList.length === 0) {
            setAdSlideIndex(0);
            return;
        }

        if (adSlideIndex >= visibleAdList.length) {
            setAdSlideIndex(0);
        }
    }, [sponsoredAdList, hiddenAdNoList, adSlideIndex]);

    function getToken() {
        return localStorage.getItem("token");
    }

    function moveLoginPage(message) {
        localStorage.removeItem("token");
        localStorage.removeItem("userNo");
        localStorage.removeItem("userId");
        localStorage.removeItem("nickname");
        localStorage.removeItem("userType");

        alert(message || "로그인이 필요합니다.");
        navigate("/", { replace: true });
    }

    function isLoginRequired(data) {
        if (!data) {
            return false;
        }

        if (String(data.message || "").includes("로그인이 필요합니다")) {
            return true;
        }

        if (String(data.message || "").includes("토큰")) {
            return true;
        }

        return false;
    }

    function handleLoginRequired(data) {
        if (isLoginRequired(data)) {
            moveLoginPage(data.message || "로그인이 필요합니다.");
            return true;
        }

        return false;
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

                if (handleLoginRequired(data)) {
                    return;
                }

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

                if (handleLoginRequired(data)) {
                    return;
                }

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

    function getSavedSponsoredAdList() {
        const token = getToken();

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
            return;
        }

        fetch("http://localhost:3010/business/sponsor/save/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("저장한 광고 목록", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    const list = data.list || [];

                    setSavedAdNoList(
                        list
                            .map(item => String(item.AD_NO))
                            .filter(adNo => adNo !== "undefined" && adNo !== "null")
                    );
                } else {
                    setSavedAdNoList([]);
                }
            })
            .catch(err => {
                console.error(err);
                setSavedAdNoList([]);
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

                if (handleLoginRequired(data)) {
                    return;
                }

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
        const token = getToken();

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
                        console.error("홈 피드 이미지 목록 조회 실패", err);

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

    function getVisibleSponsoredAdList() {
        return sponsoredAdList.filter(ad => {
            return !hiddenAdNoList.includes(String(ad.AD_NO));
        });
    }

    function getCurrentSideAd() {
        const visibleAdList = getVisibleSponsoredAdList();

        if (visibleAdList.length === 0) {
            return null;
        }

        let index = adSlideIndex;

        if (index < 0 || index >= visibleAdList.length) {
            index = 0;
        }

        return visibleAdList[index];
    }

    function prevSponsoredAd(e) {
        e.stopPropagation();

        const visibleAdList = getVisibleSponsoredAdList();

        if (visibleAdList.length <= 1) {
            return;
        }

        setAdSlideIndex(prevIndex => {
            if (prevIndex <= 0) {
                return visibleAdList.length - 1;
            }

            return prevIndex - 1;
        });
    }

    function nextSponsoredAd(e) {
        e.stopPropagation();

        const visibleAdList = getVisibleSponsoredAdList();

        if (visibleAdList.length <= 1) {
            return;
        }

        setAdSlideIndex(prevIndex => {
            if (prevIndex >= visibleAdList.length - 1) {
                return 0;
            }

            return prevIndex + 1;
        });
    }

    function clickSponsoredAd(e, ad) {
        e.stopPropagation();

        if (!ad) {
            return;
        }

        if (!ad.AD_NO) {
            alert("광고 번호가 없습니다.");
            return;
        }

        sessionStorage.setItem("selectedAd", JSON.stringify(ad));

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
            })
            .catch(err => {
                console.error(err);
            });

        navigate("/ad/detail/" + ad.AD_NO);
    }

    function hideSponsoredAd(e, ad) {
        e.stopPropagation();

        if (!ad || !ad.AD_NO) {
            return;
        }

        setHiddenAdNoList(prevList => {
            if (prevList.includes(String(ad.AD_NO))) {
                return prevList;
            }

            return [...prevList, String(ad.AD_NO)];
        });

        setOpenMenuKey("");
    }

    function togglePostMenu(e, key) {
        e.stopPropagation();

        if (openMenuKey === key) {
            setOpenMenuKey("");
            return;
        }

        setOpenMenuKey(key);
    }

    function isMyFeed(feed) {
        if (!feed) {
            return false;
        }

        if (feed.MINE_YN === "Y") {
            return true;
        }

        return String(feed.USER_NO) === String(getLoginUserNo());
    }

    function editFeed(e, feed) {
        e.stopPropagation();
        setOpenMenuKey("");

        if (!feed || !feed.FEED_NO) {
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

    function removeFeed(e, feed) {
        e.stopPropagation();
        setOpenMenuKey("");

        if (!feed || !feed.FEED_NO) {
            return;
        }

        if (!window.confirm("게시물을 삭제할까요?")) {
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
                console.log("홈 피드 삭제", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setFeedList(prevList =>
                        prevList.filter(item => String(item.FEED_NO) !== String(feed.FEED_NO))
                    );
                    alert("게시물이 삭제되었습니다.");
                } else {
                    alert(data.message || "게시물 삭제에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("게시물 삭제 중 오류가 발생했습니다.");
            });
    }

    function reportFeed(e, feed) {
        e.stopPropagation();
        setOpenMenuKey("");

        if (!feed) {
            return;
        }

        alert("신고가 접수되었습니다.");
    }

    function reportAd(e, ad) {
        e.stopPropagation();
        setOpenMenuKey("");

        if (!ad) {
            return;
        }

        alert("광고 신고가 접수되었습니다.");
    }

    function copyText(text, successMessage) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert(successMessage);
                })
                .catch(err => {
                    console.error(err);
                    alert("링크 복사에 실패했습니다.");
                });

            return;
        }

        alert(text);
    }

    function shareFeed(e, feed) {
        e.stopPropagation();

        if (!feed || !feed.FEED_NO) {
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

        copyText(shareUrl, "피드 링크가 복사되었습니다.");
    }

    function shareAd(e, ad) {
        e.stopPropagation();

        if (!ad || !ad.AD_NO) {
            return;
        }

        const shareUrl = window.location.origin + "/ad/detail/" + ad.AD_NO;
        const title = safeText(ad.BUSINESS_NAME, "K-STEP 로컬 스폰서");

        if (navigator.share) {
            navigator.share({
                title: title,
                text: title + " 정보를 확인해보세요.",
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        copyText(shareUrl, "가게 링크가 복사되었습니다.");
    }

    function toggleSponsoredAdSave(e, ad) {
        e.stopPropagation();

        if (!ad || !ad.AD_NO) {
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
            return;
        }

        fetch("http://localhost:3010/business/sponsor/save/toggle", {
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
                console.log("홈 광고 저장 처리", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setSavedAdNoList(prevList => {
                        const adNoText = String(ad.AD_NO);

                        if (data.saveYn === "Y" || data.savedYn === "Y" || data.SAVE_YN === "Y") {
                            if (prevList.includes(adNoText)) {
                                return prevList;
                            }

                            return [...prevList, adNoText];
                        }

                        return prevList.filter(item => item !== adNoText);
                    });

                    alert(data.message || "가게 저장 처리가 완료되었습니다.");
                } else {
                    alert(data.message || "가게 저장 처리에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("가게 저장 처리 중 오류가 발생했습니다.");
            });
    }

    function isAdSaved(ad) {
        if (!ad || !ad.AD_NO) {
            return false;
        }

        if (ad.SAVE_YN === "Y" || ad.SAVED_YN === "Y") {
            return true;
        }

        return savedAdNoList.includes(String(ad.AD_NO));
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
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

                if (handleLoginRequired(data)) {
                    return;
                }

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

                if (handleLoginRequired(data)) {
                    return;
                }

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

                if (handleLoginRequired(data)) {
                    return;
                }

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

                if (handleLoginRequired(data)) {
                    return;
                }

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

                if (handleLoginRequired(data)) {
                    return;
                }

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
        const visibleAdList = getVisibleSponsoredAdList();

        for (let i = 0; i < feedList.length; i++) {
            result.push({
                type: "feed",
                data: feedList[i],
                key: "feed-" + feedList[i].FEED_NO
            });

            if (visibleAdList.length > 0 && (i + 1) % 3 === 0) {
                result.push({
                    type: "ad",
                    data: visibleAdList[adIndex % visibleAdList.length],
                    key: "ad-" + i + "-" + visibleAdList[adIndex % visibleAdList.length].AD_NO
                });

                adIndex++;
            }
        }

        return result;
    }

    function renderAdMenu(ad) {
        if (!ad) {
            return null;
        }

        return (
            <div className="home-card-menu-wrap">
                <button
                    type="button"
                    className="home-card-menu"
                    onClick={(e) => togglePostMenu(e, "ad-" + ad.AD_NO)}
                >
                    ···
                </button>

                {openMenuKey === "ad-" + ad.AD_NO && (
                    <div className="home-card-menu-list">
                        <button
                            type="button"
                            onClick={(e) => clickSponsoredAd(e, ad)}
                        >
                            가게보기
                        </button>

                        <button
                            type="button"
                            onClick={(e) => hideSponsoredAd(e, ad)}
                        >
                            관심없음
                        </button>

                        <button
                            type="button"
                            onClick={(e) => reportAd(e, ad)}
                        >
                            신고
                        </button>
                    </div>
                )}
            </div>
        );
    }

    function renderFeedMenu(feed) {
        if (!feed) {
            return null;
        }

        const menuKey = "feed-" + feed.FEED_NO;
        const mineYn = isMyFeed(feed);

        return (
            <div className="home-card-menu-wrap">
                <button
                    type="button"
                    className="home-card-menu"
                    onClick={(e) => togglePostMenu(e, menuKey)}
                >
                    ···
                </button>

                {openMenuKey === menuKey && (
                    <div className="home-card-menu-list">
                        {mineYn ? (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => editFeed(e, feed)}
                                >
                                    수정
                                </button>

                                <button
                                    type="button"
                                    className="danger"
                                    onClick={(e) => removeFeed(e, feed)}
                                >
                                    삭제
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => reportFeed(e, feed)}
                            >
                                신고
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
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

                    {renderAdMenu(ad)}
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

                    <div className="home-sponsored-badge">Sponsored</div>
                </div>

                <div className="home-card-body">
                    <div className="home-action-row">
                        <div className="home-left-actions">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clickSponsoredAd(e, ad);
                                }}
                            >
                                ♡
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clickSponsoredAd(e, ad);
                                }}
                            >
                                💬
                            </button>

                            <button
                                type="button"
                                onClick={(e) => shareAd(e, ad)}
                            >
                                ↗
                            </button>
                        </div>

                        <button
                            type="button"
                            className={isAdSaved(ad) ? "home-save-action active" : "home-save-action"}
                            onClick={(e) => toggleSponsoredAdSave(e, ad)}
                        >
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
                        가게보기
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

                    {renderFeedMenu(feed)}
                </div>

                <div
                    className="home-feed-image"
                    onDoubleClick={(e) => doubleClickLike(e, feed)}
                >
                    {getSelectedImageUrl(feed) !== "" ? (
                        <img
                            src={getSelectedImageUrl(feed)}
                            alt={safeText(feed.TITLE, "피드 이미지")}
                        />
                    ) : (
                        <div className="home-no-image">
                            K-STEP
                        </div>
                    )}

                    {getDisplayImageList(feed).length > 1 && (
                        <>
                            <button
                                type="button"
                                className="home-image-arrow home-image-prev"
                                onClick={(e) => prevFeedImage(e, feed)}
                            >
                                ‹
                            </button>

                            <button
                                type="button"
                                className="home-image-arrow home-image-next"
                                onClick={(e) => nextFeedImage(e, feed)}
                            >
                                ›
                            </button>

                            <div className="home-image-count">
                                {getCurrentImageIndex(feed) + 1} / {getDisplayImageList(feed).length}
                            </div>

                            <div className="home-image-dot-row">
                                {getDisplayImageList(feed).map((image, index) => (
                                    <button
                                        type="button"
                                        key={image.IMAGE_NO || image.IMG_NO || index}
                                        className={getCurrentImageIndex(feed) === index ? "home-image-dot active" : "home-image-dot"}
                                        onClick={(e) => selectFeedImage(e, feed, index)}
                                    ></button>
                                ))}
                            </div>
                        </>
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
                                onClick={(e) => shareFeed(e, feed)}
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

    function renderAdCarousel() {
        const visibleAdList = getVisibleSponsoredAdList();

        if (visibleAdList.length === 0) {
            return null;
        }

        return (
            <section className="home-ad-carousel-section">
                <div className="home-ad-carousel-head">
                    <div>
                        <span>Sponsored</span>
                        <h2>추천 로컬 스폰서</h2>
                    </div>

                    <p>{visibleAdList.length}개의 추천 광고</p>
                </div>

                <div className="home-ad-carousel-list">
                    {visibleAdList.map(ad => (
                        <article
                            className="home-ad-carousel-card"
                            key={ad.AD_NO}
                            onClick={(e) => clickSponsoredAd(e, ad)}
                        >
                            <div className="home-ad-carousel-image">
                                {getAdImageUrl(ad) !== "" ? (
                                    <img
                                        src={getAdImageUrl(ad)}
                                        alt={safeText(ad.AD_TITLE, "광고 이미지")}
                                    />
                                ) : (
                                    <div className="home-ad-carousel-gradient">
                                        <strong>{getFirstLetter(ad.BUSINESS_NAME)}</strong>
                                    </div>
                                )}

                                <span>AD</span>
                            </div>

                            <div className="home-ad-carousel-info">
                                <strong>{safeText(ad.BUSINESS_NAME, "로컬 스폰서")}</strong>
                                <p>{safeText(ad.AD_TITLE, "여행자에게 추천하는 장소")}</p>

                                <button
                                    type="button"
                                    onClick={(e) => clickSponsoredAd(e, ad)}
                                >
                                    가게보기
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        );
    }

    const homeItemList = makeHomeItemList();
    const visibleSponsoredAdList = getVisibleSponsoredAdList();
    const currentSideAd = getCurrentSideAd();

    return (
        <div
            className="home-page"
            onClick={() => {
                if (openMenuKey !== "") {
                    setOpenMenuKey("");
                }
            }}
        >
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

                    {renderAdCarousel()}

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

                    {currentSideAd && (
                        <div
                            className="home-side-ad"
                            onClick={(e) => clickSponsoredAd(e, currentSideAd)}
                        >
                            <div className="home-side-ad-top">
                                <span>Sponsored</span>
                                <em>
                                    {adSlideIndex + 1}/{visibleSponsoredAdList.length}
                                </em>
                            </div>

                            <h3>{safeText(currentSideAd.BUSINESS_NAME, "로컬 스폰서")}</h3>

                            <p>{safeText(currentSideAd.AD_TITLE, "여행자에게 추천하는 로컬 광고")}</p>

                            <div className="home-side-ad-actions">
                                <button
                                    type="button"
                                    onClick={(e) => clickSponsoredAd(e, currentSideAd)}
                                >
                                    가게보기
                                </button>

                                {visibleSponsoredAdList.length > 1 && (
                                    <div className="home-side-ad-arrows">
                                        <button
                                            type="button"
                                            onClick={prevSponsoredAd}
                                        >
                                            ‹
                                        </button>

                                        <button
                                            type="button"
                                            onClick={nextSponsoredAd}
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="home-side-card">
                        <div className="home-side-title">
                            <strong>추천 여행자</strong>

                            <button
                                type="button"
                                onClick={() => navigate("/explore")}
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

            <button
                type="button"
                className="home-scroll-top-btn"
                onClick={scrollToTop}
            >
                ↑
            </button>

            {commentModalOpen && selectedFeed && (
                <div className="home-comment-modal-bg" onClick={closeCommentModal}>
                    <div className="home-comment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="home-comment-image-area">
                            {getSelectedImageUrl(selectedFeed) !== "" ? (
                                <img
                                    src={getSelectedImageUrl(selectedFeed)}
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
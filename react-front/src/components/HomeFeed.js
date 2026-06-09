import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoryBar from "./StoryBar";
import PageDecor from "./PageDecor";
import "./HomeFeed.css";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";

function HomeFeed() {
    const navigate = useNavigate();

    const [language, setLanguage] = useState(getLang());

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
    const [myProfile, setMyProfile] = useState(null);

    const [feedImageMap, setFeedImageMap] = useState({});
    const [imageIndexMap, setImageIndexMap] = useState({});

    const nickname = localStorage.getItem("nickname") || getPageText("defaultTraveler");

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
            moveLoginPage(t("loginRequired"));
            return;
        }

        getMyProfile();
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

    function getPageText(key) {
        const ko = {
            defaultTraveler: "여행자",
            homeTitle: "여행자 홈",
            homeSub: "루트, 스토리, 추천 콘텐츠를 한눈에 확인해요.",
            searchPlaceholder: "지역, 카테고리, 해시태그 검색",
            search: "검색",
            reset: "초기화",
            loadingFeed: "홈 피드를 불러오는 중입니다...",
            emptyFeed: "아직 홈 피드가 없습니다. 관심 있는 여행자를 팔로우해보세요.",
            localSponsor: "로컬 스폰서",
            adImage: "광고 이미지",
            adTitleDefault: "추천 광고",
            adTextDefault: "여행자에게 추천하는 로컬 장소입니다.",
            storeView: "가게보기",
            notInterested: "관심없음",
            report: "신고",
            edit: "수정",
            delete: "삭제",
            deletePostConfirm: "게시물을 삭제할까요?",
            deletePostDone: "게시물이 삭제되었습니다.",
            deletePostFail: "게시물 삭제에 실패했습니다.",
            deletePostError: "게시물 삭제 중 오류가 발생했습니다.",
            reportFeedDone: "신고가 접수되었습니다.",
            reportAdDone: "광고 신고가 접수되었습니다.",
            copyFail: "링크 복사에 실패했습니다.",
            feedLinkCopied: "피드 링크가 복사되었습니다.",
            storeLinkCopied: "가게 링크가 복사되었습니다.",
            feedShareText: " 루트를 확인해보세요.",
            adShareText: " 정보를 확인해보세요.",
            saveStoreDone: "가게 저장 처리가 완료되었습니다.",
            saveStoreFail: "가게 저장 처리에 실패했습니다.",
            saveStoreError: "가게 저장 처리 중 오류가 발생했습니다.",
            likeError: "좋아요 처리 중 오류가 발생했습니다.",
            saveError: "저장 처리 중 오류가 발생했습니다.",
            commentListError: "댓글 목록을 불러오는 중 오류가 발생했습니다.",
            commentWriteEmpty: "댓글 내용을 입력해주세요.",
            commentLimit: "댓글은 500자 이하로 입력해주세요.",
            commentWriteError: "댓글 등록 중 오류가 발생했습니다.",
            commentDeleteConfirm: "댓글을 삭제할까요?",
            commentDeleteError: "댓글 삭제 중 오류가 발생했습니다.",
            feedImageAlt: "피드 이미지",
            profileAlt: "프로필",
            categoryDefault: "여행",
            likeCount: "좋아요",
            commentCount: "댓글",
            saveCount: "저장",
            countUnit: "개",
            titleEmpty: "제목 없음",
            routeEmpty: "등록된 루트 설명이 없습니다.",
            viewAllComments: "댓글 모두 보기",
            sponsoredTitle: "추천 로컬 스폰서",
            sponsoredCountSuffix: "개의 추천 광고",
            localAdDefault: "여행자에게 추천하는 로컬 광고",
            view: "보기",
            recommendUser: "추천 여행자",
            seeMore: "더보기",
            noRecommendUser: "추천할 여행자가 아직 없습니다.",
            noIntro: "소개가 없습니다.",
            commentLoading: "댓글을 불러오는 중입니다...",
            noComment: "아직 댓글이 없습니다. 첫 댓글을 남겨보세요.",
            commentPlaceholder: "댓글 달기...",
            post: "게시",
            processing: "처리중..."
        };

        const en = {
            defaultTraveler: "traveler",
            homeTitle: "Traveler Home",
            homeSub: "Discover routes, stories, and recommended content in one place.",
            searchPlaceholder: "Search area, category, or hashtag",
            search: "Search",
            reset: "Reset",
            loadingFeed: "Loading your home feed...",
            emptyFeed: "No home feed yet. Try following travelers you are interested in.",
            localSponsor: "Local Sponsor",
            adImage: "Sponsor image",
            adTitleDefault: "Recommended sponsor",
            adTextDefault: "A local spot recommended for travelers.",
            storeView: "View Store",
            notInterested: "Not interested",
            report: "Report",
            edit: "Edit",
            delete: "Delete",
            deletePostConfirm: "Delete this post?",
            deletePostDone: "The post has been deleted.",
            deletePostFail: "Failed to delete post.",
            deletePostError: "An error occurred while deleting post.",
            reportFeedDone: "Your report has been submitted.",
            reportAdDone: "Your ad report has been submitted.",
            copyFail: "Failed to copy link.",
            feedLinkCopied: "Feed link has been copied.",
            storeLinkCopied: "Store link has been copied.",
            feedShareText: "Check out this travel route.",
            adShareText: "Check out this store information.",
            saveStoreDone: "Store save status has been updated.",
            saveStoreFail: "Failed to save store.",
            saveStoreError: "An error occurred while saving store.",
            likeError: "An error occurred while processing like.",
            saveError: "An error occurred while saving.",
            commentListError: "An error occurred while loading comments.",
            commentWriteEmpty: "Please write a comment.",
            commentLimit: "Comments can be up to 500 characters.",
            commentWriteError: "An error occurred while posting comment.",
            commentDeleteConfirm: "Delete this comment?",
            commentDeleteError: "An error occurred while deleting comment.",
            feedImageAlt: "Feed image",
            profileAlt: "Profile",
            categoryDefault: "Travel",
            likeCount: "Likes",
            commentCount: "Comments",
            saveCount: "Saved",
            countUnit: "",
            titleEmpty: "Untitled",
            routeEmpty: "No route summary has been added.",
            viewAllComments: "View all comments",
            sponsoredTitle: "Recommended Local Sponsors",
            sponsoredCountSuffix: " recommended ads",
            localAdDefault: "A local sponsor recommended for travelers.",
            view: "View",
            recommendUser: "Recommended Travelers",
            seeMore: "See more",
            noRecommendUser: "No recommended travelers yet.",
            noIntro: "No introduction yet.",
            commentLoading: "Loading comments...",
            noComment: "No comments yet. Be the first to leave one.",
            commentPlaceholder: "Write a comment...",
            post: "Post",
            processing: "Processing..."
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

    function getToken() {
        return localStorage.getItem("token");
    }

    function moveLoginPage(message) {
        localStorage.removeItem("token");
        localStorage.removeItem("userNo");
        localStorage.removeItem("userId");
        localStorage.removeItem("nickname");
        localStorage.removeItem("userType");

        alert(message || t("loginRequired"));
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
            moveLoginPage(data.message || t("loginRequired"));
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

    function getMyProfile() {
        const token = getToken();
        const userNo = getLoginUserNo();

        if (!token || !userNo) {
            return;
        }

        fetch("http://localhost:3010/user/profile/" + userNo, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("홈 내 프로필 조회", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    const profile =
                        data.info ||
                        data.user ||
                        data.profile ||
                        data.member ||
                        data.data ||
                        data.myInfo ||
                        null;

                    setMyProfile(profile);
                }
            })
            .catch(err => {
                console.error("홈 내 프로필 조회 실패", err);
            });
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
                    alert(data.message || (language === "en" ? "Failed to load home feed." : "홈 피드를 불러오지 못했습니다."));
                }
            })
            .catch(err => {
                console.error(err);
                alert(language === "en" ? "An error occurred while loading home feed." : "홈 피드를 불러오는 중 오류가 발생했습니다.");
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
            moveLoginPage(t("loginRequired"));
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

    function getProfileImageValue(user) {
        if (!user) {
            return "";
        }

        return (
            user.PROFILE_IMG ||
            user.profileImg ||
            user.PROFILE_IMAGE ||
            user.profileImage ||
            user.USER_PROFILE_IMG ||
            user.userProfileImg ||
            ""
        );
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
            alert(language === "en" ? "Sponsor number is missing." : "광고 번호가 없습니다.");
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

        if (!window.confirm(getPageText("deletePostConfirm"))) {
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
                    alert(getPageText("deletePostDone"));
                } else {
                    alert(data.message || getPageText("deletePostFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("deletePostError"));
            });
    }

    function reportFeed(e, feed) {
        e.stopPropagation();
        setOpenMenuKey("");

        if (!feed) {
            return;
        }

        alert(getPageText("reportFeedDone"));
    }

    function reportAd(e, ad) {
        e.stopPropagation();
        setOpenMenuKey("");

        if (!ad) {
            return;
        }

        alert(getPageText("reportAdDone"));
    }

    function copyText(text, successMessage) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert(successMessage);
                })
                .catch(err => {
                    console.error(err);
                    alert(getPageText("copyFail"));
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
        const title = safeText(feed.TITLE, "K-STEP Travel Route");

        if (navigator.share) {
            navigator.share({
                title: title,
                text: language === "en" ? getPageText("feedShareText") : title + getPageText("feedShareText"),
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        copyText(shareUrl, getPageText("feedLinkCopied"));
    }

    function shareAd(e, ad) {
        e.stopPropagation();

        if (!ad || !ad.AD_NO) {
            return;
        }

        const shareUrl = window.location.origin + "/ad/detail/" + ad.AD_NO;
        const title = safeText(ad.BUSINESS_NAME, "K-STEP Local Sponsor");

        if (navigator.share) {
            navigator.share({
                title: title,
                text: language === "en" ? getPageText("adShareText") : title + getPageText("adShareText"),
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        copyText(shareUrl, getPageText("storeLinkCopied"));
    }

    function toggleSponsoredAdSave(e, ad) {
        e.stopPropagation();

        if (!ad || !ad.AD_NO) {
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage(t("loginRequired"));
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

                    alert(data.message || getPageText("saveStoreDone"));
                } else {
                    alert(data.message || getPageText("saveStoreFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("saveStoreError"));
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
                alert(getPageText("likeError"));
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
                alert(getPageText("saveError"));
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
                alert(getPageText("commentListError"));
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
            alert(getPageText("commentWriteEmpty"));
            return;
        }

        if (content.length > 500) {
            alert(getPageText("commentLimit"));
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
                alert(getPageText("commentWriteError"));
            });
    }

    function removeComment(commentNo) {
        if (!selectedFeed) {
            return;
        }

        if (!window.confirm(getPageText("commentDeleteConfirm"))) {
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
                alert(getPageText("commentDeleteError"));
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
                            {getPageText("storeView")}
                        </button>

                        <button
                            type="button"
                            onClick={(e) => hideSponsoredAd(e, ad)}
                        >
                            {getPageText("notInterested")}
                        </button>

                        <button
                            type="button"
                            onClick={(e) => reportAd(e, ad)}
                        >
                            {getPageText("report")}
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
                                    {getPageText("edit")}
                                </button>

                                <button
                                    type="button"
                                    className="danger"
                                    onClick={(e) => removeFeed(e, feed)}
                                >
                                    {getPageText("delete")}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => reportFeed(e, feed)}
                            >
                                {getPageText("report")}
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
                        <strong>{safeText(ad.BUSINESS_NAME, getPageText("localSponsor"))}</strong>
                        <p>{t("sponsored")} · {safeText(ad.AREA, "Korea")}</p>
                    </div>

                    {renderAdMenu(ad)}
                </div>

                <div className="home-ad-visual">
                    {getAdImageUrl(ad) !== "" ? (
                        <img src={getAdImageUrl(ad)} alt={safeText(ad.AD_TITLE, getPageText("adImage"))} />
                    ) : (
                        <div className="home-ad-gradient">
                            <span>{safeText(ad.BUSINESS_TYPE, "LOCAL")}</span>
                            <strong>{safeText(ad.BUSINESS_NAME, "K-STEP AD")}</strong>
                            <p>{safeText(ad.AREA, "Korea")}</p>
                        </div>
                    )}

                    <div className="home-sponsored-badge">{t("sponsored")}</div>
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
                        <span>{t("sponsored")}</span>
                        <em>{safeText(ad.BUSINESS_TYPE, "LOCAL")}</em>
                    </div>

                    <h2>{safeText(ad.AD_TITLE, getPageText("adTitleDefault"))}</h2>

                    <p className="home-caption">
                        <strong>{safeText(ad.BUSINESS_NAME, getPageText("localSponsor"))}</strong>
                        {" "}
                        {safeText(ad.AD_TEXT, getPageText("adTextDefault"))}
                    </p>

                    <button
                        type="button"
                        className="home-ad-cta"
                        onClick={(e) => clickSponsoredAd(e, ad)}
                    >
                        {getPageText("storeView")}
                    </button>
                </div>
            </article>
        );
    }

    function renderFeedPost(feed) {
        const feedProfileImageUrl = getProfileImageUrl(getProfileImageValue(feed));

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
                        {feedProfileImageUrl !== "" ? (
                            <img
                                src={feedProfileImageUrl}
                                alt={safeText(feed.NICKNAME, getPageText("profileAlt"))}
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
                            alt={safeText(feed.TITLE, getPageText("feedImageAlt"))}
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
                        <span>{safeText(feed.CATEGORY, getPageText("categoryDefault"))}</span>
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
                        <strong>{getPageText("likeCount")} {feed.LIKE_COUNT || 0}{getPageText("countUnit")}</strong>
                        <span>{getPageText("commentCount")} {feed.COMMENT_COUNT || 0}{getPageText("countUnit")}</span>
                        <span>{getPageText("saveCount")} {feed.BOOKMARK_COUNT || 0}{getPageText("countUnit")}</span>
                    </div>

                    <h2>{safeText(feed.TITLE, getPageText("titleEmpty"))}</h2>

                    <p className="home-caption">
                        <strong>{safeText(feed.NICKNAME, "traveler")}</strong>
                        {" "}
                        {safeText(feed.ROUTE_SUMMARY || feed.CONTENT, getPageText("routeEmpty"))}
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
                        {getPageText("viewAllComments")}
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
                        <span>{t("sponsored")}</span>
                        <h2>{getPageText("sponsoredTitle")}</h2>
                    </div>

                    <p>{visibleAdList.length}{getPageText("sponsoredCountSuffix")}</p>
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
                                        alt={safeText(ad.AD_TITLE, getPageText("adImage"))}
                                    />
                                ) : (
                                    <div className="home-ad-carousel-gradient">
                                        <strong>{getFirstLetter(ad.BUSINESS_NAME)}</strong>
                                    </div>
                                )}

                                <span>AD</span>
                            </div>

                            <div className="home-ad-carousel-info">
                                <strong>{safeText(ad.BUSINESS_NAME, getPageText("localSponsor"))}</strong>
                                <p>{safeText(ad.AD_TITLE, getPageText("localAdDefault"))}</p>

                                <button
                                    type="button"
                                    onClick={(e) => clickSponsoredAd(e, ad)}
                                >
                                    {getPageText("storeView")}
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

    const myProfileImageUrl = getProfileImageUrl(getProfileImageValue(myProfile));
    const myNickname = safeText(myProfile?.NICKNAME || myProfile?.nickname, nickname);
    const myUserType = safeText(myProfile?.USER_TYPE || myProfile?.userType, "K-STEP traveler");

    return (
        <div
            className="home-page"
            data-lang={language}
            onClick={() => {
                if (openMenuKey !== "") {
                    setOpenMenuKey("");
                }
            }}
        >
            <PageDecor />

            <div className="home-bg-flower home-flower-one">✿</div>
            <div className="home-bg-flower home-flower-two">❀</div>

            <div className="home-layout">
                <main className="home-main">
                    <section className="home-app-top">
                        <PageDecor variant="box" />

                        <div className="home-brand-row">
                            <div className="home-brand-mark">K</div>

                            <div>
                                <h1>{getPageText("homeTitle")}</h1>
                                <p>{getPageText("homeSub")}</p>
                            </div>
                        </div>

                        <div className="home-top-icons">
                            <button
                                type="button"
                                onClick={() => navigate("/chat")}
                                title={language === "en" ? "Chat" : "채팅"}
                            >
                                💬
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

                    <section className="home-search-line">
                        <div className="home-search-input-wrap">
                            <span>⌕</span>

                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={enterSearch}
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

                    <StoryBar />

                    {renderAdCarousel()}

                    {loading && (
                        <div className="home-empty-box">
                            {getPageText("loadingFeed")}
                        </div>
                    )}

                    {!loading && feedList.length === 0 && (
                        <div className="home-empty-box">
                            {getPageText("emptyFeed")}
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
                        <div className="home-side-avatar home-avatar">
                            {myProfileImageUrl !== "" ? (
                                <img
                                    src={myProfileImageUrl}
                                    alt={myNickname}
                                />
                            ) : (
                                <span>{getFirstLetter(myNickname)}</span>
                            )}
                        </div>

                        <div>
                            <strong>{myNickname}</strong>
                            <p>{myUserType}</p>
                        </div>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                moveMyProfile();
                            }}
                        >
                            {getPageText("view")}
                        </button>
                    </div>

                    {currentSideAd && (
                        <div
                            className="home-side-ad"
                            onClick={(e) => clickSponsoredAd(e, currentSideAd)}
                        >
                            <div className="home-side-ad-top">
                                <span>{t("sponsored")}</span>
                                <em>
                                    {adSlideIndex + 1}/{visibleSponsoredAdList.length}
                                </em>
                            </div>

                            <h3>{safeText(currentSideAd.BUSINESS_NAME, getPageText("localSponsor"))}</h3>

                            <p>{safeText(currentSideAd.AD_TITLE, getPageText("localAdDefault"))}</p>

                            <div className="home-side-ad-actions">
                                <button
                                    type="button"
                                    onClick={(e) => clickSponsoredAd(e, currentSideAd)}
                                >
                                    {getPageText("storeView")}
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
                            <strong>{getPageText("recommendUser")}</strong>

                            <button
                                type="button"
                                onClick={() => navigate("/explore")}
                            >
                                {getPageText("seeMore")}
                            </button>
                        </div>

                        {recommendUserList.length === 0 && (
                            <div className="home-recommend-empty">
                                {getPageText("noRecommendUser")}
                            </div>
                        )}

                        {recommendUserList.map(user => {
                            const recommendProfileImageUrl = getProfileImageUrl(getProfileImageValue(user));

                            return (
                                <div className="home-recommend-item" key={user.USER_NO}>
                                    <div
                                        className="home-recommend-avatar home-avatar"
                                        onClick={(e) => moveProfile(e, user.USER_NO)}
                                    >
                                        {recommendProfileImageUrl !== "" ? (
                                            <img
                                                src={recommendProfileImageUrl}
                                                alt={safeText(user.NICKNAME, getPageText("profileAlt"))}
                                            />
                                        ) : (
                                            <span>{getFirstLetter(user.NICKNAME)}</span>
                                        )}
                                    </div>

                                    <div>
                                        <strong onClick={(e) => moveProfile(e, user.USER_NO)}>
                                            {safeText(user.NICKNAME, "traveler")}
                                        </strong>

                                        <p>
                                            {safeText(user.INTRO || user.BIO, getPageText("noIntro"))}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => moveProfile(e, user.USER_NO)}
                                    >
                                        {getPageText("view")}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </div>

            <ScrollTopButton />

            {commentModalOpen && selectedFeed && (
                <div className="home-comment-modal-bg" onClick={closeCommentModal}>
                    <div className="home-comment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="home-comment-image-area">
                            {getSelectedImageUrl(selectedFeed) !== "" ? (
                                <img
                                    src={getSelectedImageUrl(selectedFeed)}
                                    alt={safeText(selectedFeed.TITLE, getPageText("feedImageAlt"))}
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
                                    {getProfileImageUrl(getProfileImageValue(selectedFeed)) !== "" ? (
                                        <img
                                            src={getProfileImageUrl(getProfileImageValue(selectedFeed))}
                                            alt={safeText(selectedFeed.NICKNAME, getPageText("profileAlt"))}
                                        />
                                    ) : (
                                        <span>{getFirstLetter(selectedFeed.NICKNAME || selectedFeed.USER_ID)}</span>
                                    )}
                                </div>

                                <div>
                                    <strong>{safeText(selectedFeed.NICKNAME, "traveler")}</strong>
                                    <p>{safeText(selectedFeed.TITLE, getPageText("titleEmpty"))}</p>
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
                                        {getPageText("commentLoading")}
                                    </div>
                                )}

                                {!commentLoading && commentList.length === 0 && (
                                    <div className="home-comment-empty">
                                        {getPageText("noComment")}
                                    </div>
                                )}

                                {!commentLoading && commentList.map(comment => {
                                    const commentProfileImageUrl = getProfileImageUrl(getProfileImageValue(comment));

                                    return (
                                        <div className="home-comment-item" key={comment.COMMENT_NO}>
                                            <div
                                                className="home-comment-avatar home-avatar"
                                                onClick={(e) => moveProfile(e, comment.USER_NO)}
                                            >
                                                {commentProfileImageUrl !== "" ? (
                                                    <img
                                                        src={commentProfileImageUrl}
                                                        alt={safeText(comment.NICKNAME, getPageText("profileAlt"))}
                                                    />
                                                ) : (
                                                    <span>{getFirstLetter(comment.NICKNAME || comment.USER_ID)}</span>
                                                )}
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
                                                    {getPageText("delete")}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="home-comment-input-box">
                                <textarea
                                    value={commentContent}
                                    maxLength={500}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    onKeyDown={enterComment}
                                    placeholder={getPageText("commentPlaceholder")}
                                ></textarea>

                                <span>{commentContent.length}/500</span>

                                <button
                                    type="button"
                                    className={commentContent.trim() === "" ? "disabled" : ""}
                                    onClick={addComment}
                                >
                                    {getPageText("post")}
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
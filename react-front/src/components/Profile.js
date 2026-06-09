import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProfileStoryCircle from "./ProfileStoryCircle";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./Profile.css";

function Profile() {
    const navigate = useNavigate();
    const profileImageInputRef = useRef(null);

    const { userNo } = useParams();
    const [searchParams] = useSearchParams();

    const loginUserNo = getLoginUserNo();
    const profileUserNo = searchParams.get("userNo") || userNo || loginUserNo;

    const [language, setLanguage] = useState(getLang());

    const [profile, setProfile] = useState(null);
    const [feedList, setFeedList] = useState([]);
    const [bookmarkList, setBookmarkList] = useState([]);
    const [followerList, setFollowerList] = useState([]);
    const [followingList, setFollowingList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [messageLoading, setMessageLoading] = useState(false);
    const [profileImageUploading, setProfileImageUploading] = useState(false);

    const [activeTab, setActiveTab] = useState("feed");

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

        if (!profileUserNo || profileUserNo === "null" || profileUserNo === "undefined") {
            alert(getPageText("noProfileNo"));
            navigate("/home");
            return;
        }

        setProfile(null);
        setActiveTab("feed");
        setFeedList([]);
        setBookmarkList([]);
        setFollowerList([]);
        setFollowingList([]);

        getProfile();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileUserNo]);

    function getPageText(key) {
        const ko = {
            noProfileNo: "프로필 번호가 없습니다. 다시 로그인해주세요.",
            profileLoadFail: "프로필을 불러오지 못했습니다.",
            profileLoadError: "프로필 정보를 불러오는 중 오류가 발생했습니다.",
            feedLoadFail: "프로필 피드를 불러오지 못했습니다.",
            feedLoadError: "프로필 피드를 불러오는 중 오류가 발생했습니다.",
            bookmarkPrivate: "비공개 목록입니다.",
            bookmarkLoadFail: "저장한 루트를 불러오지 못했습니다.",
            bookmarkLoadError: "저장한 루트를 불러오는 중 오류가 발생했습니다.",
            followerLoadFail: "팔로워 목록을 불러오지 못했습니다.",
            followerLoadError: "팔로워 목록을 불러오는 중 오류가 발생했습니다.",
            followingLoadFail: "팔로잉 목록을 불러오지 못했습니다.",
            followingLoadError: "팔로잉 목록을 불러오는 중 오류가 발생했습니다.",
            followFail: "팔로우 처리에 실패했습니다.",
            followError: "팔로우 처리 중 오류가 발생했습니다.",
            chatOpenFail: "채팅방을 여는 중 오류가 발생했습니다.",
            chatOpenError: "채팅방을 여는 중 오류가 발생했습니다.",
            blockConfirm: "이 사용자를 차단할까요? 차단하면 서로의 피드와 프로필 접근이 제한됩니다.",
            blockFail: "차단 처리에 실패했습니다.",
            blockError: "차단 처리 중 오류가 발생했습니다.",
            imageOnly: "이미지 파일만 선택할 수 있습니다.",
            imageSize: "프로필 사진은 5MB 이하만 가능합니다.",
            imageChangeDone: "프로필 사진이 변경되었습니다.",
            imageChangeFail: "프로필 사진 변경에 실패했습니다.",
            imageChangeError: "프로필 사진 변경 중 오류가 발생했습니다.",
            profileShareTitle: "K-STEP 여행자",
            profileShareSuffix: "님의 프로필",
            profileShareText: "을 확인해보세요.",
            profileLinkCopied: "프로필 링크가 복사되었습니다.",
            copyFail: "링크 복사에 실패했습니다.",
            follow: "팔로우",
            following: "팔로잉",
            requested: "요청됨",
            followRequest: "팔로우 요청",
            tabFeedTitle: "작성한 여행 피드",
            tabBookmarkTitle: "저장한 여행 루트",
            tabFollowerTitle: "팔로워 목록",
            tabFollowingTitle: "팔로잉 목록",
            tabDefaultTitle: "목록",
            tabFeedMyDesc: "내가 작성한 여행 루트 피드입니다.",
            tabFeedOtherDesc: "이 사용자가 작성한 여행 루트 피드입니다.",
            tabBookmarkMyDesc: "나중에 다시 보고 싶은 저장한 여행 루트입니다.",
            tabBookmarkOtherDesc: "이 사용자가 저장한 여행 루트입니다.",
            tabFollowerMyDesc: "나를 팔로우하는 사용자 목록입니다.",
            tabFollowerOtherDesc: "이 사용자를 팔로우하는 사용자 목록입니다.",
            tabFollowingMyDesc: "내가 팔로우하는 사용자 목록입니다.",
            tabFollowingOtherDesc: "이 사용자가 팔로우하는 사용자 목록입니다.",
            privateTitle: "비공개 계정입니다.",
            privateDesc: "승인된 팔로워만 이 사용자의 피드와 목록을 볼 수 있습니다.",
            connecting: "연결 중...",
            message: "메시지",
            listLoading: "목록을 불러오는 중입니다...",
            feedImageAlt: "피드 이미지",
            categoryDefault: "여행",
            routeView: "루트 보기",
            titleEmpty: "제목 없음",
            contentEmpty: "내용이 없습니다.",
            profileAlt: "프로필",
            noBio: "소개글이 없습니다.",
            feedCount: "피드",
            profileLoading: "프로필 정보를 불러오는 중입니다...",
            profileEmpty: "프로필 정보가 없습니다.",
            profileCover: "K-STEP PROFILE",
            profileImageEdit: "프로필 사진 변경",
            privateAccount: "🔒 비공개 계정",
            publicAccount: "🌿 공개 계정",
            myProfileLabel: "My travel profile",
            travelerProfileLabel: "Traveler profile",
            profileSettings: "프로필 설정",
            bioEmpty: "아직 작성된 소개가 없습니다.",
            routeShare: "✦ 여행 루트 공유",
            localFeed: "✿ 로컬 피드",
            kstepSns: "♡ K-STEP SNS",
            writtenFeed: "작성 피드",
            savedRoute: "저장한 루트",
            follower: "팔로워",
            followingCount: "팔로잉",
            writeRoute: "+ 여행 루트 작성",
            storyManage: "스토리 관리",
            saved: "즐겨찾기",
            share: "공유",
            block: "차단",
            emptyFeed: "아직 작성한 피드가 없습니다.",
            emptyBookmark: "아직 저장한 여행 루트가 없거나 비공개입니다.",
            emptyFollower: "아직 팔로워가 없습니다.",
            emptyFollowing: "아직 팔로잉한 사용자가 없습니다."
        };

        const en = {
            noProfileNo: "Profile number is missing. Please log in again.",
            profileLoadFail: "Failed to load profile.",
            profileLoadError: "An error occurred while loading profile information.",
            feedLoadFail: "Failed to load profile feeds.",
            feedLoadError: "An error occurred while loading profile feeds.",
            bookmarkPrivate: "This list is private.",
            bookmarkLoadFail: "Failed to load saved routes.",
            bookmarkLoadError: "An error occurred while loading saved routes.",
            followerLoadFail: "Failed to load followers.",
            followerLoadError: "An error occurred while loading followers.",
            followingLoadFail: "Failed to load following list.",
            followingLoadError: "An error occurred while loading following list.",
            followFail: "Failed to process follow.",
            followError: "An error occurred while processing follow.",
            chatOpenFail: "Failed to open chat room.",
            chatOpenError: "An error occurred while opening chat room.",
            blockConfirm: "Block this user? If blocked, both users will have limited access to each other's feeds and profiles.",
            blockFail: "Failed to block user.",
            blockError: "An error occurred while blocking user.",
            imageOnly: "Only image files can be selected.",
            imageSize: "Profile photo must be 5MB or less.",
            imageChangeDone: "Profile photo has been updated.",
            imageChangeFail: "Failed to update profile photo.",
            imageChangeError: "An error occurred while updating profile photo.",
            profileShareTitle: "K-STEP traveler",
            profileShareSuffix: "'s profile",
            profileShareText: "Check out this profile.",
            profileLinkCopied: "Profile link has been copied.",
            copyFail: "Failed to copy link.",
            follow: "Follow",
            following: "Following",
            requested: "Requested",
            followRequest: "Request Follow",
            tabFeedTitle: "Travel Feeds",
            tabBookmarkTitle: "Saved Travel Routes",
            tabFollowerTitle: "Followers",
            tabFollowingTitle: "Following",
            tabDefaultTitle: "List",
            tabFeedMyDesc: "These are the travel route feeds you created.",
            tabFeedOtherDesc: "These are the travel route feeds created by this user.",
            tabBookmarkMyDesc: "These are the saved travel routes you may want to revisit later.",
            tabBookmarkOtherDesc: "These are the travel routes saved by this user.",
            tabFollowerMyDesc: "Users who follow you.",
            tabFollowerOtherDesc: "Users who follow this traveler.",
            tabFollowingMyDesc: "Users you are following.",
            tabFollowingOtherDesc: "Users this traveler is following.",
            privateTitle: "This account is private.",
            privateDesc: "Only approved followers can view this user's feeds and lists.",
            connecting: "Connecting...",
            message: "Message",
            listLoading: "Loading list...",
            feedImageAlt: "Feed image",
            categoryDefault: "Travel",
            routeView: "View Route",
            titleEmpty: "Untitled",
            contentEmpty: "No content.",
            profileAlt: "Profile",
            noBio: "No introduction yet.",
            feedCount: "Feeds",
            profileLoading: "Loading profile information...",
            profileEmpty: "No profile information.",
            profileCover: "K-STEP PROFILE",
            profileImageEdit: "Change profile photo",
            privateAccount: "🔒 Private Account",
            publicAccount: "🌿 Public Account",
            myProfileLabel: "My travel profile",
            travelerProfileLabel: "Traveler profile",
            profileSettings: "Profile Settings",
            bioEmpty: "No introduction has been written yet.",
            routeShare: "✦ Travel route sharing",
            localFeed: "✿ Local feeds",
            kstepSns: "♡ K-STEP SNS",
            writtenFeed: "Feeds",
            savedRoute: "Saved Routes",
            follower: "Followers",
            followingCount: "Following",
            writeRoute: "+ Create Travel Route",
            storyManage: "Manage Stories",
            saved: "Saved",
            share: "Share",
            block: "Block",
            emptyFeed: "No feeds have been written yet.",
            emptyBookmark: "No saved travel routes yet, or the list is private.",
            emptyFollower: "No followers yet.",
            emptyFollowing: "No following users yet."
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
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
        const savedUserNo =
            localStorage.getItem("userNo") ||
            localStorage.getItem("USER_NO") ||
            localStorage.getItem("loginUserNo");

        if (savedUserNo) {
            return savedUserNo;
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

    function getProfile() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage(t("loginRequired"));
            return;
        }

        setLoading(true);

        fetch("http://localhost:3010/user/profile/" + profileUserNo, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("프로필 조회", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setProfile(data.profile);

                    if (isCanViewByProfile(data.profile)) {
                        getProfileFeed();
                    }
                } else {
                    alert(data.message || getPageText("profileLoadFail"));
                    navigate("/home");
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("profileLoadError"));
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function getProfileFeed() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage(t("loginRequired"));
            return;
        }

        setListLoading(true);

        fetch("http://localhost:3010/user/profile/" + profileUserNo + "/feed", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("프로필 피드 조회", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setFeedList(data.list || []);
                } else if (data.result === "private") {
                    setFeedList([]);
                } else {
                    alert(data.message || getPageText("feedLoadFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("feedLoadError"));
            })
            .finally(() => {
                setListLoading(false);
            });
    }

    function getBookmarkList() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage(t("loginRequired"));
            return;
        }

        setListLoading(true);

        fetch("http://localhost:3010/user/profile/" + profileUserNo + "/bookmark", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("저장한 루트 조회", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setBookmarkList(data.list || []);
                } else if (data.result === "private") {
                    setBookmarkList([]);
                    alert(data.message || getPageText("bookmarkPrivate"));
                } else {
                    alert(data.message || getPageText("bookmarkLoadFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("bookmarkLoadError"));
            })
            .finally(() => {
                setListLoading(false);
            });
    }

    function getFollowerList() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage(t("loginRequired"));
            return;
        }

        setListLoading(true);

        fetch("http://localhost:3010/user/follower/list/" + profileUserNo, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("팔로워 목록 조회", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setFollowerList(data.list || []);
                } else if (data.result === "private") {
                    setFollowerList([]);
                } else {
                    alert(data.message || getPageText("followerLoadFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("followerLoadError"));
            })
            .finally(() => {
                setListLoading(false);
            });
    }

    function getFollowingList() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage(t("loginRequired"));
            return;
        }

        setListLoading(true);

        fetch("http://localhost:3010/user/following/list/" + profileUserNo, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("팔로잉 목록 조회", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setFollowingList(data.list || []);
                } else if (data.result === "private") {
                    setFollowingList([]);
                } else {
                    alert(data.message || getPageText("followingLoadFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("followingLoadError"));
            })
            .finally(() => {
                setListLoading(false);
            });
    }

    function clickTab(tabName) {
        setActiveTab(tabName);

        if (!isCanView()) {
            return;
        }

        if (tabName === "feed") {
            getProfileFeed();
        }

        if (tabName === "bookmark") {
            getBookmarkList();
        }

        if (tabName === "follower") {
            getFollowerList();
        }

        if (tabName === "following") {
            getFollowingList();
        }
    }

    function toggleFollow() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage(t("loginRequired"));
            return;
        }

        if (!profile) {
            return;
        }

        fetch("http://localhost:3010/user/follow/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                targetUserNo: profile.USER_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("팔로우 결과", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    alert(data.message);
                    getProfile();
                } else {
                    alert(data.message || getPageText("followFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("followError"));
            });
    }

    function openChatRoom() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage(t("loginRequired"));
            return;
        }

        if (!profile) {
            return;
        }

        if (isMyProfile()) {
            navigate("/chat");
            return;
        }

        setMessageLoading(true);

        fetch("http://localhost:3010/chat/room/open", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                targetUserNo: profile.USER_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("프로필에서 채팅방 열기", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    sessionStorage.setItem("selectedChatRoomNo", data.roomNo);

                    navigate("/chat", {
                        state: {
                            roomNo: data.roomNo
                        }
                    });
                } else {
                    alert(data.message || getPageText("chatOpenFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("chatOpenError"));
            })
            .finally(() => {
                setMessageLoading(false);
            });
    }

    function blockUser() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage(t("loginRequired"));
            return;
        }

        if (!profile) {
            return;
        }

        if (!window.confirm(getPageText("blockConfirm"))) {
            return;
        }

        fetch("http://localhost:3010/user/block/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                targetUserNo: profile.USER_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    alert(data.message);
                    navigate("/home");
                } else {
                    alert(data.message || getPageText("blockFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("blockError"));
            });
    }

    function openProfileImagePicker(e) {
        if (e) {
            e.stopPropagation();
        }

        if (profileImageUploading) {
            return;
        }

        if (profileImageInputRef.current) {
            profileImageInputRef.current.click();
        }
    }

    function selectProfileImage(e) {
        const file = e.target.files && e.target.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert(getPageText("imageOnly"));
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert(getPageText("imageSize"));
            e.target.value = "";
            return;
        }

        updateProfileImage(file);
        e.target.value = "";
    }

    function updateProfileImage(file) {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage(t("loginRequired"));
            return;
        }

        const formData = new FormData();
        formData.append("profileImage", file);

        setProfileImageUploading(true);

        fetch("http://localhost:3010/user/profile/image/update", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                console.log("프로필 사진 변경 결과", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    const nextProfileImg =
                        data.profileImg ||
                        data.PROFILE_IMG ||
                        data.profileImage ||
                        data.imageUrl ||
                        "";

                    if (nextProfileImg !== "") {
                        setProfile(prevProfile => {
                            if (!prevProfile) {
                                return prevProfile;
                            }

                            return {
                                ...prevProfile,
                                PROFILE_IMG: nextProfileImg
                            };
                        });
                    }

                    alert(data.message || getPageText("imageChangeDone"));
                    getProfile();
                } else {
                    alert(data.message || getPageText("imageChangeFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("imageChangeError"));
            })
            .finally(() => {
                setProfileImageUploading(false);
            });
    }

    function openFeedDetail(feedNo) {
        sessionStorage.setItem("selectedFeedNo", feedNo);

        navigate("/feed/detail", {
            state: {
                feedNo: feedNo
            }
        });
    }

    function moveProfile(targetUserNo) {
        if (!targetUserNo) {
            return;
        }

        navigate("/profile/" + targetUserNo);
    }

    function shareProfile() {
        if (!profile) {
            return;
        }

        const shareUrl = window.location.origin + "/profile/" + profile.USER_NO;
        const title = safeText(profile.NICKNAME, getPageText("profileShareTitle")) + getPageText("profileShareSuffix");

        if (navigator.share) {
            navigator.share({
                title: title,
                text: language === "en" ? getPageText("profileShareText") : title + getPageText("profileShareText"),
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    alert(getPageText("profileLinkCopied"));
                })
                .catch(err => {
                    console.error(err);
                    alert(getPageText("copyFail"));
                });

            return;
        }

        alert(shareUrl);
    }

    function goCreateFeed() {
        navigate("/feed/new");
    }

    function goSettings() {
        navigate("/profile/settings");
    }

    function goSaved() {
        navigate("/saved");
    }

    function isMyProfile() {
        if (!profile) {
            return false;
        }

        return String(loginUserNo) === String(profile.USER_NO);
    }

    function isCanViewByProfile(targetProfile) {
        if (!targetProfile) {
            return false;
        }

        if (String(loginUserNo) === String(targetProfile.USER_NO)) {
            return true;
        }

        if (targetProfile.CAN_VIEW_YN === undefined || targetProfile.CAN_VIEW_YN === null) {
            return true;
        }

        return targetProfile.CAN_VIEW_YN === "Y";
    }

    function isCanView() {
        return isCanViewByProfile(profile);
    }

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
    }

    function getFirstLetter(value) {
        if (value === undefined || value === null || value === "") {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
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

        if (String(value).startsWith("/images/")) {
            return value;
        }

        if (String(value).startsWith("/uploads/")) {
            return "http://localhost:3010" + value;
        }

        return "/images/" + value;
    }

    function getFollowButtonText() {
        if (!profile) {
            return getPageText("follow");
        }

        if (profile.FOLLOW_YN === "Y") {
            return getPageText("following");
        }

        if (profile.FOLLOW_YN === "P") {
            return getPageText("requested");
        }

        if (profile.ACCOUNT_PRIVATE_YN === "Y") {
            return getPageText("followRequest");
        }

        return getPageText("follow");
    }

    function getTabTitle() {
        if (activeTab === "feed") {
            return getPageText("tabFeedTitle");
        }

        if (activeTab === "bookmark") {
            return getPageText("tabBookmarkTitle");
        }

        if (activeTab === "follower") {
            return getPageText("tabFollowerTitle");
        }

        if (activeTab === "following") {
            return getPageText("tabFollowingTitle");
        }

        return getPageText("tabDefaultTitle");
    }

    function getTabDesc() {
        if (activeTab === "feed") {
            return isMyProfile()
                ? getPageText("tabFeedMyDesc")
                : getPageText("tabFeedOtherDesc");
        }

        if (activeTab === "bookmark") {
            return isMyProfile()
                ? getPageText("tabBookmarkMyDesc")
                : getPageText("tabBookmarkOtherDesc");
        }

        if (activeTab === "follower") {
            return isMyProfile()
                ? getPageText("tabFollowerMyDesc")
                : getPageText("tabFollowerOtherDesc");
        }

        if (activeTab === "following") {
            return isMyProfile()
                ? getPageText("tabFollowingMyDesc")
                : getPageText("tabFollowingOtherDesc");
        }

        return "";
    }

    function renderPrivateBox() {
        return (
            <div className="profile-private-box">
                <div className="profile-private-icon">🔒</div>

                <h3>{getPageText("privateTitle")}</h3>

                <p>
                    {getPageText("privateDesc")}
                </p>

                {!isMyProfile() && (
                    <div className="profile-private-action-row">
                        <button onClick={toggleFollow}>
                            {getFollowButtonText()}
                        </button>

                        <button
                            className="profile-private-message-btn"
                            onClick={openChatRoom}
                            disabled={messageLoading}
                        >
                            {messageLoading ? getPageText("connecting") : getPageText("message")}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    function renderFeedCardList(list, emptyMessage) {
        if (listLoading) {
            return (
                <div className="profile-list-empty">
                    {getPageText("listLoading")}
                </div>
            );
        }

        if (!list || list.length === 0) {
            return (
                <div className="profile-list-empty">
                    {emptyMessage}
                </div>
            );
        }

        return (
            <div className="profile-feed-grid">
                {list.map((feed) => (
                    <article
                        className="profile-feed-card"
                        key={feed.FEED_NO}
                        onClick={() => openFeedDetail(feed.FEED_NO)}
                    >
                        <div className="profile-feed-card-image">
                            {getImageUrl(feed) !== "" ? (
                                <img src={getImageUrl(feed)} alt={safeText(feed.TITLE, getPageText("feedImageAlt"))} />
                            ) : (
                                <div className="profile-no-image">
                                    K-STEP
                                </div>
                            )}

                            <div className="profile-feed-badge-row">
                                <span>{safeText(feed.AREA, "Korea")}</span>
                                <span>{safeText(feed.CATEGORY, getPageText("categoryDefault"))}</span>
                            </div>

                            <div className="profile-feed-hover-layer">
                                <strong>{getPageText("routeView")}</strong>
                            </div>
                        </div>

                        <div className="profile-feed-card-body">
                            <h3>{safeText(feed.TITLE, getPageText("titleEmpty"))}</h3>

                            <p>{feed.ROUTE_SUMMARY || feed.CONTENT || getPageText("contentEmpty")}</p>

                            <div className="profile-feed-meta">
                                <span>♡ {feed.LIKE_COUNT || 0}</span>
                                <span>💬 {feed.COMMENT_COUNT || 0}</span>
                                <span>🔖 {feed.BOOKMARK_COUNT || 0}</span>
                            </div>

                            <div className="profile-feed-writer">
                                by {safeText(feed.NICKNAME, safeText(profile && profile.NICKNAME, "traveler"))}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    }

    function renderUserList(list, emptyMessage) {
        if (listLoading) {
            return (
                <div className="profile-list-empty">
                    {getPageText("listLoading")}
                </div>
            );
        }

        if (!list || list.length === 0) {
            return (
                <div className="profile-list-empty">
                    {emptyMessage}
                </div>
            );
        }

        return (
            <div className="profile-follow-list">
                {list.map((user) => (
                    <div
                        className="profile-follow-item"
                        key={user.USER_NO}
                        onClick={() => moveProfile(user.USER_NO)}
                    >
                        <div className="profile-follow-avatar">
                            {getProfileImageUrl(user.PROFILE_IMG) !== "" ? (
                                <img
                                    src={getProfileImageUrl(user.PROFILE_IMG)}
                                    alt={safeText(user.NICKNAME, getPageText("profileAlt"))}
                                />
                            ) : (
                                getFirstLetter(user.NICKNAME || user.USER_ID)
                            )}
                        </div>

                        <div className="profile-follow-info">
                            <strong>{safeText(user.NICKNAME, "traveler")}</strong>
                            <p>@{safeText(user.USER_ID, "user")} · {safeText(user.USER_TYPE, "TRAVELER")}</p>
                            <span>
                                {safeText(user.BIO, getPageText("noBio"))}
                            </span>
                        </div>

                        <div className="profile-follow-count">
                            {getPageText("feedCount")} {user.FEED_COUNT || 0}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="profile-page" data-lang={language}>
                <PageDecor />

                <div className="profile-container">
                    <section className="profile-section">
                        {getPageText("profileLoading")}
                    </section>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-page" data-lang={language}>
                <PageDecor />

                <div className="profile-container">
                    <section className="profile-section">
                        {getPageText("profileEmpty")}
                    </section>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    const canView = isCanView();

    return (
        <div className="profile-page" data-lang={language}>
            <PageDecor />

            <div className="profile-container">
                <section className="profile-hero-card">
                    <PageDecor variant="box" />

                    <div className="profile-cover-strip">
                        <span>{getPageText("profileCover")}</span>
                        <strong>{safeText(profile.AREA, "Korea Travel")}</strong>
                    </div>

                    <div className="profile-avatar-box">
                        <div className="profile-story-wrap">
                            <ProfileStoryCircle
                                userNo={profile.USER_NO}
                                nickname={profile.NICKNAME || profile.USER_ID}
                                profileImg={profile.PROFILE_IMG}
                            />

                            {isMyProfile() && (
                                <>
                                    <button
                                        type="button"
                                        className="profile-image-edit-btn"
                                        onClick={openProfileImagePicker}
                                        disabled={profileImageUploading}
                                        title={getPageText("profileImageEdit")}
                                        aria-label={getPageText("profileImageEdit")}
                                    >
                                        {profileImageUploading ? "..." : "📷"}
                                    </button>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={profileImageInputRef}
                                        className="profile-image-hidden-input"
                                        onChange={selectProfileImage}
                                    />
                                </>
                            )}
                        </div>

                        <div className="profile-type-badge">
                            {safeText(profile.USER_TYPE, "TRAVELER")}
                        </div>

                        <div className={profile.ACCOUNT_PRIVATE_YN === "Y" ? "profile-private-badge private" : "profile-private-badge public"}>
                            {profile.ACCOUNT_PRIVATE_YN === "Y" ? getPageText("privateAccount") : getPageText("publicAccount")}
                        </div>
                    </div>

                    <div className="profile-info">
                        <div className="profile-name-row">
                            <div>
                                <p className="profile-label">
                                    {isMyProfile() ? getPageText("myProfileLabel") : getPageText("travelerProfileLabel")}
                                </p>

                                <h1>{safeText(profile.NICKNAME, "traveler")}</h1>

                                <p className="profile-id">
                                    @{safeText(profile.USER_ID, "user")}
                                </p>
                            </div>

                            {isMyProfile() && (
                                <button
                                    className="profile-setting-icon-btn"
                                    onClick={goSettings}
                                    title={getPageText("profileSettings")}
                                    aria-label={getPageText("profileSettings")}
                                >
                                    ⚙
                                </button>
                            )}
                        </div>

                        <p className="profile-bio">
                            {safeText(profile.BIO, getPageText("bioEmpty"))}
                        </p>

                        <div className="profile-sns-info-row">
                            <span>{getPageText("routeShare")}</span>
                            <span>{getPageText("localFeed")}</span>
                            <span>{getPageText("kstepSns")}</span>
                        </div>

                        <div className="profile-stats">
                            <div
                                className={activeTab === "feed" ? "profile-stat-card clickable active" : "profile-stat-card clickable"}
                                onClick={() => clickTab("feed")}
                            >
                                <strong>{profile.FEED_COUNT || 0}</strong>
                                <span>{getPageText("writtenFeed")}</span>
                            </div>

                            <div
                                className={activeTab === "bookmark" ? "profile-stat-card clickable active" : "profile-stat-card clickable"}
                                onClick={() => clickTab("bookmark")}
                            >
                                <strong>{profile.BOOKMARK_COUNT || 0}</strong>
                                <span>{getPageText("savedRoute")}</span>
                            </div>

                            <div
                                className={activeTab === "follower" ? "profile-stat-card clickable active" : "profile-stat-card clickable"}
                                onClick={() => clickTab("follower")}
                            >
                                <strong>{profile.FOLLOWER_COUNT || 0}</strong>
                                <span>{getPageText("follower")}</span>
                            </div>

                            <div
                                className={activeTab === "following" ? "profile-stat-card clickable active" : "profile-stat-card clickable"}
                                onClick={() => clickTab("following")}
                            >
                                <strong>{profile.FOLLOWING_COUNT || 0}</strong>
                                <span>{getPageText("followingCount")}</span>
                            </div>
                        </div>

                        <div className="profile-action-row">
                            {isMyProfile() ? (
                                <>
                                    <button className="profile-main-btn" onClick={goCreateFeed}>
                                        {getPageText("writeRoute")}
                                    </button>

                                    <button className="profile-outline-btn" onClick={() => navigate("/story/manage")}>
                                        {getPageText("storyManage")}
                                    </button>

                                    <button className="profile-soft-btn" onClick={goSaved}>
                                        {getPageText("saved")}
                                    </button>

                                    <button className="profile-soft-btn" onClick={shareProfile}>
                                        {getPageText("share")}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className={profile.FOLLOW_YN === "Y" ? "profile-main-btn following" : "profile-main-btn"}
                                        onClick={toggleFollow}
                                    >
                                        {getFollowButtonText()}
                                    </button>

                                    <button
                                        className="profile-message-btn"
                                        onClick={openChatRoom}
                                        disabled={messageLoading}
                                    >
                                        {messageLoading ? getPageText("connecting") : getPageText("message")}
                                    </button>

                                    <button className="profile-soft-btn" onClick={shareProfile}>
                                        {getPageText("share")}
                                    </button>

                                    <button className="profile-danger-outline-btn" onClick={blockUser}>
                                        {getPageText("block")}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <section className="profile-section">
                    <div className="profile-section-title">
                        <span>✦</span>

                        <div>
                            <h2>{getTabTitle()}</h2>
                            <p className="profile-section-desc">
                                {getTabDesc()}
                            </p>
                        </div>
                    </div>

                    {!canView && (
                        renderPrivateBox()
                    )}

                    {canView && activeTab === "feed" && (
                        renderFeedCardList(feedList, getPageText("emptyFeed"))
                    )}

                    {canView && activeTab === "bookmark" && (
                        renderFeedCardList(bookmarkList, getPageText("emptyBookmark"))
                    )}

                    {canView && activeTab === "follower" && (
                        renderUserList(followerList, getPageText("emptyFollower"))
                    )}

                    {canView && activeTab === "following" && (
                        renderUserList(followingList, getPageText("emptyFollowing"))
                    )}
                </section>
            </div>

            <ScrollTopButton />
        </div>
    );
}

export default Profile;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./ProfileSettings.css";

function ProfileSettings() {
    const navigate = useNavigate();
    const loginUserNo = localStorage.getItem("userNo");

    const [language, setLanguage] = useState(getLang());

    const [profile, setProfile] = useState(null);
    const [requestList, setRequestList] = useState([]);
    const [followerList, setFollowerList] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [blockList, setBlockList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [activeSettingTab, setActiveSettingTab] = useState("profile");

    const [editNickname, setEditNickname] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editUserType, setEditUserType] = useState("TRAVELER");
    const [editBio, setEditBio] = useState("");

    const [notiFollowYn, setNotiFollowYn] = useState("Y");
    const [notiCommentYn, setNotiCommentYn] = useState("Y");
    const [notiLikeYn, setNotiLikeYn] = useState("Y");
    const [notiChatYn, setNotiChatYn] = useState("Y");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [leavePassword, setLeavePassword] = useState("");

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
            alert(t("loginRequired"));
            navigate("/");
            return;
        }

        getMyProfile();
        getRequestList();
        getFollowerList();
        getFollowingList();
        getBlockList();
    }, [navigate]);

    function getPageText(key) {
        const ko = {
            profileFetchError: "프로필 조회 오류",
            requestFetchError: "요청 목록 조회 오류",
            followerFetchError: "팔로워 조회 오류",
            followingFetchError: "팔로잉 조회 오류",
            blockFetchError: "차단 목록 조회 오류",
            nicknameRequired: "닉네임을 입력해주세요.",
            bioLimit: "소개글은 500자 이하로 입력해주세요.",
            profileUpdateError: "프로필 수정 오류",
            privacyUpdateError: "공개 설정 변경 오류",
            bookmarkPrivacyError: "저장 루트 설정 오류",
            notificationSaveError: "알림 저장 오류",
            passwordChangeError: "비밀번호 변경 오류",
            leaveConfirm: "정말 탈퇴할까요?",
            leaveError: "회원 탈퇴 오류",
            acceptError: "요청 승인 오류",
            rejectError: "요청 거절 오류",
            removeFollowerConfirm: "팔로워에서 삭제할까요?",
            removeFollowerError: "팔로워 삭제 오류",
            unfollowConfirm: "팔로우 취소할까요?",
            unfollowError: "팔로우 취소 오류",
            unblockConfirm: "차단을 해제할까요?",
            unblockError: "차단 해제 오류",

            profileAlt: "프로필",
            approve: "승인",
            reject: "거절",
            delete: "삭제",
            cancel: "취소",
            unblock: "해제",
            on: "ON",
            off: "OFF",

            loading: "불러오는 중...",
            noProfile: "프로필 정보가 없습니다.",

            topTitle: "프로필 설정",
            topSub: "계정, 공개 범위, 알림, 팔로우 관리를 한 곳에서 정리해요.",
            homeTitle: "홈으로",
            profileTitle: "프로필",

            public: "공개",
            private: "비공개",

            menuProfile: "프로필",
            menuStory: "스토리 관리",
            menuPrivacy: "공개 범위",
            menuRequests: "팔로우 요청",
            menuFollowers: "팔로워",
            menuFollowing: "팔로잉",
            menuBlocked: "차단",
            menuNotifications: "알림",
            menuAccount: "계정",

            sectionProfile: "프로필",
            nickname: "닉네임",
            userType: "유형",
            email: "이메일",
            bio: "소개",
            save: "저장",

            sectionPrivacy: "공개 범위",
            account: "계정",
            savedRoute: "저장한 루트",
            change: "변경",

            noRequest: "요청이 없습니다.",
            noFollower: "팔로워가 없습니다.",
            noFollowing: "팔로잉이 없습니다.",
            noBlocked: "차단한 사용자가 없습니다.",

            notiFollow: "팔로우 요청",
            notiComment: "댓글",
            notiLike: "좋아요",
            notiChat: "채팅",

            passwordChange: "비밀번호 변경",
            currentPassword: "현재 비밀번호",
            newPassword: "새 비밀번호",
            newPasswordConfirm: "새 비밀번호 확인",
            changePasswordBtn: "변경",

            logout: "로그아웃",
            leaveAccount: "회원 탈퇴",
            passwordPlaceholder: "비밀번호",
            leaveBtn: "탈퇴"
        };

        const en = {
            profileFetchError: "Profile fetch error.",
            requestFetchError: "Follow request fetch error.",
            followerFetchError: "Follower fetch error.",
            followingFetchError: "Following fetch error.",
            blockFetchError: "Blocked user fetch error.",
            nicknameRequired: "Please enter a nickname.",
            bioLimit: "Bio can be up to 500 characters.",
            profileUpdateError: "Profile update error.",
            privacyUpdateError: "Privacy setting update error.",
            bookmarkPrivacyError: "Saved route setting error.",
            notificationSaveError: "Notification save error.",
            passwordChangeError: "Password change error.",
            leaveConfirm: "Do you really want to leave K-STEP?",
            leaveError: "Account deletion error.",
            acceptError: "Follow request accept error.",
            rejectError: "Follow request reject error.",
            removeFollowerConfirm: "Remove this user from your followers?",
            removeFollowerError: "Follower removal error.",
            unfollowConfirm: "Unfollow this user?",
            unfollowError: "Unfollow error.",
            unblockConfirm: "Unblock this user?",
            unblockError: "Unblock error.",

            profileAlt: "Profile",
            approve: "Approve",
            reject: "Reject",
            delete: "Remove",
            cancel: "Cancel",
            unblock: "Unblock",
            on: "ON",
            off: "OFF",

            loading: "Loading...",
            noProfile: "No profile information.",

            topTitle: "Profile Settings",
            topSub: "Manage your account, privacy, notifications, and follows in one place.",
            homeTitle: "Home",
            profileTitle: "Profile",

            public: "Public",
            private: "Private",

            menuProfile: "Profile",
            menuStory: "Story Management",
            menuPrivacy: "Privacy",
            menuRequests: "Follow Requests",
            menuFollowers: "Followers",
            menuFollowing: "Following",
            menuBlocked: "Blocked",
            menuNotifications: "Notifications",
            menuAccount: "Account",

            sectionProfile: "Profile",
            nickname: "Nickname",
            userType: "User Type",
            email: "Email",
            bio: "Bio",
            save: "Save",

            sectionPrivacy: "Privacy",
            account: "Account",
            savedRoute: "Saved Routes",
            change: "Change",

            noRequest: "No requests.",
            noFollower: "No followers.",
            noFollowing: "No following users.",
            noBlocked: "No blocked users.",

            notiFollow: "Follow Requests",
            notiComment: "Comments",
            notiLike: "Likes",
            notiChat: "Chats",

            passwordChange: "Change Password",
            currentPassword: "Current Password",
            newPassword: "New Password",
            newPasswordConfirm: "Confirm New Password",
            changePasswordBtn: "Change",

            logout: "Log out",
            leaveAccount: "Delete Account",
            passwordPlaceholder: "Password",
            leaveBtn: "Delete Account"
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
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

    function getFirstLetter(value) {
        if (!value) {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
    }

    function setProfileForm(profileData) {
        setEditNickname(profileData.NICKNAME || "");
        setEditEmail(profileData.EMAIL || "");
        setEditUserType(profileData.USER_TYPE || "TRAVELER");
        setEditBio(profileData.BIO || "");

        setNotiFollowYn(profileData.NOTI_FOLLOW_YN || "Y");
        setNotiCommentYn(profileData.NOTI_COMMENT_YN || "Y");
        setNotiLikeYn(profileData.NOTI_LIKE_YN || "Y");
        setNotiChatYn(profileData.NOTI_CHAT_YN || "Y");
    }

    function getMyProfile() {
        const token = localStorage.getItem("token");

        setLoading(true);

        fetch("http://localhost:3010/user/profile/" + loginUserNo, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    setProfile(data.profile);
                    setProfileForm(data.profile);
                } else {
                    alert(data.message);
                    navigate("/home");
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("profileFetchError"));
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function getRequestList() {
        const token = localStorage.getItem("token");

        setListLoading(true);

        fetch("http://localhost:3010/user/follow/request/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    setRequestList(data.list || []);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("requestFetchError"));
            })
            .finally(() => {
                setListLoading(false);
            });
    }

    function getFollowerList() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/user/follower/list/" + loginUserNo, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    setFollowerList(data.list || []);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("followerFetchError"));
            });
    }

    function getFollowingList() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/user/following/list/" + loginUserNo, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    setFollowingList(data.list || []);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("followingFetchError"));
            });
    }

    function getBlockList() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/user/block/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    setBlockList(data.list || []);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("blockFetchError"));
            });
    }

    function updateProfile() {
        const token = localStorage.getItem("token");

        if (editNickname.trim() === "") {
            alert(getPageText("nicknameRequired"));
            return;
        }

        if (editBio.length > 500) {
            alert(getPageText("bioLimit"));
            return;
        }

        fetch("http://localhost:3010/user/profile/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                nickname: editNickname,
                email: editEmail,
                userType: editUserType,
                bio: editBio
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    localStorage.setItem("nickname", editNickname);
                    localStorage.setItem("userType", editUserType);
                    getMyProfile();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("profileUpdateError"));
            });
    }

    function togglePrivacy() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/user/privacy/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    getMyProfile();
                    getRequestList();
                    getFollowerList();
                    getFollowingList();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("privacyUpdateError"));
            });
    }

    function toggleBookmarkPrivacy() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/user/bookmark/privacy/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    getMyProfile();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("bookmarkPrivacyError"));
            });
    }

    function updateNotifications() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/user/notifications/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                followYn: notiFollowYn,
                commentYn: notiCommentYn,
                likeYn: notiLikeYn,
                chatYn: notiChatYn
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    getMyProfile();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("notificationSaveError"));
            });
    }

    function changePassword() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/user/password/change", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
                newPasswordConfirm
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    logout();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("passwordChangeError"));
            });
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("userNo");
        localStorage.removeItem("userId");
        localStorage.removeItem("nickname");
        localStorage.removeItem("userType");
        navigate("/");
    }

    function leaveAccount() {
        const token = localStorage.getItem("token");

        if (!window.confirm(getPageText("leaveConfirm"))) {
            return;
        }

        fetch("http://localhost:3010/user/leave", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                password: leavePassword
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    logout();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("leaveError"));
            });
    }

    function acceptRequest(requesterUserNo) {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/user/follow/request/accept", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                requesterUserNo
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    getMyProfile();
                    getRequestList();
                    getFollowerList();
                    getFollowingList();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("acceptError"));
            });
    }

    function rejectRequest(requesterUserNo) {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/user/follow/request/reject", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                requesterUserNo
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    getRequestList();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("rejectError"));
            });
    }

    function removeFollower(followerUserNo) {
        const token = localStorage.getItem("token");

        if (!window.confirm(getPageText("removeFollowerConfirm"))) {
            return;
        }

        fetch("http://localhost:3010/user/follow/remove-follower", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                followerUserNo
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    getFollowerList();
                    getMyProfile();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("removeFollowerError"));
            });
    }

    function unfollowUser(targetUserNo) {
        const token = localStorage.getItem("token");

        if (!window.confirm(getPageText("unfollowConfirm"))) {
            return;
        }

        fetch("http://localhost:3010/user/follow/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                targetUserNo
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    getFollowingList();
                    getMyProfile();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("unfollowError"));
            });
    }

    function unblockUser(targetUserNo) {
        const token = localStorage.getItem("token");

        if (!window.confirm(getPageText("unblockConfirm"))) {
            return;
        }

        fetch("http://localhost:3010/user/block/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                targetUserNo
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(data.message);
                    getBlockList();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("unblockError"));
            });
    }

    function moveProfile(targetUserNo) {
        navigate("/profile/" + targetUserNo);
    }

    function moveStoryManage() {
        navigate("/story/manage");
    }

    function clickMenu(tabName) {
        setActiveSettingTab(tabName);

        if (tabName === "requests") {
            getRequestList();
        }

        if (tabName === "followers") {
            getFollowerList();
        }

        if (tabName === "following") {
            getFollowingList();
        }

        if (tabName === "blocked") {
            getBlockList();
        }
    }

    function renderUserCard(user, type) {
        return (
            <div className="settings-user-card" key={user.USER_NO}>
                <div
                    className="settings-user-avatar"
                    onClick={() => moveProfile(user.USER_NO)}
                >
                    {getProfileImageUrl(user.PROFILE_IMG) !== "" ? (
                        <img
                            src={getProfileImageUrl(user.PROFILE_IMG)}
                            alt={user.NICKNAME || getPageText("profileAlt")}
                        />
                    ) : (
                        getFirstLetter(user.NICKNAME || user.USER_ID)
                    )}
                </div>

                <div
                    className="settings-user-info"
                    onClick={() => moveProfile(user.USER_NO)}
                >
                    <strong>{user.NICKNAME}</strong>
                    <p>@{user.USER_ID}</p>
                </div>

                <div className="settings-user-side">
                    {type === "request" && (
                        <>
                            <button className="settings-small-btn" onClick={() => acceptRequest(user.USER_NO)}>
                                {getPageText("approve")}
                            </button>

                            <button className="settings-sub-btn" onClick={() => rejectRequest(user.USER_NO)}>
                                {getPageText("reject")}
                            </button>
                        </>
                    )}

                    {type === "follower" && (
                        <button className="settings-sub-btn" onClick={() => removeFollower(user.USER_NO)}>
                            {getPageText("delete")}
                        </button>
                    )}

                    {type === "following" && (
                        <button className="settings-sub-btn" onClick={() => unfollowUser(user.USER_NO)}>
                            {getPageText("cancel")}
                        </button>
                    )}

                    {type === "block" && (
                        <button className="settings-sub-btn" onClick={() => unblockUser(user.USER_NO)}>
                            {getPageText("unblock")}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    function renderToggle(label, value, setter) {
        return (
            <div className="settings-toggle-row">
                <strong>{label}</strong>

                <button
                    className={value === "Y" ? "toggle-btn on" : "toggle-btn"}
                    onClick={() => setter(value === "Y" ? "N" : "Y")}
                >
                    {value === "Y" ? getPageText("on") : getPageText("off")}
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="settings-page" data-lang={language}>
                <PageDecor />

                <div className="settings-container">
                    <div className="settings-empty-box">{getPageText("loading")}</div>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="settings-page" data-lang={language}>
                <PageDecor />

                <div className="settings-container">
                    <div className="settings-empty-box">{getPageText("noProfile")}</div>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    return (
        <div className="settings-page" data-lang={language}>
            <PageDecor />

            <div className="settings-container">
                <section className="settings-top">
                    <PageDecor variant="box" />

                    <div className="settings-top-title">
                        <div className="settings-brand-mark">K</div>

                        <div>
                            <h1>{getPageText("topTitle")}</h1>
                            <p>{getPageText("topSub")}</p>
                        </div>
                    </div>

                    <div className="settings-top-icons">
                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                            title={getPageText("homeTitle")}
                        >
                            ⌂
                        </button>

                        <button
                            type="button"
                            className="profile"
                            onClick={() => navigate("/profile/" + loginUserNo)}
                            title={getPageText("profileTitle")}
                        >
                            ↩
                        </button>
                    </div>
                </section>

                <section className="settings-summary-card">
                    <div className="settings-summary-avatar">
                        {getProfileImageUrl(profile.PROFILE_IMG) !== "" ? (
                            <img
                                src={getProfileImageUrl(profile.PROFILE_IMG)}
                                alt={profile.NICKNAME || getPageText("profileAlt")}
                            />
                        ) : (
                            getFirstLetter(profile.NICKNAME || profile.USER_ID)
                        )}
                    </div>

                    <div className="settings-summary-info">
                        <h2>{profile.NICKNAME}</h2>
                        <p>@{profile.USER_ID}</p>
                    </div>

                    <div className="settings-summary-status">
                        {profile.ACCOUNT_PRIVATE_YN === "Y" ? getPageText("private") : getPageText("public")}
                    </div>
                </section>

                <section className="settings-layout">
                    <aside className="settings-menu-card">
                        <button className={activeSettingTab === "profile" ? "active" : ""} onClick={() => clickMenu("profile")}>
                            {getPageText("menuProfile")}
                        </button>

                        <button onClick={moveStoryManage}>
                            {getPageText("menuStory")}
                        </button>

                        <button className={activeSettingTab === "privacy" ? "active" : ""} onClick={() => clickMenu("privacy")}>
                            {getPageText("menuPrivacy")}
                        </button>

                        <button className={activeSettingTab === "requests" ? "active" : ""} onClick={() => clickMenu("requests")}>
                            {getPageText("menuRequests")}
                            {requestList.length > 0 && <span>{requestList.length}</span>}
                        </button>

                        <button className={activeSettingTab === "followers" ? "active" : ""} onClick={() => clickMenu("followers")}>
                            {getPageText("menuFollowers")}
                        </button>

                        <button className={activeSettingTab === "following" ? "active" : ""} onClick={() => clickMenu("following")}>
                            {getPageText("menuFollowing")}
                        </button>

                        <button className={activeSettingTab === "blocked" ? "active" : ""} onClick={() => clickMenu("blocked")}>
                            {getPageText("menuBlocked")}
                        </button>

                        <button className={activeSettingTab === "notifications" ? "active" : ""} onClick={() => clickMenu("notifications")}>
                            {getPageText("menuNotifications")}
                        </button>

                        <button className={activeSettingTab === "security" ? "active" : ""} onClick={() => clickMenu("security")}>
                            {getPageText("menuAccount")}
                        </button>
                    </aside>

                    <main className="settings-content-card">
                        {activeSettingTab === "profile" && (
                            <div className="settings-section">
                                <h2>{getPageText("sectionProfile")}</h2>

                                <div className="settings-form-grid">
                                    <div className="settings-input-box">
                                        <label>{getPageText("nickname")}</label>
                                        <input
                                            value={editNickname}
                                            onChange={(e) => setEditNickname(e.target.value)}
                                        />
                                    </div>

                                    <div className="settings-input-box">
                                        <label>{getPageText("userType")}</label>
                                        <select
                                            value={editUserType}
                                            onChange={(e) => setEditUserType(e.target.value)}
                                        >
                                            <option value="TRAVELER">Traveler</option>
                                            <option value="LOCAL">Local</option>
                                            <option value="GUIDE">Guide</option>
                                            <option value="BUSINESS">Business</option>
                                        </select>
                                    </div>

                                    <div className="settings-input-box wide">
                                        <label>{getPageText("email")}</label>
                                        <input
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="settings-input-box wide">
                                        <label>{getPageText("bio")}</label>
                                        <textarea
                                            value={editBio}
                                            maxLength={500}
                                            onChange={(e) => setEditBio(e.target.value)}
                                        />
                                        <span className="settings-text-count">{editBio.length}/500</span>
                                    </div>
                                </div>

                                <button className="settings-main-action-btn" onClick={updateProfile}>
                                    {getPageText("save")}
                                </button>
                            </div>
                        )}

                        {activeSettingTab === "privacy" && (
                            <div className="settings-section">
                                <h2>{getPageText("sectionPrivacy")}</h2>

                                <div className="settings-option-card">
                                    <strong>{getPageText("account")}</strong>
                                    <span>{profile.ACCOUNT_PRIVATE_YN === "Y" ? getPageText("private") : getPageText("public")}</span>

                                    <button onClick={togglePrivacy}>
                                        {getPageText("change")}
                                    </button>
                                </div>

                                <div className="settings-option-card">
                                    <strong>{getPageText("savedRoute")}</strong>
                                    <span>{profile.BOOKMARK_PUBLIC_YN === "Y" ? getPageText("public") : getPageText("private")}</span>

                                    <button onClick={toggleBookmarkPrivacy}>
                                        {getPageText("change")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSettingTab === "requests" && (
                            <div className="settings-section">
                                <h2>{getPageText("menuRequests")}</h2>

                                {listLoading && <div className="settings-empty-box">{getPageText("loading")}</div>}

                                {!listLoading && requestList.length === 0 && (
                                    <div className="settings-empty-box">{getPageText("noRequest")}</div>
                                )}

                                {!listLoading && requestList.length > 0 && (
                                    <div className="settings-user-list">
                                        {requestList.map((user) => renderUserCard(user, "request"))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSettingTab === "followers" && (
                            <div className="settings-section">
                                <h2>{getPageText("menuFollowers")}</h2>

                                {followerList.length === 0 ? (
                                    <div className="settings-empty-box">{getPageText("noFollower")}</div>
                                ) : (
                                    <div className="settings-user-list">
                                        {followerList.map((user) => renderUserCard(user, "follower"))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSettingTab === "following" && (
                            <div className="settings-section">
                                <h2>{getPageText("menuFollowing")}</h2>

                                {followingList.length === 0 ? (
                                    <div className="settings-empty-box">{getPageText("noFollowing")}</div>
                                ) : (
                                    <div className="settings-user-list">
                                        {followingList.map((user) => renderUserCard(user, "following"))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSettingTab === "blocked" && (
                            <div className="settings-section">
                                <h2>{getPageText("menuBlocked")}</h2>

                                {blockList.length === 0 ? (
                                    <div className="settings-empty-box">{getPageText("noBlocked")}</div>
                                ) : (
                                    <div className="settings-user-list">
                                        {blockList.map((user) => renderUserCard(user, "block"))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSettingTab === "notifications" && (
                            <div className="settings-section">
                                <h2>{getPageText("menuNotifications")}</h2>

                                {renderToggle(getPageText("notiFollow"), notiFollowYn, setNotiFollowYn)}
                                {renderToggle(getPageText("notiComment"), notiCommentYn, setNotiCommentYn)}
                                {renderToggle(getPageText("notiLike"), notiLikeYn, setNotiLikeYn)}
                                {renderToggle(getPageText("notiChat"), notiChatYn, setNotiChatYn)}

                                <button className="settings-main-action-btn" onClick={updateNotifications}>
                                    {getPageText("save")}
                                </button>
                            </div>
                        )}

                        {activeSettingTab === "security" && (
                            <div className="settings-section">
                                <h2>{getPageText("menuAccount")}</h2>

                                <div className="settings-security-box">
                                    <h3>{getPageText("passwordChange")}</h3>

                                    <div className="settings-form-grid">
                                        <div className="settings-input-box wide">
                                            <label>{getPageText("currentPassword")}</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                            />
                                        </div>

                                        <div className="settings-input-box">
                                            <label>{getPageText("newPassword")}</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>

                                        <div className="settings-input-box">
                                            <label>{getPageText("newPasswordConfirm")}</label>
                                            <input
                                                type="password"
                                                value={newPasswordConfirm}
                                                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button className="settings-main-action-btn" onClick={changePassword}>
                                        {getPageText("changePasswordBtn")}
                                    </button>
                                </div>

                                <div className="settings-security-box">
                                    <h3>{getPageText("logout")}</h3>

                                    <button className="settings-sub-action-btn" onClick={logout}>
                                        {getPageText("logout")}
                                    </button>
                                </div>

                                <div className="settings-security-box danger">
                                    <h3>{getPageText("leaveAccount")}</h3>

                                    <input
                                        type="password"
                                        value={leavePassword}
                                        onChange={(e) => setLeavePassword(e.target.value)}
                                        placeholder={getPageText("passwordPlaceholder")}
                                    />

                                    <button className="settings-danger-btn" onClick={leaveAccount}>
                                        {getPageText("leaveBtn")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </section>
            </div>

            <ScrollTopButton />
        </div>
    );
}

export default ProfileSettings;
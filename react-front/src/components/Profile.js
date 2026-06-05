import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProfileStoryCircle from "./ProfileStoryCircle";
import "./Profile.css";

function Profile() {
    const navigate = useNavigate();

    const { userNo } = useParams();
    const [searchParams] = useSearchParams();

    const loginUserNo = getLoginUserNo();
    const profileUserNo = searchParams.get("userNo") || userNo || loginUserNo;

    const [profile, setProfile] = useState(null);
    const [feedList, setFeedList] = useState([]);
    const [bookmarkList, setBookmarkList] = useState([]);
    const [followerList, setFollowerList] = useState([]);
    const [followingList, setFollowingList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [messageLoading, setMessageLoading] = useState(false);

    const [activeTab, setActiveTab] = useState("feed");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
            return;
        }

        if (!profileUserNo || profileUserNo === "null" || profileUserNo === "undefined") {
            alert("프로필 번호가 없습니다. 다시 로그인해주세요.");
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
    }, [navigate, profileUserNo]);

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
            moveLoginPage("로그인이 필요합니다.");
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
                    alert(data.message || "프로필을 불러오지 못했습니다.");
                    navigate("/home");
                }
            })
            .catch(err => {
                console.error(err);
                alert("프로필 정보를 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function getProfileFeed() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
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
                    alert(data.message || "프로필 피드를 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("프로필 피드를 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setListLoading(false);
            });
    }

    function getBookmarkList() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
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
                    alert(data.message || "비공개 목록입니다.");
                } else {
                    alert(data.message || "저장한 루트를 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("저장한 루트를 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setListLoading(false);
            });
    }

    function getFollowerList() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
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
                    alert(data.message || "팔로워 목록을 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("팔로워 목록을 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setListLoading(false);
            });
    }

    function getFollowingList() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
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
                    alert(data.message || "팔로잉 목록을 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("팔로잉 목록을 불러오는 중 오류가 발생했습니다.");
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
            moveLoginPage("로그인이 필요합니다.");
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
                    alert(data.message || "팔로우 처리에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("팔로우 처리 중 오류가 발생했습니다.");
            });
    }

    function openChatRoom() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
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
                    alert(data.message || "채팅방을 여는 중 오류가 발생했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("채팅방을 여는 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setMessageLoading(false);
            });
    }

    function blockUser() {
        const token = localStorage.getItem("token");

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
            return;
        }

        if (!profile) {
            return;
        }

        if (!window.confirm("이 사용자를 차단할까요? 차단하면 서로의 피드와 프로필 접근이 제한됩니다.")) {
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
                    alert(data.message || "차단 처리에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("차단 처리 중 오류가 발생했습니다.");
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
        const title = safeText(profile.NICKNAME, "K-STEP 여행자") + "님의 프로필";

        if (navigator.share) {
            navigator.share({
                title: title,
                text: title + "을 확인해보세요.",
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert("프로필 링크가 복사되었습니다.");
            })
            .catch(err => {
                console.error(err);
                alert("링크 복사에 실패했습니다.");
            });
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
            return "팔로우";
        }

        if (profile.FOLLOW_YN === "Y") {
            return "팔로잉";
        }

        if (profile.FOLLOW_YN === "P") {
            return "요청됨";
        }

        if (profile.ACCOUNT_PRIVATE_YN === "Y") {
            return "팔로우 요청";
        }

        return "팔로우";
    }

    function getTabTitle() {
        if (activeTab === "feed") {
            return "작성한 여행 피드";
        }

        if (activeTab === "bookmark") {
            return "저장한 여행 루트";
        }

        if (activeTab === "follower") {
            return "팔로워 목록";
        }

        if (activeTab === "following") {
            return "팔로잉 목록";
        }

        return "목록";
    }

    function getTabDesc() {
        if (activeTab === "feed") {
            return isMyProfile()
                ? "내가 작성한 여행 루트 피드입니다."
                : "이 사용자가 작성한 여행 루트 피드입니다.";
        }

        if (activeTab === "bookmark") {
            return isMyProfile()
                ? "나중에 다시 보고 싶은 저장한 여행 루트입니다."
                : "이 사용자가 저장한 여행 루트입니다.";
        }

        if (activeTab === "follower") {
            return isMyProfile()
                ? "나를 팔로우하는 사용자 목록입니다."
                : "이 사용자를 팔로우하는 사용자 목록입니다.";
        }

        if (activeTab === "following") {
            return isMyProfile()
                ? "내가 팔로우하는 사용자 목록입니다."
                : "이 사용자가 팔로우하는 사용자 목록입니다.";
        }

        return "";
    }

    function renderPrivateBox() {
        return (
            <div className="profile-private-box">
                <div className="profile-private-icon">🔒</div>

                <h3>비공개 계정입니다.</h3>

                <p>
                    승인된 팔로워만 이 사용자의 피드와 목록을 볼 수 있습니다.
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
                            {messageLoading ? "연결 중..." : "메시지"}
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
                    목록을 불러오는 중입니다...
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
                                <img src={getImageUrl(feed)} alt={safeText(feed.TITLE, "피드 이미지")} />
                            ) : (
                                <div className="profile-no-image">
                                    K-STEP
                                </div>
                            )}

                            <div className="profile-feed-badge-row">
                                <span>{safeText(feed.AREA, "Korea")}</span>
                                <span>{safeText(feed.CATEGORY, "여행")}</span>
                            </div>
                        </div>

                        <div className="profile-feed-card-body">
                            <h3>{safeText(feed.TITLE, "제목 없음")}</h3>

                            <p>{feed.ROUTE_SUMMARY || feed.CONTENT || "내용이 없습니다."}</p>

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
                    목록을 불러오는 중입니다...
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
                                    alt={safeText(user.NICKNAME, "프로필")}
                                />
                            ) : (
                                getFirstLetter(user.NICKNAME || user.USER_ID)
                            )}
                        </div>

                        <div className="profile-follow-info">
                            <strong>{safeText(user.NICKNAME, "traveler")}</strong>
                            <p>@{safeText(user.USER_ID, "user")} · {safeText(user.USER_TYPE, "TRAVELER")}</p>
                            <span>
                                {safeText(user.BIO, "소개글이 없습니다.")}
                            </span>
                        </div>

                        <div className="profile-follow-count">
                            피드 {user.FEED_COUNT || 0}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <section className="profile-section">
                        프로필 정보를 불러오는 중입니다...
                    </section>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <section className="profile-section">
                        프로필 정보가 없습니다.
                    </section>
                </div>
            </div>
        );
    }

    const canView = isCanView();

    return (
        <div className="profile-page">
            <div className="profile-bg-flower profile-flower-one">✿</div>
            <div className="profile-bg-flower profile-flower-two">❀</div>

            <div className="profile-container">
                <section className="profile-hero-card">
                    <div className="profile-cover-strip">
                        <span>K-STEP PROFILE</span>
                        <strong>{safeText(profile.AREA, "Korea Travel")}</strong>
                    </div>

                    <div className="profile-avatar-box">
                        <ProfileStoryCircle
                            userNo={profile.USER_NO}
                            nickname={profile.NICKNAME || profile.USER_ID}
                            profileImg={profile.PROFILE_IMG}
                        />

                        <div className="profile-type-badge">
                            {safeText(profile.USER_TYPE, "TRAVELER")}
                        </div>

                        <div className={profile.ACCOUNT_PRIVATE_YN === "Y" ? "profile-private-badge private" : "profile-private-badge public"}>
                            {profile.ACCOUNT_PRIVATE_YN === "Y" ? "🔒 비공개 계정" : "🌿 공개 계정"}
                        </div>
                    </div>

                    <div className="profile-info">
                        <div className="profile-name-row">
                            <div>
                                <p className="profile-label">
                                    {isMyProfile() ? "My travel profile" : "Traveler profile"}
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
                                    title="프로필 설정"
                                    aria-label="프로필 설정"
                                >
                                    ⚙
                                </button>
                            )}
                        </div>

                        <p className="profile-bio">
                            {safeText(profile.BIO, "아직 작성된 소개가 없습니다.")}
                        </p>

                        <div className="profile-sns-info-row">
                            <span>✦ 여행 루트 공유</span>
                            <span>✿ 로컬 피드</span>
                            <span>♡ K-STEP SNS</span>
                        </div>

                        <div className="profile-stats">
                            <div
                                className={activeTab === "feed" ? "profile-stat-card clickable active" : "profile-stat-card clickable"}
                                onClick={() => clickTab("feed")}
                            >
                                <strong>{profile.FEED_COUNT || 0}</strong>
                                <span>작성 피드</span>
                            </div>

                            <div
                                className={activeTab === "bookmark" ? "profile-stat-card clickable active" : "profile-stat-card clickable"}
                                onClick={() => clickTab("bookmark")}
                            >
                                <strong>{profile.BOOKMARK_COUNT || 0}</strong>
                                <span>저장한 루트</span>
                            </div>

                            <div
                                className={activeTab === "follower" ? "profile-stat-card clickable active" : "profile-stat-card clickable"}
                                onClick={() => clickTab("follower")}
                            >
                                <strong>{profile.FOLLOWER_COUNT || 0}</strong>
                                <span>팔로워</span>
                            </div>

                            <div
                                className={activeTab === "following" ? "profile-stat-card clickable active" : "profile-stat-card clickable"}
                                onClick={() => clickTab("following")}
                            >
                                <strong>{profile.FOLLOWING_COUNT || 0}</strong>
                                <span>팔로잉</span>
                            </div>
                        </div>

                        <div className="profile-action-row">
                            {isMyProfile() ? (
                                <>
                                    <button className="profile-main-btn" onClick={goCreateFeed}>
                                        + 여행 루트 작성
                                    </button>

                                    <button className="profile-outline-btn" onClick={() => navigate("/story/manage")}>
                                        스토리 관리
                                    </button>

                                    <button className="profile-soft-btn" onClick={goSaved}>
                                        저장함
                                    </button>

                                    <button className="profile-soft-btn" onClick={shareProfile}>
                                        공유
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
                                        {messageLoading ? "연결 중..." : "메시지"}
                                    </button>

                                    <button className="profile-soft-btn" onClick={shareProfile}>
                                        공유
                                    </button>

                                    <button className="profile-danger-outline-btn" onClick={blockUser}>
                                        차단
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
                        renderFeedCardList(feedList, "아직 작성한 피드가 없습니다.")
                    )}

                    {canView && activeTab === "bookmark" && (
                        renderFeedCardList(bookmarkList, "아직 저장한 여행 루트가 없거나 비공개입니다.")
                    )}

                    {canView && activeTab === "follower" && (
                        renderUserList(followerList, "아직 팔로워가 없습니다.")
                    )}

                    {canView && activeTab === "following" && (
                        renderUserList(followingList, "아직 팔로잉한 사용자가 없습니다.")
                    )}
                </section>
            </div>
        </div>
    );
}

export default Profile;
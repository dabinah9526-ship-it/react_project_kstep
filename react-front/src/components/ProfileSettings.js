import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileSettings.css";

function ProfileSettings() {
    const navigate = useNavigate();
    const loginUserNo = localStorage.getItem("userNo");

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
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        getMyProfile();
        getRequestList();
        getFollowerList();
        getFollowingList();
        getBlockList();
    }, [navigate]);

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
                alert("프로필 조회 오류");
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
                alert("요청 목록 조회 오류");
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
                alert("팔로워 조회 오류");
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
                alert("팔로잉 조회 오류");
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
                alert("차단 목록 조회 오류");
            });
    }

    function updateProfile() {
        const token = localStorage.getItem("token");

        if (editNickname.trim() === "") {
            alert("닉네임을 입력해주세요.");
            return;
        }

        if (editBio.length > 500) {
            alert("소개글은 500자 이하로 입력해주세요.");
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
                alert("프로필 수정 오류");
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
                alert("공개 설정 변경 오류");
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
                alert("저장 루트 설정 오류");
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
                alert("알림 저장 오류");
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
                alert("비밀번호 변경 오류");
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

        if (!window.confirm("정말 탈퇴할까요?")) {
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
                alert("회원 탈퇴 오류");
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
                alert("요청 승인 오류");
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
                alert("요청 거절 오류");
            });
    }

    function removeFollower(followerUserNo) {
        const token = localStorage.getItem("token");

        if (!window.confirm("팔로워에서 삭제할까요?")) {
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
                alert("팔로워 삭제 오류");
            });
    }

    function unfollowUser(targetUserNo) {
        const token = localStorage.getItem("token");

        if (!window.confirm("팔로우 취소할까요?")) {
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
                alert("팔로우 취소 오류");
            });
    }

    function unblockUser(targetUserNo) {
        const token = localStorage.getItem("token");

        if (!window.confirm("차단을 해제할까요?")) {
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
                alert("차단 해제 오류");
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
                    {(user.NICKNAME || "K").substring(0, 1).toUpperCase()}
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
                                승인
                            </button>

                            <button className="settings-sub-btn" onClick={() => rejectRequest(user.USER_NO)}>
                                거절
                            </button>
                        </>
                    )}

                    {type === "follower" && (
                        <button className="settings-sub-btn" onClick={() => removeFollower(user.USER_NO)}>
                            삭제
                        </button>
                    )}

                    {type === "following" && (
                        <button className="settings-sub-btn" onClick={() => unfollowUser(user.USER_NO)}>
                            취소
                        </button>
                    )}

                    {type === "block" && (
                        <button className="settings-sub-btn" onClick={() => unblockUser(user.USER_NO)}>
                            해제
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
                    {value === "Y" ? "ON" : "OFF"}
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="settings-page">
                <div className="settings-container">
                    <div className="settings-empty-box">불러오는 중...</div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="settings-page">
                <div className="settings-container">
                    <div className="settings-empty-box">프로필 정보가 없습니다.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-container">
                <div className="settings-top">
                    <button className="settings-back-btn" onClick={() => navigate("/profile/" + loginUserNo)}>
                        ← 프로필
                    </button>

                    <h1>설정</h1>
                </div>

                <section className="settings-summary-card">
                    <div className="settings-summary-avatar">
                        {(profile.NICKNAME || "K").substring(0, 1).toUpperCase()}
                    </div>

                    <div className="settings-summary-info">
                        <h2>{profile.NICKNAME}</h2>
                        <p>@{profile.USER_ID}</p>
                    </div>

                    <div className="settings-summary-status">
                        {profile.ACCOUNT_PRIVATE_YN === "Y" ? "비공개" : "공개"}
                    </div>
                </section>

                <section className="settings-layout">
                    <aside className="settings-menu-card">
                        <button className={activeSettingTab === "profile" ? "active" : ""} onClick={() => clickMenu("profile")}>
                            프로필
                        </button>

                        <button onClick={moveStoryManage}>
                            스토리 관리
                        </button>

                        <button className={activeSettingTab === "privacy" ? "active" : ""} onClick={() => clickMenu("privacy")}>
                            공개 범위
                        </button>

                        <button className={activeSettingTab === "requests" ? "active" : ""} onClick={() => clickMenu("requests")}>
                            팔로우 요청
                            {requestList.length > 0 && <span>{requestList.length}</span>}
                        </button>

                        <button className={activeSettingTab === "followers" ? "active" : ""} onClick={() => clickMenu("followers")}>
                            팔로워
                        </button>

                        <button className={activeSettingTab === "following" ? "active" : ""} onClick={() => clickMenu("following")}>
                            팔로잉
                        </button>

                        <button className={activeSettingTab === "blocked" ? "active" : ""} onClick={() => clickMenu("blocked")}>
                            차단
                        </button>

                        <button className={activeSettingTab === "notifications" ? "active" : ""} onClick={() => clickMenu("notifications")}>
                            알림
                        </button>

                        <button className={activeSettingTab === "security" ? "active" : ""} onClick={() => clickMenu("security")}>
                            계정
                        </button>
                    </aside>

                    <main className="settings-content-card">
                        {activeSettingTab === "profile" && (
                            <div className="settings-section">
                                <h2>프로필</h2>

                                <div className="settings-form-grid">
                                    <div className="settings-input-box">
                                        <label>닉네임</label>
                                        <input
                                            value={editNickname}
                                            onChange={(e) => setEditNickname(e.target.value)}
                                        />
                                    </div>

                                    <div className="settings-input-box">
                                        <label>유형</label>
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
                                        <label>이메일</label>
                                        <input
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="settings-input-box wide">
                                        <label>소개</label>
                                        <textarea
                                            value={editBio}
                                            maxLength={500}
                                            onChange={(e) => setEditBio(e.target.value)}
                                        />
                                        <span className="settings-text-count">{editBio.length}/500</span>
                                    </div>
                                </div>

                                <button className="settings-main-action-btn" onClick={updateProfile}>
                                    저장
                                </button>
                            </div>
                        )}

                        {activeSettingTab === "privacy" && (
                            <div className="settings-section">
                                <h2>공개 범위</h2>

                                <div className="settings-option-card">
                                    <strong>계정</strong>
                                    <span>{profile.ACCOUNT_PRIVATE_YN === "Y" ? "비공개" : "공개"}</span>

                                    <button onClick={togglePrivacy}>
                                        변경
                                    </button>
                                </div>

                                <div className="settings-option-card">
                                    <strong>저장한 루트</strong>
                                    <span>{profile.BOOKMARK_PUBLIC_YN === "Y" ? "공개" : "비공개"}</span>

                                    <button onClick={toggleBookmarkPrivacy}>
                                        변경
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSettingTab === "requests" && (
                            <div className="settings-section">
                                <h2>팔로우 요청</h2>

                                {listLoading && <div className="settings-empty-box">불러오는 중...</div>}

                                {!listLoading && requestList.length === 0 && (
                                    <div className="settings-empty-box">요청이 없습니다.</div>
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
                                <h2>팔로워</h2>

                                {followerList.length === 0 ? (
                                    <div className="settings-empty-box">팔로워가 없습니다.</div>
                                ) : (
                                    <div className="settings-user-list">
                                        {followerList.map((user) => renderUserCard(user, "follower"))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSettingTab === "following" && (
                            <div className="settings-section">
                                <h2>팔로잉</h2>

                                {followingList.length === 0 ? (
                                    <div className="settings-empty-box">팔로잉이 없습니다.</div>
                                ) : (
                                    <div className="settings-user-list">
                                        {followingList.map((user) => renderUserCard(user, "following"))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSettingTab === "blocked" && (
                            <div className="settings-section">
                                <h2>차단</h2>

                                {blockList.length === 0 ? (
                                    <div className="settings-empty-box">차단한 사용자가 없습니다.</div>
                                ) : (
                                    <div className="settings-user-list">
                                        {blockList.map((user) => renderUserCard(user, "block"))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSettingTab === "notifications" && (
                            <div className="settings-section">
                                <h2>알림</h2>

                                {renderToggle("팔로우 요청", notiFollowYn, setNotiFollowYn)}
                                {renderToggle("댓글", notiCommentYn, setNotiCommentYn)}
                                {renderToggle("좋아요", notiLikeYn, setNotiLikeYn)}
                                {renderToggle("채팅", notiChatYn, setNotiChatYn)}

                                <button className="settings-main-action-btn" onClick={updateNotifications}>
                                    저장
                                </button>
                            </div>
                        )}

                        {activeSettingTab === "security" && (
                            <div className="settings-section">
                                <h2>계정</h2>

                                <div className="settings-security-box">
                                    <h3>비밀번호 변경</h3>

                                    <div className="settings-form-grid">
                                        <div className="settings-input-box wide">
                                            <label>현재 비밀번호</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                            />
                                        </div>

                                        <div className="settings-input-box">
                                            <label>새 비밀번호</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>

                                        <div className="settings-input-box">
                                            <label>새 비밀번호 확인</label>
                                            <input
                                                type="password"
                                                value={newPasswordConfirm}
                                                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button className="settings-main-action-btn" onClick={changePassword}>
                                        변경
                                    </button>
                                </div>

                                <div className="settings-security-box">
                                    <h3>로그아웃</h3>

                                    <button className="settings-sub-action-btn" onClick={logout}>
                                        로그아웃
                                    </button>
                                </div>

                                <div className="settings-security-box danger">
                                    <h3>회원 탈퇴</h3>

                                    <input
                                        type="password"
                                        value={leavePassword}
                                        onChange={(e) => setLeavePassword(e.target.value)}
                                        placeholder="비밀번호"
                                    />

                                    <button className="settings-danger-btn" onClick={leaveAccount}>
                                        탈퇴
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </section>
            </div>
        </div>
    );
}

export default ProfileSettings;
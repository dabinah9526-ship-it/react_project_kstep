import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StoryManage.css";

function StoryManage() {
    const navigate = useNavigate();

    const [storyList, setStoryList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [viewerModalOpen, setViewerModalOpen] = useState(false);
    const [viewerList, setViewerList] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        getMyStoryList();
    }, [navigate]);

    function getToken() {
        return localStorage.getItem("token");
    }

    function getMyStoryList() {
        const token = getToken();

        setLoading(true);

        fetch("http://localhost:3010/story/my/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("내 스토리 관리 목록", data);

                if (data.result === "success") {
                    setStoryList(data.list || []);
                } else {
                    alert(data.message || "내 스토리 목록을 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("내 스토리 목록 조회 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setLoading(false);
            });
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

    function getFirstLetter(value) {
        if (!value) {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
    }

    function getRemainText(story) {
        if (!story) {
            return "";
        }

        if (story.ACTIVE_YN !== "Y") {
            return "만료됨";
        }

        const expireDate = new Date(story.EXPIRE_DATE);

        if (Number.isNaN(expireDate.getTime())) {
            return "공개 중";
        }

        const now = new Date();
        const diff = expireDate.getTime() - now.getTime();

        if (diff <= 0) {
            return "만료됨";
        }

        const minute = 1000 * 60;
        const hour = minute * 60;

        if (diff < hour) {
            return Math.ceil(diff / minute) + "분 남음";
        }

        return Math.ceil(diff / hour) + "시간 남음";
    }

    function removeStory(storyNo) {
        if (!storyNo) {
            return;
        }

        if (!window.confirm("스토리를 삭제할까요? 삭제하면 홈과 프로필에서 보이지 않습니다.")) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/story/remove", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                storyNo: storyNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("스토리 삭제", data);

                if (data.result === "success") {
                    alert("스토리가 삭제되었습니다.");
                    getMyStoryList();
                } else {
                    alert(data.message || "스토리 삭제에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("스토리 삭제 중 오류가 발생했습니다.");
            });
    }

    function openViewerList(story) {
        if (!story || !story.STORY_NO) {
            return;
        }

        const token = getToken();

        setSelectedStory(story);

        fetch("http://localhost:3010/story/viewer/list/" + story.STORY_NO, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("스토리 본 사람 목록", data);

                if (data.result === "success") {
                    setViewerList(data.list || []);
                    setViewerModalOpen(true);
                } else {
                    alert(data.message || "본 사람 목록을 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("본 사람 목록 조회 중 오류가 발생했습니다.");
            });
    }

    function closeViewerModal() {
        setViewerModalOpen(false);
        setViewerList([]);
        setSelectedStory(null);
    }

    function goViewerProfile(user) {
        if (!user) {
            return;
        }

        if (!user.USER_NO) {
            alert("사용자 번호가 없어서 프로필로 이동할 수 없습니다.");
            return;
        }

        closeViewerModal();

        // 중요:
        // /profile?userNo=60 이 아니라
        // /profile/60 으로 이동해야 라우터가 찾음
        navigate("/profile/" + user.USER_NO);
    }

    const activeStoryList = storyList.filter(story => story.ACTIVE_YN === "Y");
    const expiredStoryList = storyList.filter(story => story.ACTIVE_YN !== "Y");

    return (
        <div className="story-manage-page">
            <div className="story-manage-bg-flower story-manage-flower-one">✿</div>
            <div className="story-manage-bg-flower story-manage-flower-two">❀</div>

            <div className="story-manage-container">
                <section className="story-manage-header">
                    <div>
                        <p>K-STEP Stories</p>
                        <h1>스토리 관리</h1>
                        <span>내가 올린 스토리, 조회수, 만료 상태를 확인해요.</span>
                    </div>

                    <div className="story-manage-header-actions">
                        <button type="button" className="ghost" onClick={() => navigate(-1)}>
                            뒤로가기
                        </button>

                        <button type="button" onClick={() => navigate("/home")}>
                            홈으로
                        </button>
                    </div>
                </section>

                <section className="story-manage-summary">
                    <div>
                        <strong>{storyList.length}</strong>
                        <span>전체 스토리</span>
                    </div>

                    <div>
                        <strong>{activeStoryList.length}</strong>
                        <span>현재 공개 중</span>
                    </div>

                    <div>
                        <strong>{expiredStoryList.length}</strong>
                        <span>지난 스토리</span>
                    </div>
                </section>

                {loading && (
                    <div className="story-manage-empty">
                        스토리 목록을 불러오는 중입니다...
                    </div>
                )}

                {!loading && storyList.length === 0 && (
                    <div className="story-manage-empty">
                        아직 올린 스토리가 없습니다.
                    </div>
                )}

                {!loading && activeStoryList.length > 0 && (
                    <section className="story-manage-section">
                        <div className="story-manage-section-title">
                            <span>●</span>
                            <div>
                                <h2>현재 공개 중</h2>
                                <p>24시간이 지나기 전까지 홈과 프로필에 보여요.</p>
                            </div>
                        </div>

                        <div className="story-manage-grid">
                            {activeStoryList.map(story => (
                                <article className="story-manage-card active" key={story.STORY_NO}>
                                    <div className="story-manage-image">
                                        <img src={getImageUrl(story.STORY_IMG)} alt="스토리" />

                                        <span className="story-manage-status">
                                            공개 중
                                        </span>
                                    </div>

                                    <div className="story-manage-card-body">
                                        <h3>{story.STORY_CONTENT || "스토리"}</h3>

                                        <p>올린 시간 {story.CDATE_TEXT}</p>
                                        <p>만료 시간 {story.EXPIRE_TEXT}</p>

                                        <div className="story-manage-meta">
                                            <span>{getRemainText(story)}</span>
                                            <button type="button" onClick={() => openViewerList(story)}>
                                                본 사람 {story.VIEW_COUNT || 0}
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            className="story-manage-delete-btn"
                                            onClick={() => removeStory(story.STORY_NO)}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {!loading && expiredStoryList.length > 0 && (
                    <section className="story-manage-section">
                        <div className="story-manage-section-title">
                            <span>○</span>
                            <div>
                                <h2>지난 스토리</h2>
                                <p>24시간이 지나 홈에서는 숨겨진 스토리입니다.</p>
                            </div>
                        </div>

                        <div className="story-manage-grid">
                            {expiredStoryList.map(story => (
                                <article className="story-manage-card expired" key={story.STORY_NO}>
                                    <div className="story-manage-image">
                                        <img src={getImageUrl(story.STORY_IMG)} alt="스토리" />

                                        <span className="story-manage-status">
                                            만료됨
                                        </span>
                                    </div>

                                    <div className="story-manage-card-body">
                                        <h3>{story.STORY_CONTENT || "지난 스토리"}</h3>

                                        <p>올린 시간 {story.CDATE_TEXT}</p>
                                        <p>만료 시간 {story.EXPIRE_TEXT}</p>

                                        <div className="story-manage-meta">
                                            <span>보관됨</span>
                                            <button type="button" onClick={() => openViewerList(story)}>
                                                본 사람 {story.VIEW_COUNT || 0}
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            className="story-manage-delete-btn"
                                            onClick={() => removeStory(story.STORY_NO)}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {viewerModalOpen && (
                <div className="story-viewer-modal-bg" onClick={closeViewerModal}>
                    <div className="story-viewer-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="story-viewer-modal-head">
                            <div>
                                <h2>스토리 본 사람</h2>
                                <p>
                                    {selectedStory ? selectedStory.CDATE_TEXT : ""}
                                </p>
                            </div>

                            <button type="button" onClick={closeViewerModal}>
                                ×
                            </button>
                        </div>

                        <div className="story-viewer-user-list">
                            {viewerList.length === 0 && (
                                <div className="story-viewer-empty">
                                    아직 본 사람이 없습니다.
                                </div>
                            )}

                            {viewerList.map(user => (
                                <div
                                    className="story-viewer-user-item"
                                    key={user.VIEW_NO}
                                    onClick={() => goViewerProfile(user)}
                                    style={{
                                        cursor: "pointer"
                                    }}
                                >
                                    <div className="story-viewer-user-avatar">
                                        {getImageUrl(user.PROFILE_IMG) !== "" ? (
                                            <img src={getImageUrl(user.PROFILE_IMG)} alt={user.NICKNAME} />
                                        ) : (
                                            <span>{getFirstLetter(user.NICKNAME || user.USER_ID)}</span>
                                        )}
                                    </div>

                                    <div>
                                        <strong>{user.NICKNAME || "traveler"}</strong>
                                        <p>@{user.USER_ID} · {user.VIEW_DATE_TEXT}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StoryManage;
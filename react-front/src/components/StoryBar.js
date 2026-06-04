import { useEffect, useRef, useState } from "react";
import "./StoryBar.css";

function StoryBar() {
    const fileInputRef = useRef(null);

    const [storyUserList, setStoryUserList] = useState([]);
    const [storyList, setStoryList] = useState([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [progressKey, setProgressKey] = useState(0);

    useEffect(() => {
        getStoryUserList();
    }, []);

    useEffect(() => {
        if (!viewerOpen) {
            return;
        }

        if (storyList.length === 0) {
            return;
        }

        const currentStory = storyList[selectedStoryIndex];

        if (!currentStory || !currentStory.STORY_NO) {
            return;
        }

        markStoryView(currentStory.STORY_NO);
        setProgressKey(prev => prev + 1);
    }, [viewerOpen, selectedStoryIndex, storyList]);

    function getToken() {
        return localStorage.getItem("token");
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

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
    }

    function getStoryTimeText(story) {
        if (!story) {
            return "";
        }

        const dateValue = story.CDATE || story.CDATE_TEXT;

        if (!dateValue) {
            return "";
        }

        let targetDate;

        if (typeof dateValue === "string") {
            targetDate = new Date(dateValue.replace(" ", "T"));
        } else {
            targetDate = new Date(dateValue);
        }

        if (Number.isNaN(targetDate.getTime())) {
            return story.CDATE_TEXT || "";
        }

        const now = new Date();
        const diff = now.getTime() - targetDate.getTime();

        if (diff < 0) {
            return story.CDATE_TEXT || "";
        }

        const minute = 1000 * 60;
        const hour = minute * 60;
        const day = hour * 24;

        if (diff < minute) {
            return "방금 전";
        }

        if (diff < hour) {
            return Math.floor(diff / minute) + "분 전";
        }

        if (diff < day) {
            return Math.floor(diff / hour) + "시간 전";
        }

        return Math.floor(diff / day) + "일 전";
    }

    function getStoryUserList() {
        const token = getToken();

        fetch("http://localhost:3010/story/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("스토리 유저 목록", data);

                if (data.result === "success") {
                    setStoryUserList(data.list || []);
                } else {
                    alert(data.message || "스토리 목록을 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("스토리 목록 조회 중 오류가 발생했습니다.");
            });
    }

    function openFilePicker() {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    function uploadStory(e) {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("이미지 파일만 업로드할 수 있습니다.");
            e.target.value = "";
            return;
        }

        const token = getToken();
        const formData = new FormData();

        formData.append("storyImage", file);
        formData.append("content", "");

        setUploading(true);

        fetch("http://localhost:3010/story/add", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                console.log("스토리 등록 결과", data);

                if (data.result === "success") {
                    alert("스토리가 등록되었습니다.");
                    getStoryUserList();
                } else {
                    alert(data.message || "스토리 등록에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("스토리 등록 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setUploading(false);
                e.target.value = "";
            });
    }

    function openStory(user) {
        if (!user) {
            return;
        }

        if ((user.STORY_COUNT || 0) === 0) {
            if (user.MINE_YN === "Y") {
                openFilePicker();
            }

            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/story/user/" + user.USER_NO, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("유저 스토리 목록", data);

                if (data.result === "success") {
                    const list = data.list || [];

                    if (list.length === 0) {
                        alert("볼 수 있는 스토리가 없습니다.");
                        getStoryUserList();
                        return;
                    }

                    setSelectedUser(user);
                    setStoryList(list);
                    setSelectedStoryIndex(0);
                    setViewerOpen(true);
                } else {
                    alert(data.message || "스토리를 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("스토리를 불러오는 중 오류가 발생했습니다.");
            });
    }

    function closeStoryViewer() {
        setViewerOpen(false);
        setSelectedUser(null);
        setStoryList([]);
        setSelectedStoryIndex(0);
        getStoryUserList();
    }

    function nextStory() {
        if (storyList.length === 0) {
            closeStoryViewer();
            return;
        }

        if (selectedStoryIndex >= storyList.length - 1) {
            closeStoryViewer();
            return;
        }

        setSelectedStoryIndex(selectedStoryIndex + 1);
    }

    function prevStory() {
        if (storyList.length === 0) {
            return;
        }

        if (selectedStoryIndex <= 0) {
            return;
        }

        setSelectedStoryIndex(selectedStoryIndex - 1);
    }

    function markStoryView(storyNo) {
        const token = getToken();

        fetch("http://localhost:3010/story/view", {
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
                console.log("스토리 읽음 처리", data);

                if (data.result === "success") {
                    getStoryUserList();
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    function removeStory(storyNo) {
        if (!storyNo) {
            return;
        }

        if (!window.confirm("스토리를 삭제할까요?")) {
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
                console.log("스토리 삭제 결과", data);

                if (data.result === "success") {
                    alert("스토리가 삭제되었습니다.");
                    closeStoryViewer();
                    getStoryUserList();
                } else {
                    alert(data.message || "스토리 삭제에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("스토리 삭제 중 오류가 발생했습니다.");
            });
    }

    const currentStory = storyList.length > 0 ? storyList[selectedStoryIndex] : null;

    return (
        <>
            <section className="story-section">
                <div className="story-section-head">
                    <div>
                        <p>K-STEP Stories</p>
                        <h2>여행 스토리</h2>
                    </div>

                    <button
                        type="button"
                        onClick={openFilePicker}
                        disabled={uploading}
                    >
                        {uploading ? "업로드 중..." : "+ 스토리 올리기"}
                    </button>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="story-hidden-input"
                    onChange={uploadStory}
                />

                <div className="story-list">
                    {storyUserList.length === 0 && (
                        <button
                            type="button"
                            className="story-item empty"
                            onClick={openFilePicker}
                        >
                            <div className="story-avatar-wrap">
                                <div className="story-avatar">
                                    <span>내</span>
                                </div>

                                <span className="story-add-badge">+</span>
                            </div>

                            <strong>내 스토리</strong>
                        </button>
                    )}

                    {storyUserList.map(user => (
                        <button
                            type="button"
                            key={user.USER_NO}
                            className={
                                (user.STORY_COUNT || 0) > 0
                                    ? user.ALL_VIEW_YN === "Y"
                                        ? "story-item viewed"
                                        : "story-item active"
                                    : "story-item empty"
                            }
                            onClick={() => openStory(user)}
                        >
                            <div className="story-avatar-wrap">
                                <div className="story-avatar">
                                    {getImageUrl(user.PROFILE_IMG) !== "" ? (
                                        <img
                                            src={getImageUrl(user.PROFILE_IMG)}
                                            alt={safeText(user.NICKNAME, "프로필")}
                                        />
                                    ) : (
                                        <span>{getFirstLetter(user.NICKNAME || user.USER_ID)}</span>
                                    )}
                                </div>

                                {user.MINE_YN === "Y" && (
                                    <span
                                        className="story-add-badge"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openFilePicker();
                                        }}
                                    >
                                        +
                                    </span>
                                )}
                            </div>

                            <strong>
                                {user.MINE_YN === "Y" ? "내 스토리" : safeText(user.NICKNAME, "traveler")}
                            </strong>
                        </button>
                    ))}
                </div>
            </section>

            {viewerOpen && currentStory && (
                <div className="story-viewer-bg" onClick={closeStoryViewer}>
                    <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
                        <div className="story-progress-row">
                            {storyList.map((story, index) => (
                                <div className="story-progress-track" key={story.STORY_NO || index}>
                                    {index < selectedStoryIndex && (
                                        <span className="done"></span>
                                    )}

                                    {index === selectedStoryIndex && (
                                        <span
                                            key={currentStory.STORY_NO + "-" + progressKey}
                                            className="story-progress-fill"
                                            onAnimationEnd={nextStory}
                                        ></span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="story-viewer-head">
                            <div className="story-viewer-profile">
                                <div className="story-viewer-avatar">
                                    {getImageUrl(currentStory.PROFILE_IMG) !== "" ? (
                                        <img
                                            src={getImageUrl(currentStory.PROFILE_IMG)}
                                            alt={safeText(currentStory.NICKNAME, "프로필")}
                                        />
                                    ) : (
                                        <span>{getFirstLetter(currentStory.NICKNAME || currentStory.USER_ID)}</span>
                                    )}
                                </div>

                                <div className="story-viewer-user-text">
                                    <strong>{safeText(currentStory.NICKNAME, "traveler")}</strong>
                                    <p>{getStoryTimeText(currentStory)}</p>
                                </div>
                            </div>

                            <button type="button" onClick={closeStoryViewer}>
                                ×
                            </button>
                        </div>

                        <div className="story-viewer-image-box">
                            <button
                                type="button"
                                className="story-click-zone left"
                                onClick={prevStory}
                            ></button>

                            <img
                                src={getImageUrl(currentStory.STORY_IMG)}
                                alt="스토리"
                            />

                            <button
                                type="button"
                                className="story-click-zone right"
                                onClick={nextStory}
                            ></button>
                        </div>

                        {currentStory.STORY_CONTENT && (
                            <div className="story-viewer-caption">
                                {currentStory.STORY_CONTENT}
                            </div>
                        )}

                        {currentStory.MINE_YN === "Y" && (
                            <button
                                type="button"
                                className="story-delete-btn"
                                onClick={() => removeStory(currentStory.STORY_NO)}
                            >
                                삭제
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default StoryBar;
import { useEffect, useRef, useState } from "react";
import "./ProfileStoryCircle.css";

function ProfileStoryCircle({ userNo, nickname, profileImg }) {
    const fileInputRef = useRef(null);

    const [hasStoryYn, setHasStoryYn] = useState("N");
    const [allViewYn, setAllViewYn] = useState("Y");
    const [storyList, setStoryList] = useState([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
    const [progressKey, setProgressKey] = useState(0);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (userNo) {
            getStoryStatus();
        }
    }, [userNo]);

    useEffect(() => {
        if (!viewerOpen) {
            return;
        }

        if (storyList.length === 0) {
            return;
        }

        const story = storyList[selectedStoryIndex];

        if (story && story.STORY_NO) {
            markStoryView(story.STORY_NO);
            setProgressKey(prev => prev + 1);
        }
    }, [viewerOpen, selectedStoryIndex, storyList]);

    function getToken() {
        return localStorage.getItem("token");
    }

    function getLoginUserNo() {
        const savedUserNo =
            localStorage.getItem("userNo") ||
            localStorage.getItem("USER_NO") ||
            localStorage.getItem("loginUserNo");

        if (savedUserNo) {
            return savedUserNo;
        }

        const token = getToken();

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

    function isMine() {
        return String(getLoginUserNo()) === String(userNo);
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

    function getStoryStatus() {
        const token = getToken();

        fetch("http://localhost:3010/story/profile/" + userNo + "/status", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("프로필 스토리 상태", data);

                if (data.result === "success") {
                    setHasStoryYn(data.hasStoryYn || "N");
                    setAllViewYn(data.allViewYn || "Y");
                }
            })
            .catch(err => {
                console.error(err);
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
                console.log("프로필 스토리 등록 결과", data);

                if (data.result === "success") {
                    alert("스토리가 등록되었습니다.");
                    getStoryStatus();
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

    function openStory() {
        if (hasStoryYn !== "Y") {
            if (isMine()) {
                openFilePicker();
            }

            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/story/user/" + userNo, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("프로필 유저 스토리 목록", data);

                if (data.result === "success") {
                    const list = data.list || [];

                    if (list.length === 0) {
                        getStoryStatus();
                        return;
                    }

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
        setStoryList([]);
        setSelectedStoryIndex(0);
        getStoryStatus();
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
                console.log("프로필 스토리 읽음 처리", data);

                if (data.result === "success") {
                    getStoryStatus();
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
                console.log("프로필 스토리 삭제 결과", data);

                if (data.result === "success") {
                    alert("스토리가 삭제되었습니다.");
                    closeStoryViewer();
                    getStoryStatus();
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
            <div
                className={
                    hasStoryYn === "Y"
                        ? allViewYn === "Y"
                            ? "profile-story-circle viewed"
                            : "profile-story-circle active"
                        : "profile-story-circle empty"
                }
                onClick={openStory}
            >
                <div className="profile-story-image">
                    {getImageUrl(profileImg) !== "" ? (
                        <img
                            src={getImageUrl(profileImg)}
                            alt={safeText(nickname, "프로필")}
                        />
                    ) : (
                        <span>{getFirstLetter(nickname)}</span>
                    )}
                </div>

                {isMine() && (
                    <button
                        type="button"
                        className="profile-story-add-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            openFilePicker();
                        }}
                        disabled={uploading}
                    >
                        +
                    </button>
                )}

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="profile-story-hidden-input"
                    onChange={uploadStory}
                />
            </div>

            {viewerOpen && currentStory && (
                <div className="profile-story-viewer-bg" onClick={closeStoryViewer}>
                    <div className="profile-story-viewer" onClick={(e) => e.stopPropagation()}>
                        <div className="profile-story-progress-row">
                            {storyList.map((story, index) => (
                                <div className="profile-story-progress-track" key={story.STORY_NO || index}>
                                    {index < selectedStoryIndex && (
                                        <span className="done"></span>
                                    )}

                                    {index === selectedStoryIndex && (
                                        <span
                                            key={currentStory.STORY_NO + "-" + progressKey}
                                            className="profile-story-progress-fill"
                                            onAnimationEnd={nextStory}
                                        ></span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="profile-story-viewer-head">
                            <div className="profile-story-viewer-profile">
                                <div className="profile-story-viewer-avatar">
                                    {getImageUrl(currentStory.PROFILE_IMG) !== "" ? (
                                        <img
                                            src={getImageUrl(currentStory.PROFILE_IMG)}
                                            alt={safeText(currentStory.NICKNAME, "프로필")}
                                        />
                                    ) : (
                                        <span>{getFirstLetter(currentStory.NICKNAME || currentStory.USER_ID)}</span>
                                    )}
                                </div>

                                <div className="profile-story-viewer-user-text">
                                    <strong>{safeText(currentStory.NICKNAME, "traveler")}</strong>
                                    <p>{getStoryTimeText(currentStory)}</p>
                                </div>
                            </div>

                            <button type="button" onClick={closeStoryViewer}>
                                ×
                            </button>
                        </div>

                        <div className="profile-story-viewer-image-box">
                            <button
                                type="button"
                                className="profile-story-click-zone left"
                                onClick={prevStory}
                            ></button>

                            <img
                                src={getImageUrl(currentStory.STORY_IMG)}
                                alt="스토리"
                            />

                            <button
                                type="button"
                                className="profile-story-click-zone right"
                                onClick={nextStory}
                            ></button>
                        </div>

                        {currentStory.STORY_CONTENT && (
                            <div className="profile-story-viewer-caption">
                                {currentStory.STORY_CONTENT}
                            </div>
                        )}

                        {(currentStory.MINE_YN === "Y" || isMine()) && (
                            <button
                                type="button"
                                className="profile-story-delete-btn"
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

export default ProfileStoryCircle;
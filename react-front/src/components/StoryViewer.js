import { useEffect, useRef, useState } from "react";
import "./StoryBar.css";

function StoryViewer({ storyGroup, startIndex, onClose, getImageUrlByValue, onStoryChanged, onStoryViewed }) {
    const storyDuration = 5000;

    const [currentIndex, setCurrentIndex] = useState(startIndex || 0);
    const [imageFitMode, setImageFitMode] = useState("cover");

    const [isPaused, setIsPaused] = useState(false);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerList, setViewerList] = useState([]);
    const [viewerLoading, setViewerLoading] = useState(false);

    const storyList = storyGroup && storyGroup.STORY_LIST ? storyGroup.STORY_LIST : [];
    const currentStory = storyList[currentIndex];

    const progressFillRef = useRef(null);
    const animationRef = useRef(null);
    const startedTimeRef = useRef(0);
    const elapsedTimeRef = useRef(0);

    useEffect(() => {
        if (!currentStory) {
            return;
        }

        setViewerOpen(false);
        setViewerList([]);
        setImageFitMode("cover");

        resetProgressBar();
        markStoryView(currentStory.STORY_NO);

        if (isMyStory()) {
            getViewerList(currentStory.STORY_NO);
        }
    }, [currentIndex, currentStory]);

    useEffect(() => {
        if (!currentStory) {
            return;
        }

        if (isPaused || viewerOpen) {
            stopProgressBar();
            return;
        }

        startProgressBar();

        return () => {
            stopProgressBar();
        };
    }, [currentIndex, currentStory, isPaused, viewerOpen]);

    function getToken() {
        return localStorage.getItem("token");
    }

    function isMyStory() {
        if (!currentStory) {
            return false;
        }

        if (currentStory.MINE_YN === "Y") {
            return true;
        }

        if (storyGroup && storyGroup.MINE_YN === "Y") {
            return true;
        }

        return false;
    }

    function resetProgressBar() {
        stopProgressBar();
        elapsedTimeRef.current = 0;
        startedTimeRef.current = 0;

        if (progressFillRef.current) {
            progressFillRef.current.style.width = "0%";
        }
    }

    function stopProgressBar() {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        if (startedTimeRef.current > 0) {
            elapsedTimeRef.current += Date.now() - startedTimeRef.current;
            startedTimeRef.current = 0;
        }
    }

    function startProgressBar() {
        stopProgressBar();

        startedTimeRef.current = Date.now();

        function animate() {
            const elapsed = elapsedTimeRef.current + (Date.now() - startedTimeRef.current);
            const percent = Math.min((elapsed / storyDuration) * 100, 100);

            if (progressFillRef.current) {
                progressFillRef.current.style.width = percent + "%";
            }

            if (percent >= 100) {
                elapsedTimeRef.current = 0;
                startedTimeRef.current = 0;

                if (currentIndex < storyList.length - 1) {
                    setCurrentIndex(prevIndex => prevIndex + 1);
                } else {
                    onClose();
                }

                return;
            }

            animationRef.current = requestAnimationFrame(animate);
        }

        animationRef.current = requestAnimationFrame(animate);
    }

    function markStoryView(storyNo) {
        const token = getToken();

        if (!storyNo) {
            return;
        }

        if (onStoryViewed) {
            onStoryViewed(storyNo);
        }

        if (!token) {
            return;
        }

        fetch("http://localhost:3010/story/view/add", {
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
                    if (onStoryChanged) {
                        onStoryChanged();
                    }
                }
            })
            .catch(err => {
                console.error("스토리 읽음 처리 실패", err);
            });
    }

    function getViewerList(storyNo) {
        const token = getToken();

        if (!token || !storyNo) {
            return;
        }

        setViewerLoading(true);

        fetch("http://localhost:3010/story/viewer/list", {
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
                console.log("스토리 본 사람 목록", data);

                if (data.result === "success") {
                    setViewerList(data.list || []);
                } else {
                    console.log(data.message);
                    setViewerList([]);
                }
            })
            .catch(err => {
                console.error(err);
                setViewerList([]);
            })
            .finally(() => {
                setViewerLoading(false);
            });
    }

    function removeStory(e) {
        e.stopPropagation();

        if (!currentStory) {
            return;
        }

        if (!window.confirm("이 스토리를 삭제할까요?")) {
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
                storyNo: currentStory.STORY_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("스토리 삭제", data);

                if (data.result === "success") {
                    if (onStoryChanged) {
                        onStoryChanged();
                    }

                    onClose();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("스토리 삭제 중 오류가 발생했습니다.");
            });
    }

    function prevStory(e) {
        e.stopPropagation();

        resetProgressBar();

        if (currentIndex <= 0) {
            return;
        }

        setCurrentIndex(currentIndex - 1);
    }

    function nextStory(e) {
        e.stopPropagation();

        resetProgressBar();

        if (currentIndex >= storyList.length - 1) {
            onClose();
            return;
        }

        setCurrentIndex(currentIndex + 1);
    }

    function closeViewer(e) {
        e.stopPropagation();
        onClose();
    }

    function openViewerList(e) {
        e.stopPropagation();

        if (!isMyStory()) {
            return;
        }

        setIsPaused(true);

        if (currentStory) {
            getViewerList(currentStory.STORY_NO);
        }

        setViewerOpen(true);
    }

    function closeViewerList(e) {
        e.stopPropagation();
        setViewerOpen(false);
        setIsPaused(false);
    }

    function pauseStory() {
        setIsPaused(true);
    }

    function resumeStory() {
        setIsPaused(false);
    }

    function getStoryImageUrl() {
        if (!currentStory) {
            return "";
        }

        const imageValue =
            currentStory.STORY_IMG ||
            currentStory.IMG_URL ||
            currentStory.IMAGE_URL ||
            currentStory.FILE_URL ||
            "";

        if (!imageValue) {
            return "";
        }

        return getImageUrlByValue(imageValue);
    }

    function getProfileImageUrl(value) {
        if (!value) {
            return "";
        }

        return getImageUrlByValue(value);
    }

    function getStoryProfileImageUrl() {
        const imageValue =
            currentStory?.PROFILE_IMG ||
            storyGroup?.PROFILE_IMG ||
            "";

        return getProfileImageUrl(imageValue);
    }

    function getStoryText() {
        if (!currentStory) {
            return "";
        }

        return currentStory.STORY_TEXT ||
            currentStory.CONTENT ||
            currentStory.TEXT ||
            "";
    }

    function getWriterName() {
        return currentStory?.NICKNAME ||
            storyGroup?.NICKNAME ||
            currentStory?.USER_ID ||
            storyGroup?.USER_ID ||
            "traveler";
    }

    function getFirstLetter(value) {
        if (!value) {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
    }

    function getDateText(value) {
        if (!value) {
            return "";
        }

        if (String(value).includes("-") && String(value).includes(":")) {
            return String(value).substring(0, 16);
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");

        return year + "-" + month + "-" + day + " " + hour + ":" + minute;
    }

    function onImageLoad(e) {
        const img = e.target;
        const ratio = img.naturalWidth / img.naturalHeight;

        if (ratio > 0.85) {
            setImageFitMode("soft-contain");
        } else {
            setImageFitMode("cover");
        }
    }

    function getProgressClass(index) {
        if (index < currentIndex) {
            return "story-progress-track done";
        }

        if (index === currentIndex) {
            return isPaused ? "story-progress-track active paused" : "story-progress-track active";
        }

        return "story-progress-track";
    }

    function getProgressFill(index) {
        if (index < currentIndex) {
            return <i style={{ width: "100%" }}></i>;
        }

        if (index === currentIndex) {
            return <i ref={progressFillRef} style={{ width: "0%" }}></i>;
        }

        return <i style={{ width: "0%" }}></i>;
    }

    if (!storyGroup || storyList.length === 0 || !currentStory) {
        return (
            <div className="story-viewer-bg" onClick={onClose}>
                <div className="story-viewer-modal empty" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        className="story-viewer-alone-close"
                        onClick={closeViewer}
                    >
                        ×
                    </button>

                    <div className="story-viewer-empty">
                        <strong>스토리가 없습니다.</strong>
                        <p>다시 시도해주세요.</p>
                    </div>
                </div>
            </div>
        );
    }

    const storyImageUrl = getStoryImageUrl();
    const profileImageUrl = getStoryProfileImageUrl();
    const storyText = getStoryText();

    return (
        <div className="story-viewer-bg" onClick={onClose}>
            <div
                className="story-viewer-modal"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={pauseStory}
                onMouseUp={resumeStory}
                onMouseLeave={resumeStory}
                onTouchStart={pauseStory}
                onTouchEnd={resumeStory}
            >
                <div className="story-viewer-progress">
                    {storyList.map((story, index) => (
                        <span
                            key={story.STORY_NO || index}
                            className={getProgressClass(index)}
                        >
                            {getProgressFill(index)}
                        </span>
                    ))}
                </div>

                <div className={imageFitMode === "soft-contain" ? "story-viewer-image soft-contain" : "story-viewer-image cover"}>
                    {storyImageUrl !== "" ? (
                        <>
                            <img
                                className="story-viewer-bg-photo"
                                src={storyImageUrl}
                                alt=""
                            />

                            <div className="story-viewer-main-photo-wrap">
                                <img
                                    className="story-viewer-main-photo"
                                    src={storyImageUrl}
                                    alt="스토리 이미지"
                                    onLoad={onImageLoad}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="story-viewer-text-only">
                            <span>✿</span>
                            <p>{storyText || "스토리"}</p>
                        </div>
                    )}
                </div>

                <div className="story-viewer-top-gradient"></div>
                <div className="story-viewer-bottom-gradient"></div>

                <div className="story-viewer-header">
                    <div className="story-viewer-avatar">
                        {profileImageUrl !== "" ? (
                            <img src={profileImageUrl} alt="프로필" />
                        ) : (
                            <span>{getFirstLetter(getWriterName())}</span>
                        )}
                    </div>

                    <div className="story-viewer-info">
                        <strong>{getWriterName()}</strong>
                        <p>{currentStory.CDATE_TEXT || getDateText(currentStory.CDATE)}</p>
                    </div>

                    <button
                        type="button"
                        className="story-viewer-close"
                        onClick={closeViewer}
                    >
                        ×
                    </button>
                </div>

                {isMyStory() && (
                    <button
                        type="button"
                        className="story-viewer-delete-btn"
                        onClick={removeStory}
                    >
                        삭제
                    </button>
                )}

                {storyText !== "" && (
                    <div className="story-viewer-caption">
                        {storyText}
                    </div>
                )}

                {isMyStory() && (
                    <button
                        type="button"
                        className="story-viewer-seen-btn"
                        onClick={openViewerList}
                    >
                        👁 본 사람 {currentStory.VIEWER_COUNT || viewerList.length || 0}
                    </button>
                )}

                {currentIndex > 0 && (
                    <button
                        type="button"
                        className="story-viewer-arrow prev"
                        onClick={prevStory}
                    >
                        ‹
                    </button>
                )}

                {storyList.length > 1 && (
                    <button
                        type="button"
                        className="story-viewer-arrow next"
                        onClick={nextStory}
                    >
                        ›
                    </button>
                )}

                {viewerOpen && (
                    <div className="story-viewer-list-bg" onClick={closeViewerList}>
                        <div className="story-viewer-list-sheet" onClick={(e) => e.stopPropagation()}>
                            <div className="story-viewer-list-head">
                                <div>
                                    <p>Story Views</p>
                                    <h3>본 사람</h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeViewerList}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="story-viewer-list-body">
                                {viewerLoading && (
                                    <div className="story-viewer-list-empty">
                                        본 사람을 불러오는 중입니다...
                                    </div>
                                )}

                                {!viewerLoading && viewerList.length === 0 && (
                                    <div className="story-viewer-list-empty">
                                        아직 이 스토리를 본 사람이 없습니다.
                                    </div>
                                )}

                                {!viewerLoading && viewerList.map(viewer => (
                                    <div className="story-viewer-list-item" key={viewer.VIEW_NO}>
                                        <div className="story-viewer-list-avatar">
                                            {viewer.PROFILE_IMG ? (
                                                <img
                                                    src={getProfileImageUrl(viewer.PROFILE_IMG)}
                                                    alt={viewer.NICKNAME}
                                                />
                                            ) : (
                                                <span>{getFirstLetter(viewer.NICKNAME || viewer.USER_ID)}</span>
                                            )}
                                        </div>

                                        <div>
                                            <strong>{viewer.NICKNAME || viewer.USER_ID || "traveler"}</strong>
                                            <p>{viewer.USER_TYPE || "TRAVELER"} · {viewer.CDATE_TEXT}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StoryViewer;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StoryViewer.css";

function StoryViewer({ storyGroup, startIndex, onClose, getImageUrlByValue }) {
    const navigate = useNavigate();

    const [storyList, setStoryList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const [viewerList, setViewerList] = useState([]);
    const [viewerSheetOpen, setViewerSheetOpen] = useState(false);
    const [viewerLoading, setViewerLoading] = useState(false);

    useEffect(() => {
        if (!storyGroup || !storyGroup.STORY_LIST) {
            return;
        }

        setStoryList(storyGroup.STORY_LIST);
        setCurrentIndex(startIndex || 0);
        setProgress(0);
        setViewerList([]);
        setViewerSheetOpen(false);
    }, [storyGroup, startIndex]);

    const currentStory = storyList[currentIndex];

    useEffect(() => {
        if (!currentStory) {
            return;
        }

        setProgress(0);
        setViewerSheetOpen(false);

        if (isMyStory(currentStory)) {
            getViewerList(currentStory);
        } else {
            readStory(currentStory);
        }
    }, [currentIndex, currentStory && currentStory.STORY_NO]);

    useEffect(() => {
        if (!currentStory) {
            return;
        }

        if (viewerSheetOpen) {
            return;
        }

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    nextStory();
                    return 0;
                }

                return prev + 2;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [currentIndex, currentStory, viewerSheetOpen]);

    function getToken() {
        return localStorage.getItem("token");
    }

    function getLoginUserNo() {
        return (
            localStorage.getItem("userNo") ||
            localStorage.getItem("USER_NO") ||
            localStorage.getItem("loginUserNo") ||
            ""
        );
    }

    function isMyStory(story) {
        const loginUserNo = getLoginUserNo();

        if (!storyGroup || !story) {
            return false;
        }

        if (String(story.USER_NO) === String(loginUserNo)) {
            return true;
        }

        if (String(storyGroup.USER_NO) === String(loginUserNo)) {
            return true;
        }

        if (story.MINE_YN === "Y") {
            return true;
        }

        if (storyGroup.MINE_YN === "Y") {
            return true;
        }

        return false;
    }

    function getFirstLetter(value) {
        if (!value) {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
    }

    function getImageUrl(value) {
        if (!value) {
            return "";
        }

        if (getImageUrlByValue) {
            return getImageUrlByValue(value);
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

    function readStory(story) {
        if (!story || !story.STORY_NO) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/story/view", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                storyNo: story.STORY_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("스토리 읽음 처리", data);

                if (data.result === "success") {
                    setStoryList(prevList =>
                        prevList.map(item => {
                            if (String(item.STORY_NO) === String(story.STORY_NO)) {
                                return {
                                    ...item,
                                    VIEW_YN: "Y",
                                    VIEW_COUNT: data.viewCount
                                };
                            }

                            return item;
                        })
                    );
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    function getViewerList(story) {
        if (!story || !story.STORY_NO) {
            return;
        }

        const token = getToken();

        setViewerLoading(true);

        fetch("http://localhost:3010/story/viewer/list/" + story.STORY_NO, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("홈 스토리 본 사람 목록", data);

                if (data.result === "success") {
                    const list = data.list || [];

                    setViewerList(list);

                    setStoryList(prevList =>
                        prevList.map(item => {
                            if (String(item.STORY_NO) === String(story.STORY_NO)) {
                                return {
                                    ...item,
                                    VIEW_COUNT: list.length
                                };
                            }

                            return item;
                        })
                    );
                } else {
                    console.log(data.message || "본 사람 목록을 불러오지 못했습니다.");
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

    function prevStory() {
        if (currentIndex <= 0) {
            return;
        }

        setCurrentIndex(currentIndex - 1);
    }

    function nextStory() {
        if (currentIndex >= storyList.length - 1) {
            onClose();
            return;
        }

        setCurrentIndex(currentIndex + 1);
    }

    function openViewerSheet(e) {
        e.stopPropagation();

        if (!currentStory) {
            return;
        }

        if (!isMyStory(currentStory)) {
            return;
        }

        getViewerList(currentStory);
        setViewerSheetOpen(true);
    }

    function closeViewerSheet(e) {
        e.stopPropagation();
        setViewerSheetOpen(false);
    }

    function moveProfile(e, userNo) {
        e.stopPropagation();

        if (!userNo) {
            return;
        }

        onClose();
        navigate("/profile/" + userNo);
    }

    if (!storyGroup || !currentStory) {
        return null;
    }

    const isMine = isMyStory(currentStory);
    const viewerCount = currentStory.VIEW_COUNT || viewerList.length || 0;

    console.log("스토리 뷰어 현재 스토리", {
        loginUserNo: getLoginUserNo(),
        storyGroupUserNo: storyGroup.USER_NO,
        storyUserNo: currentStory.USER_NO,
        storyMineYn: currentStory.MINE_YN,
        groupMineYn: storyGroup.MINE_YN,
        isMine: isMine
    });

    return (
        <div className="story-viewer-bg">
            <div className="story-viewer-wrap">
                <div className="story-viewer-progress-row">
                    {storyList.map((story, index) => (
                        <div className="story-viewer-progress-track" key={story.STORY_NO || index}>
                            <div
                                className="story-viewer-progress-fill"
                                style={{
                                    width:
                                        index < currentIndex
                                            ? "100%"
                                            : index === currentIndex
                                                ? progress + "%"
                                                : "0%"
                                }}
                            ></div>
                        </div>
                    ))}
                </div>

                <div className="story-viewer-top">
                    <div className="story-viewer-user">
                        <div className="story-viewer-avatar">
                            {storyGroup.PROFILE_IMG ? (
                                <img src={getImageUrl(storyGroup.PROFILE_IMG)} alt={storyGroup.NICKNAME} />
                            ) : (
                                <span>{getFirstLetter(storyGroup.NICKNAME || storyGroup.USER_ID)}</span>
                            )}
                        </div>

                        <div>
                            <strong>{storyGroup.NICKNAME || storyGroup.USER_ID || "traveler"}</strong>
                            <p>{currentStory.CDATE_TEXT || "방금 전"}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="story-viewer-close-btn"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <button
                    type="button"
                    className="story-viewer-click-zone left"
                    onClick={prevStory}
                ></button>

                <button
                    type="button"
                    className="story-viewer-click-zone right"
                    onClick={nextStory}
                ></button>

                <div className="story-viewer-image-box">
                    {currentStory.STORY_IMG ? (
                        <img src={getImageUrl(currentStory.STORY_IMG)} alt="스토리" />
                    ) : (
                        <div className="story-viewer-empty-image">
                            K-STEP
                        </div>
                    )}
                </div>

                {currentStory.STORY_CONTENT && (
                    <div className="story-viewer-content">
                        {currentStory.STORY_CONTENT}
                    </div>
                )}

                {isMine && (
                    <div className="story-viewer-bottom">
                        <button
                            type="button"
                            className="story-viewer-viewer-btn"
                            onClick={openViewerSheet}
                        >
                            <span>👁</span>
                            본 사람 {viewerCount}
                        </button>
                    </div>
                )}

                {!isMine && (
                    <div className="story-viewer-bottom">
                        <span className="story-viewer-read-text">
                            스토리 보기
                        </span>
                    </div>
                )}

                {viewerSheetOpen && (
                    <div className="story-viewer-sheet-bg" onClick={closeViewerSheet}>
                        <div className="story-viewer-sheet" onClick={(e) => e.stopPropagation()}>
                            <div className="story-viewer-sheet-handle"></div>

                            <div className="story-viewer-sheet-head">
                                <div>
                                    <h3>본 사람</h3>
                                    <p>{viewerCount}명이 이 스토리를 봤어요.</p>
                                </div>

                                <button type="button" onClick={closeViewerSheet}>
                                    ×
                                </button>
                            </div>

                            <div className="story-viewer-sheet-list">
                                {viewerLoading && (
                                    <div className="story-viewer-sheet-empty">
                                        불러오는 중입니다...
                                    </div>
                                )}

                                {!viewerLoading && viewerList.length === 0 && (
                                    <div className="story-viewer-sheet-empty">
                                        아직 본 사람이 없습니다.
                                    </div>
                                )}

                                {!viewerLoading && viewerList.map(user => (
                                    <button
                                        type="button"
                                        className="story-viewer-sheet-user"
                                        key={user.VIEW_NO || user.USER_NO}
                                        onClick={(e) => moveProfile(e, user.USER_NO)}
                                    >
                                        <div className="story-viewer-sheet-avatar">
                                            {user.PROFILE_IMG ? (
                                                <img src={getImageUrl(user.PROFILE_IMG)} alt={user.NICKNAME} />
                                            ) : (
                                                <span>{getFirstLetter(user.NICKNAME || user.USER_ID)}</span>
                                            )}
                                        </div>

                                        <div className="story-viewer-sheet-info">
                                            <strong>{user.NICKNAME || "traveler"}</strong>
                                            <p>@{user.USER_ID} · {user.VIEW_DATE_TEXT}</p>
                                        </div>
                                    </button>
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
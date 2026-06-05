import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StoryBar.css";

function StoryBar() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const storyTextBoxRef = useRef(null);

    const [storyUserList, setStoryUserList] = useState([]);
    const [storyList, setStoryList] = useState([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [progressKey, setProgressKey] = useState(0);

    const [viewerListOpen, setViewerListOpen] = useState(false);
    const [viewerList, setViewerList] = useState([]);
    const [viewerListLoading, setViewerListLoading] = useState(false);
    const [currentViewCount, setCurrentViewCount] = useState(0);

    const [viewedUserNoList, setViewedUserNoList] = useState([]);

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [storyUploadFiles, setStoryUploadFiles] = useState([]);
    const [storyUploadPreviews, setStoryUploadPreviews] = useState([]);
    const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

    const [storyStickerListByIndex, setStoryStickerListByIndex] = useState([]);
    const [activeStickerId, setActiveStickerId] = useState(null);
    const [draggingStickerId, setDraggingStickerId] = useState(null);

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

        setProgressKey(prev => prev + 1);
        setViewerListOpen(false);
        setViewerList([]);
        setCurrentViewCount(Number(currentStory.VIEW_COUNT || 0));

        markStoryView(currentStory.STORY_NO);

        if (isMyStory(currentStory)) {
            getViewerList(currentStory.STORY_NO);
        }
    }, [viewerOpen, selectedStoryIndex, storyList.length]);

    function getToken() {
        return localStorage.getItem("token");
    }

    function isMyStory(story) {
        if (!story) {
            return false;
        }

        if (story.MINE_YN === "Y") {
            return true;
        }

        if (selectedUser && selectedUser.MINE_YN === "Y") {
            return true;
        }

        return false;
    }

    function getStartStoryIndex(list) {
        if (!list || list.length === 0) {
            return 0;
        }

        const firstUnviewedIndex = list.findIndex(story => story.VIEW_YN !== "Y");

        if (firstUnviewedIndex === -1) {
            return 0;
        }

        return firstUnviewedIndex;
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

        return fetch("http://localhost:3010/story/list", {
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

    function resetUploadModal() {
        storyUploadPreviews.forEach(previewUrl => {
            URL.revokeObjectURL(previewUrl);
        });

        setUploadModalOpen(false);
        setStoryUploadFiles([]);
        setStoryUploadPreviews([]);
        setSelectedPreviewIndex(0);
        setStoryStickerListByIndex([]);
        setActiveStickerId(null);
        setDraggingStickerId(null);
    }

    function closeUploadModal() {
        if (uploading) {
            return;
        }

        resetUploadModal();
    }

    function selectStoryFile(e) {
        const files = Array.from(e.target.files || []);

        if (files.length === 0) {
            return;
        }

        const imageFiles = files.filter(file => file.type.startsWith("image/"));

        if (imageFiles.length !== files.length) {
            alert("이미지 파일만 업로드할 수 있습니다.");
            e.target.value = "";
            return;
        }

        storyUploadPreviews.forEach(previewUrl => {
            URL.revokeObjectURL(previewUrl);
        });

        const previewList = imageFiles.map(file => URL.createObjectURL(file));
        const stickerListByIndex = imageFiles.map(() => []);

        setStoryUploadFiles(imageFiles);
        setStoryUploadPreviews(previewList);
        setStoryStickerListByIndex(stickerListByIndex);
        setSelectedPreviewIndex(0);
        setActiveStickerId(null);
        setUploadModalOpen(true);

        e.target.value = "";
    }

    function selectPreview(index) {
        setSelectedPreviewIndex(index);

        const stickerList = storyStickerListByIndex[index] || [];

        if (stickerList.length > 0) {
            setActiveStickerId(stickerList[0].id);
        } else {
            setActiveStickerId(null);
        }
    }

    function getCurrentStickerList() {
        return storyStickerListByIndex[selectedPreviewIndex] || [];
    }

    function getActiveSticker() {
        const stickerList = getCurrentStickerList();

        return stickerList.find(sticker => sticker.id === activeStickerId) || null;
    }

    function addSticker() {
        const newSticker = {
            id: Date.now() + "-" + Math.random(),
            textContent: "",
            posX: 50,
            posY: 50,
            fontSize: 26,
            fontColor: "#FFFFFF",
            bgYn: "Y"
        };

        setStoryStickerListByIndex(prevList => {
            const nextList = [...prevList];
            const stickerList = [...(nextList[selectedPreviewIndex] || [])];

            stickerList.push(newSticker);
            nextList[selectedPreviewIndex] = stickerList;

            return nextList;
        });

        setActiveStickerId(newSticker.id);
    }

    function updateActiveSticker(fieldName, value) {
        if (!activeStickerId) {
            return;
        }

        setStoryStickerListByIndex(prevList => {
            const nextList = [...prevList];
            const stickerList = [...(nextList[selectedPreviewIndex] || [])];

            nextList[selectedPreviewIndex] = stickerList.map(sticker => {
                if (sticker.id === activeStickerId) {
                    return {
                        ...sticker,
                        [fieldName]: value
                    };
                }

                return sticker;
            });

            return nextList;
        });
    }

    function deleteActiveSticker() {
        if (!activeStickerId) {
            return;
        }

        setStoryStickerListByIndex(prevList => {
            const nextList = [...prevList];
            const stickerList = [...(nextList[selectedPreviewIndex] || [])];
            const filteredList = stickerList.filter(sticker => sticker.id !== activeStickerId);

            nextList[selectedPreviewIndex] = filteredList;

            if (filteredList.length > 0) {
                setActiveStickerId(filteredList[0].id);
            } else {
                setActiveStickerId(null);
            }

            return nextList;
        });
    }

    function updateStickerPositionByEvent(e, stickerId) {
        if (!storyTextBoxRef.current) {
            return;
        }

        const rect = storyTextBoxRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        let x = ((clientX - rect.left) / rect.width) * 100;
        let y = ((clientY - rect.top) / rect.height) * 100;

        if (x < 5) {
            x = 5;
        }

        if (x > 95) {
            x = 95;
        }

        if (y < 8) {
            y = 8;
        }

        if (y > 92) {
            y = 92;
        }

        setStoryStickerListByIndex(prevList => {
            const nextList = [...prevList];
            const stickerList = [...(nextList[selectedPreviewIndex] || [])];

            nextList[selectedPreviewIndex] = stickerList.map(sticker => {
                if (sticker.id === stickerId) {
                    return {
                        ...sticker,
                        posX: x,
                        posY: y
                    };
                }

                return sticker;
            });

            return nextList;
        });
    }

    function startStickerDrag(e, stickerId) {
        e.preventDefault();
        e.stopPropagation();

        setActiveStickerId(stickerId);
        setDraggingStickerId(stickerId);
        updateStickerPositionByEvent(e, stickerId);
    }

    function moveSticker(e) {
        if (!draggingStickerId) {
            return;
        }

        updateStickerPositionByEvent(e, draggingStickerId);
    }

    function stopStickerDrag() {
        setDraggingStickerId(null);
    }

    async function uploadStory() {
        if (storyUploadFiles.length === 0) {
            alert("스토리 이미지를 선택해주세요.");
            return;
        }

        const token = getToken();
        const uploadCount = storyUploadFiles.length;
        const loginUserNo = localStorage.getItem("userNo");

        setUploading(true);

        try {
            for (let i = 0; i < storyUploadFiles.length; i++) {
                const stickerList = storyStickerListByIndex[i] || [];
                const cleanStickerList = stickerList
                    .filter(sticker => String(sticker.textContent || "").trim() !== "")
                    .map(sticker => ({
                        textContent: String(sticker.textContent || "").trim(),
                        posX: sticker.posX,
                        posY: sticker.posY,
                        fontSize: sticker.fontSize,
                        fontColor: sticker.fontColor,
                        bgYn: sticker.bgYn
                    }));

                const formData = new FormData();

                formData.append("storyImage", storyUploadFiles[i]);
                formData.append("content", "");
                formData.append("textList", JSON.stringify(cleanStickerList));

                const res = await fetch("http://localhost:3010/story/add", {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + token
                    },
                    body: formData
                });

                const data = await res.json();
                console.log("스토리 등록 결과", data);

                if (data.result !== "success") {
                    alert(data.message || "스토리 등록에 실패했습니다.");
                    return;
                }
            }

            if (loginUserNo) {
                setViewedUserNoList(prevList =>
                    prevList.filter(userNo => String(userNo) !== String(loginUserNo))
                );
            }

            resetUploadModal();
            await getStoryUserList();

            alert(uploadCount + "개의 스토리가 등록되었습니다.");

        } catch (err) {
            console.error(err);
            alert("스토리 등록 중 오류가 발생했습니다.");

        } finally {
            setUploading(false);
        }
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

                    const startIndex = getStartStoryIndex(list);

                    setSelectedUser(user);
                    setStoryList(list);
                    setSelectedStoryIndex(startIndex);
                    setViewerOpen(true);
                    setViewerListOpen(false);
                    setViewerList([]);
                    setCurrentViewCount(Number(list[startIndex].VIEW_COUNT || 0));
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
        setViewerListOpen(false);
        setViewerList([]);
        setCurrentViewCount(0);
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
                    setCurrentViewCount(Number(data.viewCount || 0));

                    setStoryList(prevList => {
                        const nextList = prevList.map(story => {
                            if (String(story.STORY_NO) === String(storyNo)) {
                                return {
                                    ...story,
                                    VIEW_YN: "Y",
                                    VIEW_COUNT: data.viewCount
                                };
                            }

                            return story;
                        });

                        const allViewed = nextList.every(story => {
                            return story.VIEW_YN === "Y";
                        });

                        if (selectedUser && allViewed) {
                            setViewedUserNoList(prevViewedList => {
                                if (prevViewedList.includes(String(selectedUser.USER_NO))) {
                                    return prevViewedList;
                                }

                                return [...prevViewedList, String(selectedUser.USER_NO)];
                            });

                            setStoryUserList(prevUserList =>
                                prevUserList.map(user => {
                                    if (String(user.USER_NO) === String(selectedUser.USER_NO)) {
                                        return {
                                            ...user,
                                            ALL_VIEW_YN: "Y",
                                            VIEWED_COUNT: user.STORY_COUNT
                                        };
                                    }

                                    return user;
                                })
                            );
                        }

                        return nextList;
                    });
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    function getViewerList(storyNo) {
        if (!storyNo) {
            return;
        }

        const token = getToken();

        setViewerListLoading(true);

        fetch("http://localhost:3010/story/viewer/list/" + storyNo, {
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
                    setCurrentViewCount(list.length);
                } else {
                    setViewerList([]);
                    setCurrentViewCount(0);
                    console.log(data.message || "본 사람 목록을 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                setViewerList([]);
                setCurrentViewCount(0);
            })
            .finally(() => {
                setViewerListLoading(false);
            });
    }

    function openViewerList(e) {
        e.stopPropagation();

        if (!currentStory || !isMyStory(currentStory)) {
            return;
        }

        setViewerListOpen(true);
        getViewerList(currentStory.STORY_NO);
    }

    function closeViewerList(e) {
        e.stopPropagation();
        setViewerListOpen(false);
    }

    function moveViewerProfile(e, userNo) {
        e.stopPropagation();

        if (!userNo) {
            return;
        }

        closeStoryViewer();
        navigate("/profile/" + userNo);
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

    function getStoryItemClass(user) {
        if (!user || (user.STORY_COUNT || 0) === 0) {
            return "story-item empty";
        }

        const isLocalViewed = viewedUserNoList.includes(String(user.USER_NO));

        const isServerViewed =
            user.ALL_VIEW_YN === "Y" ||
            user.ALL_VIEW_YN === "y" ||
            user.ALL_VIEW_YN === true ||
            user.ALL_VIEW_YN === 1 ||
            String(user.ALL_VIEW_YN) === "1" ||
            Number(user.VIEWED_COUNT || 0) >= Number(user.STORY_COUNT || 0);

        if (isLocalViewed || isServerViewed) {
            return "story-item viewed";
        }

        return "story-item active";
    }

    function moveMentionProfile(e, keyword) {
        e.stopPropagation();

        if (!keyword) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/story/mention/search/" + encodeURIComponent(keyword), {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("멘션 사용자 검색", data);

                if (data.result === "success" && data.user) {
                    closeStoryViewer();
                    navigate("/profile/" + data.user.USER_NO);
                } else {
                    alert(data.message || "사용자를 찾을 수 없습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("사용자 검색 중 오류가 발생했습니다.");
            });
    }

    function renderTaggedText(text) {
        const value = String(text || "");
        const parts = value.split(/([@#][0-9a-zA-Z가-힣_]+)/g);

        return parts.map((part, index) => {
            if (part.startsWith("@")) {
                const keyword = part.substring(1);

                return (
                    <button
                        type="button"
                        key={index}
                        onClick={(e) => moveMentionProfile(e, keyword)}
                        style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            margin: 0,
                            color: "#cbb4ff",
                            font: "inherit",
                            fontWeight: 950,
                            cursor: "pointer",
                            textShadow: "inherit"
                        }}
                    >
                        {part}
                    </button>
                );
            }

            if (part.startsWith("#")) {
                return (
                    <span
                        key={index}
                        style={{
                            color: "#f3c778",
                            fontWeight: 950
                        }}
                    >
                        {part}
                    </span>
                );
            }

            return (
                <span key={index}>
                    {part}
                </span>
            );
        });
    }

    function renderStoryTextList(story) {
        const textList = story.TEXT_LIST || [];

        if (textList.length === 0) {
            return null;
        }

        return textList.map(text => (
            <div
                key={text.TEXT_NO}
                style={{
                    position: "absolute",
                    left: Number(text.POS_X || 50) + "%",
                    top: Number(text.POS_Y || 50) + "%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 18,
                    maxWidth: "82%",
                    padding: text.BG_YN === "Y" ? "7px 12px" : "0",
                    borderRadius: "999px",
                    background: text.BG_YN === "Y" ? "rgba(0, 0, 0, 0.42)" : "transparent",
                    color: text.FONT_COLOR || "#ffffff",
                    fontSize: Number(text.FONT_SIZE || 24) + "px",
                    fontWeight: 950,
                    lineHeight: 1.25,
                    textAlign: "center",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    textShadow: "0 2px 10px rgba(0,0,0,0.55)",
                    pointerEvents: "auto"
                }}
            >
                {renderTaggedText(text.TEXT_CONTENT)}
            </div>
        ));
    }

    const currentStory = storyList.length > 0 ? storyList[selectedStoryIndex] : null;
    const currentStoryIsMine = currentStory ? isMyStory(currentStory) : false;
    const currentStoryTextList = currentStory ? (currentStory.TEXT_LIST || []) : [];
    const currentStickerList = getCurrentStickerList();
    const activeSticker = getActiveSticker();

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
                    multiple
                    ref={fileInputRef}
                    className="story-hidden-input"
                    onChange={selectStoryFile}
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
                            className={getStoryItemClass(user)}
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

            {uploadModalOpen && (
                <div
                    onClick={closeUploadModal}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 10000,
                        background: "rgba(25, 22, 30, 0.62)",
                        backdropFilter: "blur(12px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "18px",
                        boxSizing: "border-box"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(460px, 100%)",
                            maxHeight: "94vh",
                            borderRadius: "30px",
                            background: "linear-gradient(180deg, #fffafd, #fff5f8)",
                            boxShadow: "0 28px 80px rgba(0,0,0,0.28)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f2dce5" }}>
                            <h3 style={{ margin: 0, color: "#2b1d3d", fontSize: "20px", fontWeight: 950 }}>
                                스토리 꾸미기
                            </h3>
                            <p style={{ margin: "6px 0 0", color: "#947d89", fontSize: "13px", fontWeight: 700 }}>
                                사진마다 글을 여러 개 올리고 위치를 바꿀 수 있어요.
                            </p>
                        </div>

                        <div style={{ padding: "16px 20px", overflowY: "auto" }}>
                            <div
                                ref={storyTextBoxRef}
                                onPointerMove={moveSticker}
                                onPointerUp={stopStickerDrag}
                                onPointerLeave={stopStickerDrag}
                                style={{
                                    width: "100%",
                                    height: "360px",
                                    borderRadius: "24px",
                                    overflow: "hidden",
                                    background: "#111",
                                    marginBottom: "12px",
                                    position: "relative",
                                    touchAction: "none"
                                }}
                            >
                                {storyUploadPreviews[selectedPreviewIndex] && (
                                    <img
                                        src={storyUploadPreviews[selectedPreviewIndex]}
                                        alt="스토리 미리보기"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block"
                                        }}
                                    />
                                )}

                                {currentStickerList.map(sticker => (
                                    <div
                                        key={sticker.id}
                                        onPointerDown={(e) => startStickerDrag(e, sticker.id)}
                                        style={{
                                            position: "absolute",
                                            left: sticker.posX + "%",
                                            top: sticker.posY + "%",
                                            transform: "translate(-50%, -50%)",
                                            zIndex: 3,
                                            maxWidth: "84%",
                                            padding: sticker.bgYn === "Y" ? "7px 12px" : "0",
                                            borderRadius: "999px",
                                            background: sticker.bgYn === "Y" ? "rgba(0,0,0,0.42)" : "transparent",
                                            color: sticker.fontColor,
                                            fontSize: sticker.fontSize + "px",
                                            fontWeight: 950,
                                            lineHeight: 1.25,
                                            textAlign: "center",
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                            textShadow: "0 2px 10px rgba(0,0,0,0.55)",
                                            cursor: "grab",
                                            userSelect: "none",
                                            outline: activeStickerId === sticker.id ? "2px dashed rgba(255,255,255,0.85)" : "none",
                                            outlineOffset: "4px"
                                        }}
                                    >
                                        {sticker.textContent || "글 입력"}
                                    </div>
                                ))}
                            </div>

                            {storyUploadPreviews.length > 1 && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        overflowX: "auto",
                                        marginBottom: "12px",
                                        paddingBottom: "4px"
                                    }}
                                >
                                    {storyUploadPreviews.map((previewUrl, index) => (
                                        <button
                                            type="button"
                                            key={previewUrl}
                                            onClick={() => selectPreview(index)}
                                            style={{
                                                width: "54px",
                                                height: "54px",
                                                minWidth: "54px",
                                                borderRadius: "15px",
                                                overflow: "hidden",
                                                padding: 0,
                                                border: selectedPreviewIndex === index ? "3px solid #e9839b" : "2px solid #ead6de",
                                                background: "#111",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <img
                                                src={previewUrl}
                                                alt={"선택 이미지 " + (index + 1)}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block"
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                <button
                                    type="button"
                                    onClick={addSticker}
                                    style={{
                                        height: "36px",
                                        padding: "0 13px",
                                        border: "none",
                                        borderRadius: "14px",
                                        background: "linear-gradient(135deg, #5b4a8d, #e9839b)",
                                        color: "#fff",
                                        fontWeight: 950,
                                        cursor: "pointer",
                                        fontFamily: "inherit"
                                    }}
                                >
                                    + 글 추가
                                </button>

                                <button
                                    type="button"
                                    onClick={deleteActiveSticker}
                                    disabled={!activeSticker}
                                    style={{
                                        height: "36px",
                                        padding: "0 13px",
                                        border: "1px solid #ead6de",
                                        borderRadius: "14px",
                                        background: "#fff",
                                        color: activeSticker ? "#a45f76" : "#c6b7bf",
                                        fontWeight: 900,
                                        cursor: activeSticker ? "pointer" : "default",
                                        fontFamily: "inherit"
                                    }}
                                >
                                    선택 글 삭제
                                </button>
                            </div>

                            {activeSticker ? (
                                <>
                                    <textarea
                                        value={activeSticker.textContent}
                                        onChange={(e) => updateActiveSticker("textContent", e.target.value)}
                                        maxLength={500}
                                        placeholder="사진 위에 올릴 글을 입력하세요. 예) #경주여행 @traveler01"
                                        style={{
                                            width: "100%",
                                            height: "82px",
                                            resize: "none",
                                            border: "1px solid #efd6df",
                                            borderRadius: "18px",
                                            outline: "none",
                                            padding: "13px 14px",
                                            boxSizing: "border-box",
                                            fontFamily: "inherit",
                                            fontSize: "14px",
                                            lineHeight: 1.5,
                                            color: "#3b3042",
                                            background: "#ffffff"
                                        }}
                                    />

                                    <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                        {["#FFFFFF", "#FFD9E4", "#F3C778", "#CBB4FF", "#2B1D3D"].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => updateActiveSticker("fontColor", color)}
                                                style={{
                                                    width: "30px",
                                                    height: "30px",
                                                    borderRadius: "50%",
                                                    border: activeSticker.fontColor === color ? "3px solid #e9839b" : "2px solid #ffffff",
                                                    background: color,
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                                                    cursor: "pointer"
                                                }}
                                            ></button>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => updateActiveSticker("fontSize", Math.max(18, activeSticker.fontSize - 2))}
                                            style={{
                                                height: "32px",
                                                padding: "0 11px",
                                                borderRadius: "12px",
                                                border: "1px solid #ead6de",
                                                background: "#fff",
                                                color: "#7b6572",
                                                fontWeight: 900,
                                                cursor: "pointer"
                                            }}
                                        >
                                            A-
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => updateActiveSticker("fontSize", Math.min(42, activeSticker.fontSize + 2))}
                                            style={{
                                                height: "32px",
                                                padding: "0 11px",
                                                borderRadius: "12px",
                                                border: "1px solid #ead6de",
                                                background: "#fff",
                                                color: "#7b6572",
                                                fontWeight: 900,
                                                cursor: "pointer"
                                            }}
                                        >
                                            A+
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => updateActiveSticker("bgYn", activeSticker.bgYn === "Y" ? "N" : "Y")}
                                            style={{
                                                height: "32px",
                                                padding: "0 12px",
                                                borderRadius: "12px",
                                                border: "1px solid #ead6de",
                                                background: activeSticker.bgYn === "Y" ? "#fff0f4" : "#fff",
                                                color: "#7b6572",
                                                fontWeight: 900,
                                                cursor: "pointer"
                                            }}
                                        >
                                            배경 {activeSticker.bgYn === "Y" ? "ON" : "OFF"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div
                                    style={{
                                        padding: "18px",
                                        borderRadius: "18px",
                                        background: "#fff",
                                        border: "1px dashed #ead6de",
                                        color: "#9b8390",
                                        fontSize: "13px",
                                        fontWeight: 800,
                                        textAlign: "center"
                                    }}
                                >
                                    `+ 글 추가`를 눌러서 사진 위에 글을 올려주세요.
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                padding: "0 20px 20px",
                                display: "flex",
                                gap: "10px",
                                justifyContent: "flex-end"
                            }}
                        >
                            <button
                                type="button"
                                onClick={closeUploadModal}
                                disabled={uploading}
                                style={{
                                    height: "40px",
                                    padding: "0 15px",
                                    borderRadius: "15px",
                                    border: "1px solid #ead6de",
                                    background: "#fff",
                                    color: "#8b6f7c",
                                    fontWeight: 900,
                                    cursor: uploading ? "default" : "pointer",
                                    fontFamily: "inherit"
                                }}
                            >
                                취소
                            </button>

                            <button
                                type="button"
                                onClick={uploadStory}
                                disabled={uploading}
                                style={{
                                    height: "40px",
                                    padding: "0 18px",
                                    borderRadius: "15px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #5b4a8d 0%, #e9839b 58%, #f3c778 100%)",
                                    color: "#ffffff",
                                    fontWeight: 950,
                                    cursor: uploading ? "default" : "pointer",
                                    fontFamily: "inherit"
                                }}
                            >
                                {uploading ? "올리는 중..." : storyUploadFiles.length + "장 올리기"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

                            {renderStoryTextList(currentStory)}

                            <button
                                type="button"
                                className="story-click-zone right"
                                onClick={nextStory}
                            ></button>
                        </div>

                        {currentStoryTextList.length === 0 && currentStory.STORY_CONTENT && (
                            <div className={currentStoryIsMine ? "story-viewer-caption owner-story" : "story-viewer-caption"}>
                                {currentStory.STORY_CONTENT}
                            </div>
                        )}

                        {currentStoryIsMine && (
                            <>
                                <button
                                    type="button"
                                    className="story-view-count-btn"
                                    onClick={openViewerList}
                                >
                                    👁 본 사람 {currentViewCount}
                                </button>

                                <button
                                    type="button"
                                    className="story-delete-btn"
                                    onClick={() => removeStory(currentStory.STORY_NO)}
                                >
                                    삭제
                                </button>
                            </>
                        )}

                        {viewerListOpen && (
                            <div className="story-viewer-list-bg" onClick={closeViewerList}>
                                <div className="story-viewer-list-sheet" onClick={(e) => e.stopPropagation()}>
                                    <div className="story-viewer-list-handle"></div>

                                    <div className="story-viewer-list-head">
                                        <div>
                                            <h3>본 사람</h3>
                                            <p>{currentViewCount}명이 이 스토리를 봤어요.</p>
                                        </div>

                                        <button type="button" onClick={closeViewerList}>
                                            ×
                                        </button>
                                    </div>

                                    <div className="story-viewer-user-list">
                                        {viewerListLoading && (
                                            <div className="story-viewer-list-empty">
                                                불러오는 중입니다...
                                            </div>
                                        )}

                                        {!viewerListLoading && viewerList.length === 0 && (
                                            <div className="story-viewer-list-empty">
                                                아직 본 사람이 없습니다.
                                            </div>
                                        )}

                                        {!viewerListLoading && viewerList.map(user => (
                                            <button
                                                type="button"
                                                className="story-viewer-user-row"
                                                key={user.VIEW_NO || user.USER_NO}
                                                onClick={(e) => moveViewerProfile(e, user.USER_NO)}
                                            >
                                                <div className="story-viewer-user-profile">
                                                    {getImageUrl(user.PROFILE_IMG) !== "" ? (
                                                        <img
                                                            src={getImageUrl(user.PROFILE_IMG)}
                                                            alt={safeText(user.NICKNAME, "프로필")}
                                                        />
                                                    ) : (
                                                        <span>{getFirstLetter(user.NICKNAME || user.USER_ID)}</span>
                                                    )}
                                                </div>

                                                <div className="story-viewer-user-info">
                                                    <strong>{safeText(user.NICKNAME, "traveler")}</strong>
                                                    <p>@{safeText(user.USER_ID, "user")} · {safeText(user.VIEW_DATE_TEXT, "")}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default StoryBar;
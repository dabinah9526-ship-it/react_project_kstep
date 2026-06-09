import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { getLang, t } from "../utils/language";
import "./ProfileStoryCircle.css";

function ProfileStoryCircle({ userNo, nickname, profileImg }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const storyTextBoxRef = useRef(null);
    const blockStoryOpenRef = useRef(false);
    const blockTimerRef = useRef(null);

    const [language, setLanguage] = useState(getLang());

    const [hasStoryYn, setHasStoryYn] = useState("N");
    const [allViewYn, setAllViewYn] = useState("Y");
    const [storyList, setStoryList] = useState([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
    const [progressKey, setProgressKey] = useState(0);
    const [uploading, setUploading] = useState(false);

    const [viewerListOpen, setViewerListOpen] = useState(false);
    const [viewerList, setViewerList] = useState([]);
    const [viewerListLoading, setViewerListLoading] = useState(false);
    const [currentViewCount, setCurrentViewCount] = useState(0);

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [storyUploadFiles, setStoryUploadFiles] = useState([]);
    const [storyUploadPreviews, setStoryUploadPreviews] = useState([]);
    const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

    const [storyStickerListByIndex, setStoryStickerListByIndex] = useState([]);
    const [activeStickerId, setActiveStickerId] = useState(null);
    const [draggingStickerId, setDraggingStickerId] = useState(null);

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
        if (userNo) {
            getStoryStatus();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userNo]);

    useEffect(() => {
        if (!viewerOpen) {
            return;
        }

        if (storyList.length === 0) {
            return;
        }

        const story = storyList[selectedStoryIndex];

        if (!story || !story.STORY_NO) {
            return;
        }

        setProgressKey(prev => prev + 1);
        setViewerListOpen(false);
        setViewerList([]);
        setCurrentViewCount(Number(story.VIEW_COUNT || 0));

        markStoryView(story.STORY_NO);

        if (isMyStory(story)) {
            getViewerList(story.STORY_NO);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewerOpen, selectedStoryIndex, storyList.length]);

    useEffect(() => {
        if (uploadModalOpen || viewerOpen) {
            document.body.classList.add("profile-story-modal-open");
        } else {
            document.body.classList.remove("profile-story-modal-open");
        }

        return () => {
            document.body.classList.remove("profile-story-modal-open");
        };
    }, [uploadModalOpen, viewerOpen]);

    function getPageText(key) {
        const ko = {
            loginRequired: "로그인이 필요합니다.",
            imageOnly: "이미지 파일만 업로드할 수 있습니다.",
            selectStoryImage: "스토리 이미지를 선택해주세요.",
            storyUploadFail: "스토리 등록에 실패했습니다.",
            storyUploadError: "스토리 등록 중 오류가 발생했습니다.",
            storyUploaded: "개의 스토리가 등록되었습니다.",
            storyLoadFail: "스토리를 불러오지 못했습니다.",
            storyLoadError: "스토리를 불러오는 중 오류가 발생했습니다.",
            viewerLoadFail: "본 사람 목록을 불러오지 못했습니다.",
            deleteConfirm: "스토리를 삭제할까요?",
            deleteDone: "스토리가 삭제되었습니다.",
            deleteFail: "스토리 삭제에 실패했습니다.",
            deleteError: "스토리 삭제 중 오류가 발생했습니다.",
            userNotFound: "사용자를 찾을 수 없습니다.",
            userSearchError: "사용자 검색 중 오류가 발생했습니다.",

            justNow: "방금 전",
            minuteAgo: "분 전",
            hourAgo: "시간 전",
            dayAgo: "일 전",

            profileAlt: "프로필",
            storyAlt: "스토리",
            traveler: "traveler",

            decorateTitle: "스토리 꾸미기",
            decorateSub: "사진마다 글을 여러 개 올리고 위치를 바꿀 수 있어요.",
            previewAlt: "스토리 미리보기",
            selectImageAlt: "선택 이미지 ",
            addText: "+ 글 추가",
            deleteText: "선택 글 삭제",
            textPlaceholder: "사진 위에 올릴 글을 입력하세요. 예) #경주여행 @traveler01",
            inputText: "글 입력",
            bg: "배경",
            emptyGuide: "+ 글 추가를 눌러서 사진 위에 글을 올려주세요.",
            cancel: "취소",
            uploading: "올리는 중...",
            uploadCountSuffix: "장 올리기",

            viewer: "본 사람",
            viewerCountSuffix: "명이 이 스토리를 봤어요.",
            loadingViewer: "불러오는 중입니다...",
            noViewer: "아직 본 사람이 없습니다.",
            delete: "삭제"
        };

        const en = {
            loginRequired: "Please log in first.",
            imageOnly: "Only image files can be uploaded.",
            selectStoryImage: "Please select story images.",
            storyUploadFail: "Failed to upload story.",
            storyUploadError: "An error occurred while uploading story.",
            storyUploaded: " stories have been uploaded.",
            storyLoadFail: "Failed to load story.",
            storyLoadError: "An error occurred while loading story.",
            viewerLoadFail: "Failed to load viewers.",
            deleteConfirm: "Delete this story?",
            deleteDone: "The story has been deleted.",
            deleteFail: "Failed to delete story.",
            deleteError: "An error occurred while deleting story.",
            userNotFound: "User not found.",
            userSearchError: "An error occurred while searching user.",

            justNow: "Just now",
            minuteAgo: " min ago",
            hourAgo: " hr ago",
            dayAgo: " days ago",

            profileAlt: "Profile",
            storyAlt: "Story",
            traveler: "traveler",

            decorateTitle: "Decorate Story",
            decorateSub: "Add multiple texts to each photo and move them around.",
            previewAlt: "Story preview",
            selectImageAlt: "Selected image ",
            addText: "+ Add Text",
            deleteText: "Delete Text",
            textPlaceholder: "Write text on the photo. Example: #GyeongjuTrip @traveler01",
            inputText: "Text",
            bg: "Background",
            emptyGuide: "Press + Add Text to add text on the photo.",
            cancel: "Cancel",
            uploading: "Uploading...",
            uploadCountSuffix: " photos upload",

            viewer: "Viewers",
            viewerCountSuffix: " people viewed this story.",
            loadingViewer: "Loading...",
            noViewer: "No viewers yet.",
            delete: "Delete"
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

    function blockStoryOpenTemporarily() {
        blockStoryOpenRef.current = true;

        if (blockTimerRef.current) {
            clearTimeout(blockTimerRef.current);
        }

        blockTimerRef.current = setTimeout(() => {
            blockStoryOpenRef.current = false;
        }, 500);
    }

    function stopOnly(e) {
        if (!e) {
            return;
        }

        e.stopPropagation();

        if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
            e.nativeEvent.stopImmediatePropagation();
        }

        blockStoryOpenTemporarily();
    }

    function stopAll(e) {
        if (!e) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
            e.nativeEvent.stopImmediatePropagation();
        }

        blockStoryOpenTemporarily();
    }

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

    function isMyStory(story) {
        if (!story) {
            return false;
        }

        if (story.MINE_YN === "Y") {
            return true;
        }

        if (String(story.USER_NO) === String(getLoginUserNo())) {
            return true;
        }

        if (isMine()) {
            return true;
        }

        return false;
    }

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
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

    function getStoryImageUrl(story) {
        if (!story) {
            return "";
        }

        return getImageUrl(
            story.STORY_IMG ||
            story.STORY_IMAGE ||
            story.IMG_URL ||
            story.IMAGE_URL ||
            story.FILE_URL ||
            ""
        );
    }

    function getStoryTextList(story) {
        if (!story) {
            return [];
        }

        if (Array.isArray(story.TEXT_LIST)) {
            return story.TEXT_LIST;
        }

        if (typeof story.TEXT_LIST === "string") {
            try {
                const parsedList = JSON.parse(story.TEXT_LIST);

                if (Array.isArray(parsedList)) {
                    return parsedList;
                }
            } catch (err) {
                return [];
            }
        }

        return [];
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
            return getPageText("justNow");
        }

        if (diff < hour) {
            return Math.floor(diff / minute) + getPageText("minuteAgo");
        }

        if (diff < day) {
            return Math.floor(diff / hour) + getPageText("hourAgo");
        }

        return Math.floor(diff / day) + getPageText("dayAgo");
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

    function getStoryStatus() {
        const token = getToken();

        return fetch("http://localhost:3010/story/profile/" + userNo + "/status", {
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
            alert(getPageText("imageOnly"));
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
        blockStoryOpenTemporarily();

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

    function addStickerAction() {
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

    function addSticker(e) {
        stopAll(e);
        addStickerAction();
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

    function deleteActiveSticker(e) {
        stopAll(e);

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
        stopAll(e);

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

    function getPositionClass(posX, posY) {
        const x = Math.round(Number(posX || 50) / 5) * 5;
        const y = Math.round(Number(posY || 50) / 5) * 5;

        return "profile-story-pos-x-" + x + " profile-story-pos-y-" + y;
    }

    function getFontSizeClass(fontSize) {
        const size = Math.round(Number(fontSize || 26) / 2) * 2;

        if (size < 18) {
            return "profile-story-font-18";
        }

        if (size > 42) {
            return "profile-story-font-42";
        }

        return "profile-story-font-" + size;
    }

    function getTextColorClass(color) {
        if (color === "#FFD9E4") {
            return "profile-story-text-pink";
        }

        if (color === "#F3C778") {
            return "profile-story-text-gold";
        }

        if (color === "#CBB4FF") {
            return "profile-story-text-lavender";
        }

        if (color === "#2B1D3D") {
            return "profile-story-text-dark";
        }

        return "profile-story-text-white";
    }

    function getColorButtonClass(color) {
        if (color === "#FFD9E4") {
            return "profile-story-color-btn-pink";
        }

        if (color === "#F3C778") {
            return "profile-story-color-btn-gold";
        }

        if (color === "#CBB4FF") {
            return "profile-story-color-btn-lavender";
        }

        if (color === "#2B1D3D") {
            return "profile-story-color-btn-dark";
        }

        return "profile-story-color-btn-white";
    }

    function getUploadStickerClass(sticker, isActive) {
        let className = "profile-story-upload-sticker";

        if (sticker.bgYn === "Y") {
            className += " with-bg";
        }

        if (isActive) {
            className += " active";
        }

        className += " " + getPositionClass(sticker.posX, sticker.posY);
        className += " " + getFontSizeClass(sticker.fontSize);
        className += " " + getTextColorClass(sticker.fontColor);

        return className;
    }

    function getRenderTextClass(text) {
        let className = "profile-story-render-text";

        if ((text.BG_YN || text.bgYn) === "Y") {
            className += " with-bg";
        }

        className += " " + getPositionClass(text.POS_X || text.posX, text.POS_Y || text.posY);
        className += " " + getFontSizeClass(text.FONT_SIZE || text.fontSize);
        className += " " + getTextColorClass(text.FONT_COLOR || text.fontColor);

        return className;
    }

    async function uploadStory(e) {
        stopAll(e);

        if (storyUploadFiles.length === 0) {
            alert(getPageText("selectStoryImage"));
            return;
        }

        const token = getToken();
        const uploadCount = storyUploadFiles.length;

        if (!token) {
            alert(t("loginRequired") || getPageText("loginRequired"));
            return;
        }

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
                console.log("프로필 스토리 등록 결과", data);

                if (data.result !== "success") {
                    alert(data.message || getPageText("storyUploadFail"));
                    return;
                }
            }

            resetUploadModal();

            setHasStoryYn("Y");
            setAllViewYn("N");

            await getStoryStatus();

            alert(uploadCount + getPageText("storyUploaded"));

        } catch (err) {
            console.error(err);
            alert(getPageText("storyUploadError"));

        } finally {
            setUploading(false);
        }
    }

    function openStory(e) {
        if (e) {
            e.stopPropagation();
        }

        if (blockStoryOpenRef.current || uploadModalOpen || uploading || viewerOpen) {
            return;
        }

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

                    const startIndex = getStartStoryIndex(list);

                    setStoryList(list);
                    setSelectedStoryIndex(startIndex);
                    setViewerOpen(true);
                    setViewerListOpen(false);
                    setViewerList([]);
                    setCurrentViewCount(Number(list[startIndex].VIEW_COUNT || 0));
                } else {
                    alert(data.message || getPageText("storyLoadFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("storyLoadError"));
            });
    }

    function closeStoryViewer(e) {
        if (e) {
            e.stopPropagation();
        }

        setViewerOpen(false);
        setStoryList([]);
        setSelectedStoryIndex(0);
        setViewerListOpen(false);
        setViewerList([]);
        setCurrentViewCount(0);
        getStoryStatus();
    }

    function nextStory(e) {
        if (e) {
            e.stopPropagation();
        }

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

    function prevStory(e) {
        if (e) {
            e.stopPropagation();
        }

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

        if (!token || !storyNo) {
            return;
        }

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

                        const allViewed = nextList.every(story => story.VIEW_YN === "Y");

                        if (allViewed) {
                            setAllViewYn("Y");
                        }

                        return nextList;
                    });

                    getStoryStatus();
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
                console.log("프로필 스토리 본 사람 목록", data);

                if (data.result === "success") {
                    const list = data.list || [];

                    setViewerList(list);
                    setCurrentViewCount(list.length);
                } else {
                    setViewerList([]);
                    setCurrentViewCount(0);
                    console.log(data.message || getPageText("viewerLoadFail"));
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
        stopAll(e);

        if (!currentStory || !isMyStory(currentStory)) {
            return;
        }

        setViewerListOpen(true);
        getViewerList(currentStory.STORY_NO);
    }

    function closeViewerList(e) {
        stopAll(e);
        setViewerListOpen(false);
    }

    function moveViewerProfile(e, targetUserNo) {
        stopAll(e);

        if (!targetUserNo) {
            return;
        }

        closeStoryViewer();
        navigate("/profile/" + targetUserNo);
    }

    function moveMentionProfile(e, keyword) {
        stopAll(e);

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
                    alert(data.message || getPageText("userNotFound"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("userSearchError"));
            });
    }

    function removeStory(e, storyNo) {
        stopAll(e);

        if (!storyNo) {
            return;
        }

        if (!window.confirm(getPageText("deleteConfirm"))) {
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
                    alert(getPageText("deleteDone"));
                    closeStoryViewer();
                    getStoryStatus();
                } else {
                    alert(data.message || getPageText("deleteFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("deleteError"));
            });
    }

    function getProfileStoryClass() {
        if (hasStoryYn !== "Y") {
            return "profile-story-circle empty";
        }

        const isViewed =
            allViewYn === "Y" ||
            allViewYn === "y" ||
            allViewYn === true ||
            allViewYn === 1 ||
            String(allViewYn) === "1";

        if (isViewed) {
            return "profile-story-circle viewed";
        }

        return "profile-story-circle active";
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
                        className="profile-story-tag-mention"
                    >
                        {part}
                    </button>
                );
            }

            if (part.startsWith("#")) {
                return (
                    <span
                        key={index}
                        className="profile-story-tag-hashtag"
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
        const textList = getStoryTextList(story);

        if (textList.length === 0) {
            return null;
        }

        return textList.map((text, index) => (
            <div
                key={text.TEXT_NO || text.textNo || index}
                className={getRenderTextClass(text)}
            >
                {renderTaggedText(text.TEXT_CONTENT || text.textContent)}
            </div>
        ));
    }

    const currentStory = storyList.length > 0 ? storyList[selectedStoryIndex] : null;
    const currentStoryIsMine = currentStory ? isMyStory(currentStory) : false;
    const currentStoryTextList = currentStory ? getStoryTextList(currentStory) : [];
    const currentStickerList = getCurrentStickerList();
    const activeSticker = getActiveSticker();

    const uploadModal = uploadModalOpen ? (
        <div
            className="profile-story-upload-bg"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    closeUploadModal();
                }
            }}
        >
            <div
                className="profile-story-upload-modal"
                onClick={stopOnly}
            >
                <div className="profile-story-upload-head">
                    <h3>{getPageText("decorateTitle")}</h3>
                    <p>{getPageText("decorateSub")}</p>
                </div>

                <div className="profile-story-upload-body">
                    <div
                        ref={storyTextBoxRef}
                        className="profile-story-upload-preview-box"
                        onPointerMove={moveSticker}
                        onPointerUp={stopStickerDrag}
                        onPointerLeave={stopStickerDrag}
                    >
                        {storyUploadPreviews[selectedPreviewIndex] && (
                            <img
                                src={storyUploadPreviews[selectedPreviewIndex]}
                                alt={getPageText("previewAlt")}
                                className="profile-story-upload-preview-img"
                            />
                        )}

                        {currentStickerList.map(sticker => (
                            <div
                                key={sticker.id}
                                className={getUploadStickerClass(sticker, activeStickerId === sticker.id)}
                                onPointerDown={(e) => startStickerDrag(e, sticker.id)}
                            >
                                {sticker.textContent || getPageText("inputText")}
                            </div>
                        ))}
                    </div>

                    {storyUploadPreviews.length > 1 && (
                        <div className="profile-story-upload-thumb-row">
                            {storyUploadPreviews.map((previewUrl, index) => (
                                <button
                                    type="button"
                                    key={previewUrl}
                                    className={selectedPreviewIndex === index ? "profile-story-upload-thumb active" : "profile-story-upload-thumb"}
                                    onClick={(e) => {
                                        stopAll(e);
                                        selectPreview(index);
                                    }}
                                >
                                    <img
                                        src={previewUrl}
                                        alt={getPageText("selectImageAlt") + (index + 1)}
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="profile-story-upload-tool-row">
                        <button
                            type="button"
                            className="profile-story-upload-main-btn"
                            onClick={addSticker}
                        >
                            {getPageText("addText")}
                        </button>

                        <button
                            type="button"
                            className="profile-story-upload-sub-btn"
                            onClick={deleteActiveSticker}
                            disabled={!activeSticker}
                        >
                            {getPageText("deleteText")}
                        </button>
                    </div>

                    {activeSticker ? (
                        <>
                            <textarea
                                value={activeSticker.textContent}
                                onChange={(e) => updateActiveSticker("textContent", e.target.value)}
                                maxLength={500}
                                placeholder={getPageText("textPlaceholder")}
                                className="profile-story-upload-textarea"
                                onClick={stopOnly}
                            />

                            <div className="profile-story-upload-option-row">
                                {["#FFFFFF", "#FFD9E4", "#F3C778", "#CBB4FF", "#2B1D3D"].map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={(e) => {
                                            stopAll(e);
                                            updateActiveSticker("fontColor", color);
                                        }}
                                        className={
                                            activeSticker.fontColor === color
                                                ? "profile-story-color-btn active " + getColorButtonClass(color)
                                                : "profile-story-color-btn " + getColorButtonClass(color)
                                        }
                                    ></button>
                                ))}

                                <button
                                    type="button"
                                    className="profile-story-upload-option-btn"
                                    onClick={(e) => {
                                        stopAll(e);
                                        updateActiveSticker("fontSize", Math.max(18, activeSticker.fontSize - 2));
                                    }}
                                >
                                    A-
                                </button>

                                <button
                                    type="button"
                                    className="profile-story-upload-option-btn"
                                    onClick={(e) => {
                                        stopAll(e);
                                        updateActiveSticker("fontSize", Math.min(42, activeSticker.fontSize + 2));
                                    }}
                                >
                                    A+
                                </button>

                                <button
                                    type="button"
                                    className={activeSticker.bgYn === "Y" ? "profile-story-upload-option-btn active" : "profile-story-upload-option-btn"}
                                    onClick={(e) => {
                                        stopAll(e);
                                        updateActiveSticker("bgYn", activeSticker.bgYn === "Y" ? "N" : "Y");
                                    }}
                                >
                                    {getPageText("bg")} {activeSticker.bgYn === "Y" ? "ON" : "OFF"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="profile-story-upload-empty-guide">
                            {getPageText("emptyGuide")}
                        </div>
                    )}
                </div>

                <div className="profile-story-upload-footer">
                    <button
                        type="button"
                        className="profile-story-upload-cancel-btn"
                        onClick={(e) => {
                            stopAll(e);
                            closeUploadModal();
                        }}
                        disabled={uploading}
                    >
                        {getPageText("cancel")}
                    </button>

                    <button
                        type="button"
                        className="profile-story-upload-submit-btn"
                        onClick={uploadStory}
                        disabled={uploading}
                    >
                        {uploading ? getPageText("uploading") : storyUploadFiles.length + getPageText("uploadCountSuffix")}
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    const viewerModal = viewerOpen && currentStory ? (
        <div
            className="profile-story-viewer-bg"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    closeStoryViewer(e);
                }
            }}
        >
            <div className="profile-story-viewer" onClick={stopOnly}>
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
                                    alt={safeText(currentStory.NICKNAME, getPageText("profileAlt"))}
                                />
                            ) : (
                                <span>{getFirstLetter(currentStory.NICKNAME || currentStory.USER_ID)}</span>
                            )}
                        </div>

                        <div className="profile-story-viewer-user-text">
                            <strong>{safeText(currentStory.NICKNAME, getPageText("traveler"))}</strong>
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
                        src={getStoryImageUrl(currentStory)}
                        alt={getPageText("storyAlt")}
                    />

                    {renderStoryTextList(currentStory)}

                    <button
                        type="button"
                        className="profile-story-click-zone right"
                        onClick={nextStory}
                    ></button>
                </div>

                {currentStoryTextList.length === 0 && currentStory.STORY_CONTENT && (
                    <div className={currentStoryIsMine ? "profile-story-viewer-caption owner-story" : "profile-story-viewer-caption"}>
                        {currentStory.STORY_CONTENT}
                    </div>
                )}

                {currentStoryIsMine && (
                    <>
                        <button
                            type="button"
                            className="profile-story-view-count-btn"
                            onClick={openViewerList}
                        >
                            👁 {getPageText("viewer")} {currentViewCount}
                        </button>

                        <button
                            type="button"
                            className="profile-story-delete-btn"
                            onClick={(e) => removeStory(e, currentStory.STORY_NO)}
                        >
                            {getPageText("delete")}
                        </button>
                    </>
                )}

                {viewerListOpen && (
                    <div className="profile-story-viewer-list-bg" onClick={closeViewerList}>
                        <div className="profile-story-viewer-list-sheet" onClick={stopOnly}>
                            <div className="profile-story-viewer-list-handle"></div>

                            <div className="profile-story-viewer-list-head">
                                <div>
                                    <h3>{getPageText("viewer")}</h3>
                                    <p>{currentViewCount}{getPageText("viewerCountSuffix")}</p>
                                </div>

                                <button type="button" onClick={closeViewerList}>
                                    ×
                                </button>
                            </div>

                            <div className="profile-story-viewer-user-list">
                                {viewerListLoading && (
                                    <div className="profile-story-viewer-list-empty">
                                        {getPageText("loadingViewer")}
                                    </div>
                                )}

                                {!viewerListLoading && viewerList.length === 0 && (
                                    <div className="profile-story-viewer-list-empty">
                                        {getPageText("noViewer")}
                                    </div>
                                )}

                                {!viewerListLoading && viewerList.map(user => (
                                    <button
                                        type="button"
                                        className="profile-story-viewer-user-row"
                                        key={user.VIEW_NO || user.USER_NO}
                                        onClick={(e) => moveViewerProfile(e, user.USER_NO)}
                                    >
                                        <div className="profile-story-viewer-user-profile">
                                            {getImageUrl(user.PROFILE_IMG) !== "" ? (
                                                <img
                                                    src={getImageUrl(user.PROFILE_IMG)}
                                                    alt={safeText(user.NICKNAME, getPageText("profileAlt"))}
                                                />
                                            ) : (
                                                <span>{getFirstLetter(user.NICKNAME || user.USER_ID)}</span>
                                            )}
                                        </div>

                                        <div className="profile-story-viewer-user-info">
                                            <strong>{safeText(user.NICKNAME, getPageText("traveler"))}</strong>
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
    ) : null;

    return (
        <>
            <div className={getProfileStoryClass()} data-lang={language}>
                <div
                    className="profile-story-image"
                    onClick={openStory}
                >
                    {getImageUrl(profileImg) !== "" ? (
                        <img
                            src={getImageUrl(profileImg)}
                            alt={safeText(nickname, getPageText("profileAlt"))}
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
                            stopAll(e);
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
                    multiple
                    ref={fileInputRef}
                    className="profile-story-hidden-input"
                    onChange={selectStoryFile}
                />
            </div>

            {uploadModalOpen && createPortal(uploadModal, document.body)}
            {viewerOpen && currentStory && createPortal(viewerModal, document.body)}
        </>
    );
}

export default ProfileStoryCircle;
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./StoryManage.css";

function StoryManage() {
    const navigate = useNavigate();
    const previewRef = useRef(null);

    const [language, setLanguage] = useState(getLang());

    const [storyList, setStoryList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [viewerModalOpen, setViewerModalOpen] = useState(false);
    const [viewerList, setViewerList] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadPhotoList, setUploadPhotoList] = useState([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [selectedTextNo, setSelectedTextNo] = useState("");
    const [dragTextNo, setDragTextNo] = useState("");
    const [uploading, setUploading] = useState(false);

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

        getMyStoryList();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    function getPageText(key) {
        const ko = {
            loginRequired: "로그인이 필요합니다.",
            myStoryLoadFail: "내 스토리 목록을 불러오지 못했습니다.",
            myStoryLoadError: "내 스토리 목록 조회 중 오류가 발생했습니다.",
            expired: "만료됨",
            active: "공개 중",
            minuteLeft: "분 남음",
            hourLeft: "시간 남음",
            deleteConfirm: "스토리를 삭제할까요? 삭제하면 홈과 프로필에서 보이지 않습니다.",
            deleteDone: "스토리가 삭제되었습니다.",
            deleteFail: "스토리 삭제에 실패했습니다.",
            deleteError: "스토리 삭제 중 오류가 발생했습니다.",
            viewerLoadFail: "본 사람 목록을 불러오지 못했습니다.",
            viewerLoadError: "본 사람 목록 조회 중 오류가 발생했습니다.",
            noUserNo: "사용자 번호가 없어서 프로필로 이동할 수 없습니다.",

            headerLabel: "K-STEP Stories",
            title: "스토리 관리",
            subtitle: "내가 올린 스토리, 조회수, 만료 상태를 확인해요.",
            backTitle: "뒤로가기",
            homeTitle: "홈으로",
            addStoryTitle: "스토리 추가",

            totalStory: "전체 스토리",
            activeStory: "현재 공개 중",
            expiredStory: "지난 스토리",

            loading: "스토리 목록을 불러오는 중입니다...",
            empty: "아직 올린 스토리가 없습니다.",

            activeSectionTitle: "현재 공개 중",
            activeSectionDesc: "24시간이 지나기 전까지 홈과 프로필에 보여요.",
            expiredSectionTitle: "지난 스토리",
            expiredSectionDesc: "24시간이 지나 홈에서는 숨겨진 스토리입니다.",

            storyAlt: "스토리",
            storyDefault: "스토리",
            oldStoryDefault: "지난 스토리",
            createdTime: "올린 시간",
            expireTime: "만료 시간",
            viewer: "본 사람",
            archived: "보관됨",
            delete: "삭제",

            viewerModalTitle: "스토리 본 사람",
            noViewer: "아직 본 사람이 없습니다.",
            traveler: "traveler",

            uploadTitle: "스토리 꾸미기",
            uploadDesc: "사진마다 글을 여러 개 올리고 위치를 바꿀 수 있어요.",
            choosePhoto: "+ 사진 선택",
            changePhoto: "사진 다시 선택",
            addText: "+ 글 추가",
            deleteSelectedText: "선택 글 삭제",
            textGuide: "+ 글 추가를 눌러서 사진 위에 글을 올려주세요.",
            textEditLabel: "선택한 글 수정",
            textEditPlaceholder: "스토리에 올릴 글을 입력하세요.",
            imageRequired: "스토리 이미지를 선택해주세요.",
            imageOnly: "이미지 파일만 선택해주세요.",
            uploadDone: "스토리가 등록되었습니다.",
            uploadFail: "스토리 등록에 실패했습니다.",
            uploadError: "스토리 등록 중 오류가 발생했습니다.",
            cancel: "취소",
            upload: "업로드",
            photo: "사진",
            selectedPhoto: "선택됨",
            noPhoto: "사진을 선택하면 미리보기가 보여요."
        };

        const en = {
            loginRequired: "Please log in first.",
            myStoryLoadFail: "Failed to load your stories.",
            myStoryLoadError: "An error occurred while loading your stories.",
            expired: "Expired",
            active: "Active",
            minuteLeft: " min left",
            hourLeft: " hr left",
            deleteConfirm: "Delete this story? It will no longer appear on Home or Profile.",
            deleteDone: "The story has been deleted.",
            deleteFail: "Failed to delete story.",
            deleteError: "An error occurred while deleting story.",
            viewerLoadFail: "Failed to load viewers.",
            viewerLoadError: "An error occurred while loading viewers.",
            noUserNo: "User number is missing, so profile cannot be opened.",

            headerLabel: "K-STEP Stories",
            title: "Story Management",
            subtitle: "Check your uploaded stories, views, and expiration status.",
            backTitle: "Back",
            homeTitle: "Home",
            addStoryTitle: "Add Story",

            totalStory: "Total Stories",
            activeStory: "Currently Active",
            expiredStory: "Past Stories",

            loading: "Loading stories...",
            empty: "No stories have been uploaded yet.",

            activeSectionTitle: "Currently Active",
            activeSectionDesc: "These stories appear on Home and Profile before 24 hours pass.",
            expiredSectionTitle: "Past Stories",
            expiredSectionDesc: "These stories are hidden from Home after 24 hours.",

            storyAlt: "Story",
            storyDefault: "Story",
            oldStoryDefault: "Past Story",
            createdTime: "Uploaded",
            expireTime: "Expires",
            viewer: "Viewers",
            archived: "Archived",
            delete: "Delete",

            viewerModalTitle: "Story Viewers",
            noViewer: "No viewers yet.",
            traveler: "traveler",

            uploadTitle: "Decorate Story",
            uploadDesc: "Add multiple text stickers to each photo and move them around.",
            choosePhoto: "+ Select Photo",
            changePhoto: "Select Again",
            addText: "+ Add Text",
            deleteSelectedText: "Delete Selected",
            textGuide: "Press + Add Text to place text on the photo.",
            textEditLabel: "Edit Selected Text",
            textEditPlaceholder: "Write your story text.",
            imageRequired: "Please select a story image.",
            imageOnly: "Please select image files only.",
            uploadDone: "Story has been uploaded.",
            uploadFail: "Failed to upload story.",
            uploadError: "An error occurred while uploading story.",
            cancel: "Cancel",
            upload: "Upload",
            photo: "Photo",
            selectedPhoto: "Selected",
            noPhoto: "Preview will appear after selecting a photo."
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

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
                    alert(data.message || getPageText("myStoryLoadFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("myStoryLoadError"));
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
            return getPageText("expired");
        }

        const expireDate = new Date(story.EXPIRE_DATE);

        if (Number.isNaN(expireDate.getTime())) {
            return getPageText("active");
        }

        const now = new Date();
        const diff = expireDate.getTime() - now.getTime();

        if (diff <= 0) {
            return getPageText("expired");
        }

        const minute = 1000 * 60;
        const hour = minute * 60;

        if (diff < hour) {
            return Math.ceil(diff / minute) + getPageText("minuteLeft");
        }

        return Math.ceil(diff / hour) + getPageText("hourLeft");
    }

    function openUploadModal() {
        setUploadPhotoList([]);
        setCurrentPhotoIndex(0);
        setSelectedTextNo("");
        setDragTextNo("");
        setUploadModalOpen(true);
    }

    function closeUploadModal() {
        if (uploading) {
            return;
        }

        uploadPhotoList.forEach(photo => {
            if (photo.PREVIEW_URL) {
                URL.revokeObjectURL(photo.PREVIEW_URL);
            }
        });

        setUploadModalOpen(false);
        setUploadPhotoList([]);
        setCurrentPhotoIndex(0);
        setSelectedTextNo("");
        setDragTextNo("");
    }

    function changeUploadPhotoList(e) {
        const files = Array.from(e.target.files || []);

        if (files.length === 0) {
            return;
        }

        const imageFiles = files.filter(file => {
            return file.type && file.type.startsWith("image/");
        });

        if (imageFiles.length !== files.length) {
            alert(getPageText("imageOnly"));
            e.target.value = "";
            return;
        }

        uploadPhotoList.forEach(photo => {
            if (photo.PREVIEW_URL) {
                URL.revokeObjectURL(photo.PREVIEW_URL);
            }
        });

        const newPhotoList = imageFiles.map((file, index) => {
            return {
                PHOTO_NO: Date.now() + "_" + index,
                FILE: file,
                PREVIEW_URL: URL.createObjectURL(file),
                TEXT_LIST: []
            };
        });

        setUploadPhotoList(newPhotoList);
        setCurrentPhotoIndex(0);
        setSelectedTextNo("");
        setDragTextNo("");
        e.target.value = "";
    }

    function getCurrentPhoto() {
        if (uploadPhotoList.length === 0) {
            return null;
        }

        return uploadPhotoList[currentPhotoIndex] || null;
    }

    function updateCurrentPhoto(callback) {
        setUploadPhotoList(prevList => {
            return prevList.map((photo, index) => {
                if (index !== currentPhotoIndex) {
                    return photo;
                }

                return callback(photo);
            });
        });
    }

    function addStoryText() {
        const currentPhoto = getCurrentPhoto();

        if (!currentPhoto) {
            alert(getPageText("imageRequired"));
            return;
        }

        const textNo = "TEXT_" + Date.now();

        const newText = {
            TEXT_NO: textNo,
            TEXT_CONTENT: language === "en" ? "New text" : "새 글",
            POS_X: 50,
            POS_Y: 50,
            FONT_SIZE: 24,
            FONT_COLOR: "#FFFFFF",
            BG_YN: "Y"
        };

        updateCurrentPhoto(photo => {
            return {
                ...photo,
                TEXT_LIST: [...photo.TEXT_LIST, newText]
            };
        });

        setSelectedTextNo(textNo);
    }

    function deleteSelectedText() {
        if (!selectedTextNo) {
            return;
        }

        updateCurrentPhoto(photo => {
            return {
                ...photo,
                TEXT_LIST: photo.TEXT_LIST.filter(text => text.TEXT_NO !== selectedTextNo)
            };
        });

        setSelectedTextNo("");
    }

    function changeSelectedTextContent(value) {
        if (!selectedTextNo) {
            return;
        }

        updateCurrentPhoto(photo => {
            return {
                ...photo,
                TEXT_LIST: photo.TEXT_LIST.map(text => {
                    if (text.TEXT_NO !== selectedTextNo) {
                        return text;
                    }

                    return {
                        ...text,
                        TEXT_CONTENT: value
                    };
                })
            };
        });
    }

    function getSelectedText() {
        const currentPhoto = getCurrentPhoto();

        if (!currentPhoto) {
            return null;
        }

        return currentPhoto.TEXT_LIST.find(text => text.TEXT_NO === selectedTextNo) || null;
    }

    function moveTextByPointer(e, textNo) {
        if (!previewRef.current) {
            return;
        }

        const rect = previewRef.current.getBoundingClientRect();

        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;

        if (x < 7) {
            x = 7;
        }

        if (x > 93) {
            x = 93;
        }

        if (y < 7) {
            y = 7;
        }

        if (y > 93) {
            y = 93;
        }

        updateCurrentPhoto(photo => {
            return {
                ...photo,
                TEXT_LIST: photo.TEXT_LIST.map(text => {
                    if (text.TEXT_NO !== textNo) {
                        return text;
                    }

                    return {
                        ...text,
                        POS_X: x,
                        POS_Y: y
                    };
                })
            };
        });
    }

    function startTextDrag(e, textNo) {
        e.preventDefault();
        e.stopPropagation();

        setSelectedTextNo(textNo);
        setDragTextNo(textNo);

        if (e.currentTarget.setPointerCapture) {
            e.currentTarget.setPointerCapture(e.pointerId);
        }

        moveTextByPointer(e, textNo);
    }

    function moveTextDrag(e, textNo) {
        if (dragTextNo !== textNo) {
            return;
        }

        moveTextByPointer(e, textNo);
    }

    function endTextDrag() {
        setDragTextNo("");
    }

    async function uploadOneStory(photo) {
        const token = getToken();

        const cleanTextList = photo.TEXT_LIST
            .filter(text => String(text.TEXT_CONTENT || "").trim() !== "")
            .map(text => {
                return {
                    textContent: String(text.TEXT_CONTENT || "").trim(),
                    posX: Number(text.POS_X || 50),
                    posY: Number(text.POS_Y || 50),
                    fontSize: Number(text.FONT_SIZE || 24),
                    fontColor: text.FONT_COLOR || "#FFFFFF",
                    bgYn: text.BG_YN === "Y" ? "Y" : "N"
                };
            });

        const formData = new FormData();
        formData.append("storyImage", photo.FILE);
        formData.append("content", cleanTextList.length > 0 ? cleanTextList[0].textContent : "");
        formData.append("textList", JSON.stringify(cleanTextList));

        const res = await fetch("http://localhost:3010/story/add", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        });

        return await res.json();
    }

    async function uploadStory() {
        if (uploading) {
            return;
        }

        if (uploadPhotoList.length === 0) {
            alert(getPageText("imageRequired"));
            return;
        }

        setUploading(true);

        try {
            for (let i = 0; i < uploadPhotoList.length; i++) {
                const data = await uploadOneStory(uploadPhotoList[i]);

                console.log("스토리 등록", data);

                if (data.result !== "success") {
                    alert(data.message || getPageText("uploadFail"));
                    setUploading(false);
                    return;
                }
            }

            alert(getPageText("uploadDone"));

            uploadPhotoList.forEach(photo => {
                if (photo.PREVIEW_URL) {
                    URL.revokeObjectURL(photo.PREVIEW_URL);
                }
            });

            setUploadModalOpen(false);
            setUploadPhotoList([]);
            setCurrentPhotoIndex(0);
            setSelectedTextNo("");
            setDragTextNo("");

            getMyStoryList();

            window.dispatchEvent(new Event("kstepStoryChange"));
        } catch (err) {
            console.error(err);
            alert(getPageText("uploadError"));
        } finally {
            setUploading(false);
        }
    }

    function removeStory(storyNo) {
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
                console.log("스토리 삭제", data);

                if (data.result === "success") {
                    alert(getPageText("deleteDone"));
                    getMyStoryList();
                } else {
                    alert(data.message || getPageText("deleteFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("deleteError"));
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
                    alert(data.message || getPageText("viewerLoadFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("viewerLoadError"));
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
            alert(getPageText("noUserNo"));
            return;
        }

        closeViewerModal();
        navigate("/profile/" + user.USER_NO);
    }

    const activeStoryList = storyList.filter(story => story.ACTIVE_YN === "Y");
    const expiredStoryList = storyList.filter(story => story.ACTIVE_YN !== "Y");
    const currentPhoto = getCurrentPhoto();
    const selectedText = getSelectedText();

    return (
        <div className="story-manage-page" data-lang={language}>
            <PageDecor />

            <div className="story-manage-container">
                <section className="story-manage-header">
                    <PageDecor variant="box" />

                    <div className="story-manage-brand-row">
                        <div className="story-manage-brand-mark">K</div>

                        <div>
                            <p>{getPageText("headerLabel")}</p>
                            <h1>{getPageText("title")}</h1>
                            <span>{getPageText("subtitle")}</span>
                        </div>
                    </div>

                    <div className="story-manage-header-actions">
                        <button
                            type="button"
                            className="ghost"
                            onClick={() => navigate(-1)}
                            title={getPageText("backTitle")}
                        >
                            ↩
                        </button>

                        <button
                            type="button"
                            className="ghost"
                            onClick={() => navigate("/home")}
                            title={getPageText("homeTitle")}
                        >
                            ⌂
                        </button>

                        <button
                            type="button"
                            className="write"
                            onClick={openUploadModal}
                            title={getPageText("addStoryTitle")}
                        >
                            +
                        </button>
                    </div>
                </section>

                <section className="story-manage-summary">
                    <div>
                        <strong>{storyList.length}</strong>
                        <span>{getPageText("totalStory")}</span>
                    </div>

                    <div>
                        <strong>{activeStoryList.length}</strong>
                        <span>{getPageText("activeStory")}</span>
                    </div>

                    <div>
                        <strong>{expiredStoryList.length}</strong>
                        <span>{getPageText("expiredStory")}</span>
                    </div>
                </section>

                {loading && (
                    <div className="story-manage-empty">
                        {getPageText("loading")}
                    </div>
                )}

                {!loading && storyList.length === 0 && (
                    <div className="story-manage-empty">
                        {getPageText("empty")}
                    </div>
                )}

                {!loading && activeStoryList.length > 0 && (
                    <section className="story-manage-section">
                        <div className="story-manage-section-title">
                            <span>●</span>

                            <div>
                                <h2>{getPageText("activeSectionTitle")}</h2>
                                <p>{getPageText("activeSectionDesc")}</p>
                            </div>
                        </div>

                        <div className="story-manage-grid">
                            {activeStoryList.map(story => (
                                <article className="story-manage-card active" key={story.STORY_NO}>
                                    <div className="story-manage-image">
                                        <img
                                            src={getImageUrl(story.STORY_IMG)}
                                            alt={getPageText("storyAlt")}
                                        />

                                        <span className="story-manage-status">
                                            {getPageText("active")}
                                        </span>
                                    </div>

                                    <div className="story-manage-card-body">
                                        <h3>{story.STORY_CONTENT || getPageText("storyDefault")}</h3>

                                        <p>{getPageText("createdTime")} {story.CDATE_TEXT}</p>
                                        <p>{getPageText("expireTime")} {story.EXPIRE_TEXT}</p>

                                        <div className="story-manage-meta">
                                            <span>{getRemainText(story)}</span>

                                            <button type="button" onClick={() => openViewerList(story)}>
                                                {getPageText("viewer")} {story.VIEW_COUNT || 0}
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            className="story-manage-delete-btn"
                                            onClick={() => removeStory(story.STORY_NO)}
                                        >
                                            {getPageText("delete")}
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
                                <h2>{getPageText("expiredSectionTitle")}</h2>
                                <p>{getPageText("expiredSectionDesc")}</p>
                            </div>
                        </div>

                        <div className="story-manage-grid">
                            {expiredStoryList.map(story => (
                                <article className="story-manage-card expired" key={story.STORY_NO}>
                                    <div className="story-manage-image">
                                        <img
                                            src={getImageUrl(story.STORY_IMG)}
                                            alt={getPageText("storyAlt")}
                                        />

                                        <span className="story-manage-status">
                                            {getPageText("expired")}
                                        </span>
                                    </div>

                                    <div className="story-manage-card-body">
                                        <h3>{story.STORY_CONTENT || getPageText("oldStoryDefault")}</h3>

                                        <p>{getPageText("createdTime")} {story.CDATE_TEXT}</p>
                                        <p>{getPageText("expireTime")} {story.EXPIRE_TEXT}</p>

                                        <div className="story-manage-meta">
                                            <span>{getPageText("archived")}</span>

                                            <button type="button" onClick={() => openViewerList(story)}>
                                                {getPageText("viewer")} {story.VIEW_COUNT || 0}
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            className="story-manage-delete-btn"
                                            onClick={() => removeStory(story.STORY_NO)}
                                        >
                                            {getPageText("delete")}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <ScrollTopButton />

            {uploadModalOpen && (
                <div className="story-upload-modal-bg" onClick={closeUploadModal}>
                    <div className="story-upload-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="story-upload-modal-head">
                            <div>
                                <h2>{getPageText("uploadTitle")}</h2>
                                <p>{getPageText("uploadDesc")}</p>
                            </div>

                            <button type="button" onClick={closeUploadModal}>
                                ×
                            </button>
                        </div>

                        <div className="story-upload-modal-body">
                            <div className="story-upload-file-row">
                                <label className="story-upload-file-btn">
                                    {uploadPhotoList.length > 0 ? getPageText("changePhoto") : getPageText("choosePhoto")}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={changeUploadPhotoList}
                                    />
                                </label>

                                {uploadPhotoList.length > 0 && (
                                    <span>
                                        {uploadPhotoList.length} {getPageText("photo")}
                                    </span>
                                )}
                            </div>

                            {currentPhoto ? (
                                <div className="story-upload-preview-card">
                                    <div className="story-upload-preview" ref={previewRef}>
                                        <img src={currentPhoto.PREVIEW_URL} alt={getPageText("storyAlt")} />

                                        {currentPhoto.TEXT_LIST.map(text => (
                                            <div
                                                key={text.TEXT_NO}
                                                className={
                                                    selectedTextNo === text.TEXT_NO
                                                        ? "story-upload-text active"
                                                        : "story-upload-text"
                                                }
                                                style={{
                                                    left: text.POS_X + "%",
                                                    top: text.POS_Y + "%"
                                                }}
                                                onPointerDown={(e) => startTextDrag(e, text.TEXT_NO)}
                                                onPointerMove={(e) => moveTextDrag(e, text.TEXT_NO)}
                                                onPointerUp={endTextDrag}
                                                onPointerCancel={endTextDrag}
                                            >
                                                {text.TEXT_CONTENT}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="story-upload-no-photo">
                                    <span>✿</span>
                                    <p>{getPageText("noPhoto")}</p>
                                </div>
                            )}

                            {uploadPhotoList.length > 1 && (
                                <div className="story-upload-photo-tabs">
                                    {uploadPhotoList.map((photo, index) => (
                                        <button
                                            type="button"
                                            key={photo.PHOTO_NO}
                                            className={currentPhotoIndex === index ? "active" : ""}
                                            onClick={() => {
                                                setCurrentPhotoIndex(index);
                                                setSelectedTextNo("");
                                                setDragTextNo("");
                                            }}
                                        >
                                            {getPageText("photo")} {index + 1}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="story-upload-tool-row">
                                <button
                                    type="button"
                                    className="story-upload-main-tool"
                                    onClick={addStoryText}
                                    disabled={!currentPhoto}
                                >
                                    {getPageText("addText")}
                                </button>

                                <button
                                    type="button"
                                    className="story-upload-sub-tool"
                                    onClick={deleteSelectedText}
                                    disabled={!selectedTextNo}
                                >
                                    {getPageText("deleteSelectedText")}
                                </button>
                            </div>

                            {selectedText ? (
                                <div className="story-upload-text-editor">
                                    <label>{getPageText("textEditLabel")}</label>

                                    <textarea
                                        value={selectedText.TEXT_CONTENT}
                                        onChange={(e) => changeSelectedTextContent(e.target.value)}
                                        placeholder={getPageText("textEditPlaceholder")}
                                        maxLength={80}
                                    />
                                </div>
                            ) : (
                                <div className="story-upload-guide">
                                    {getPageText("textGuide")}
                                </div>
                            )}
                        </div>

                        <div className="story-upload-modal-bottom">
                            <button
                                type="button"
                                className="story-upload-cancel-btn"
                                onClick={closeUploadModal}
                                disabled={uploading}
                            >
                                {getPageText("cancel")}
                            </button>

                            <button
                                type="button"
                                className="story-upload-submit-btn"
                                onClick={uploadStory}
                                disabled={uploading}
                            >
                                {uploading ? getPageText("loading") : getPageText("upload")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewerModalOpen && (
                <div className="story-viewer-modal-bg" onClick={closeViewerModal}>
                    <div className="story-viewer-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="story-viewer-modal-head">
                            <div>
                                <h2>{getPageText("viewerModalTitle")}</h2>

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
                                    {getPageText("noViewer")}
                                </div>
                            )}

                            {viewerList.map(user => (
                                <div
                                    className="story-viewer-user-item"
                                    key={user.VIEW_NO}
                                    onClick={() => goViewerProfile(user)}
                                >
                                    <div className="story-viewer-user-avatar">
                                        {getImageUrl(user.PROFILE_IMG) !== "" ? (
                                            <img
                                                src={getImageUrl(user.PROFILE_IMG)}
                                                alt={user.NICKNAME}
                                            />
                                        ) : (
                                            <span>{getFirstLetter(user.NICKNAME || user.USER_ID)}</span>
                                        )}
                                    </div>

                                    <div>
                                        <strong>{user.NICKNAME || getPageText("traveler")}</strong>
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
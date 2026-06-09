import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./Chat.css";

function Chat() {
    const navigate = useNavigate();
    const location = useLocation();
    const messageEndRef = useRef(null);

    const [language, setLanguage] = useState(getLang());

    const nickname = localStorage.getItem("nickname") || getPageText("defaultTraveler");

    const [roomList, setRoomList] = useState([]);
    const [recommendUserList, setRecommendUserList] = useState([]);

    const [selectedRoomNo, setSelectedRoomNo] = useState(null);
    const [messageList, setMessageList] = useState([]);
    const [message, setMessage] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [loading, setLoading] = useState(false);

    const [deleteTargetMessage, setDeleteTargetMessage] = useState(null);
    const [deleteOption, setDeleteOption] = useState("everyone");

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
            navigate("/", { replace: true });
            return;
        }

        const moveRoomNo =
            location.state?.roomNo ||
            sessionStorage.getItem("selectedChatRoomNo") ||
            selectedRoomNo ||
            null;

        if (location.state?.roomNo || sessionStorage.getItem("selectedChatRoomNo")) {
            sessionStorage.removeItem("selectedChatRoomNo");
        }

        pingOnlineStatus();
        getRoomList(moveRoomNo, false);
        getRecommendUserList();

        if (moveRoomNo) {
            setSelectedRoomNo(moveRoomNo);
        }

        const timer = setInterval(() => {
            pingOnlineStatus();
            getRoomList(selectedRoomNo, true);

            if (selectedRoomNo) {
                getMessageList(selectedRoomNo, true);
            }
        }, 30000);

        return () => {
            clearInterval(timer);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, selectedRoomNo]);

    useEffect(() => {
        if (selectedRoomNo) {
            getMessageList(selectedRoomNo, false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRoomNo]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({
                behavior: "smooth"
            });
        }
    }, [messageList]);

    function getPageText(key) {
        const ko = {
            defaultTraveler: "여행자",
            loginRequired: "로그인이 필요합니다.",
            recommendLoadFail: "추천 사용자 목록을 불러오지 못했습니다.",
            roomLoadError: "채팅방 목록을 불러오는 중 오류가 발생했습니다.",
            messageLoadError: "메시지 목록을 불러오는 중 오류가 발생했습니다.",
            roomOpenError: "채팅방을 여는 중 오류가 발생했습니다.",
            messageRequired: "메시지를 입력해주세요.",
            messageLimit: "메시지는 1000자 이하로 입력해주세요.",
            roomRequired: "채팅방을 선택해주세요.",
            messageSendError: "메시지 전송 중 오류가 발생했습니다.",
            messageDeleteError: "메시지 삭제 중 오류가 발생했습니다.",
            roomDeleteError: "채팅방 삭제 중 오류가 발생했습니다.",
            noUserInfo: "사용자 정보가 없습니다.",

            deletedMessage: "삭제된 메시지입니다.",
            offline: "오프라인",
            online: "온라인",
            lastActive: "오프라인 · 마지막 활동 ",

            topLabel: "K-STEP Direct",
            topTitle: "여행자 메시지",
            topCopyBefore: "",
            topCopyAfter: "님, 여행자와 루트 이야기를 나눠보세요.",
            homeTitle: "홈으로",
            createTitle: "작성",

            listLabel: "K-STEP Direct",
            roomListTitle: "대화 목록",
            refresh: "새로고침",
            searchPlaceholder: "여행자, 지역, 키워드 검색",

            loadingRooms: "채팅방을 불러오는 중입니다.",
            noSearchResult: "검색 결과가 없습니다.",
            noChatTitle: "아직 대화가 없어요",
            noChatDesc: "추천 여행자와 첫 대화를 시작해보세요.",
            noRecommendUser: "추천할 여행자가 아직 없습니다.",
            start: "시작",
            profileAlt: "프로필",
            traveler: "여행자",
            noIntro: "소개가 없습니다.",
            profileView: "프로필 보기",

            profile: "프로필",
            deleteRoom: "나에게서만 채팅방 삭제",
            roomDeleteConfirmSuffix: "님과의 채팅방을 나에게서만 삭제할까요?",
            conversation: "대화",
            emptyMessage: "아직 대화가 없습니다.",
            firstMessage: "첫 메시지를 보내보세요.",
            delete: "삭제",
            inputPlaceholder: "메시지를 입력하세요. Shift + Enter로 줄바꿈",
            send: "전송",

            noRoomLabel: "K-STEP Direct",
            noRoomTitleBefore: "",
            noRoomTitleAfter: "님, 여행 대화를 시작해보세요",
            noRoomDesc1: "여행 루트가 궁금한 사람에게 메시지를 보내거나,",
            noRoomDesc2: "추천 여행자와 새 대화를 시작할 수 있어요.",
            exploreTraveler: "여행자 탐색",
            recommendChatUser: "추천 대화 상대",

            deleteModalTitle: "메시지 삭제",
            deleteForEveryone: "모두에게서 삭제",
            deleteForMe: "나에게서만 삭제",
            deleteHelp: "상대방이 보낸 메시지는 나에게서만 삭제할 수 있어요.",
            cancel: "취소",
            confirm: "확인"
        };

        const en = {
            defaultTraveler: "traveler",
            loginRequired: "Please log in first.",
            recommendLoadFail: "Failed to load recommended users.",
            roomLoadError: "An error occurred while loading chat rooms.",
            messageLoadError: "An error occurred while loading messages.",
            roomOpenError: "An error occurred while opening chat room.",
            messageRequired: "Please enter a message.",
            messageLimit: "Messages can be up to 1000 characters.",
            roomRequired: "Please select a chat room.",
            messageSendError: "An error occurred while sending message.",
            messageDeleteError: "An error occurred while deleting message.",
            roomDeleteError: "An error occurred while deleting chat room.",
            noUserInfo: "User information is missing.",

            deletedMessage: "This message was deleted.",
            offline: "Offline",
            online: "Online",
            lastActive: "Offline · last active ",

            topLabel: "K-STEP Direct",
            topTitle: "Traveler Messages",
            topCopyBefore: "",
            topCopyAfter: ", talk about travel routes with other travelers.",
            homeTitle: "Home",
            createTitle: "Create",

            listLabel: "K-STEP Direct",
            roomListTitle: "Chats",
            refresh: "Refresh",
            searchPlaceholder: "Search traveler, area, or keyword",

            loadingRooms: "Loading chat rooms.",
            noSearchResult: "No search results.",
            noChatTitle: "No chats yet",
            noChatDesc: "Start your first conversation with a recommended traveler.",
            noRecommendUser: "No recommended travelers yet.",
            start: "Start",
            profileAlt: "Profile",
            traveler: "traveler",
            noIntro: "No introduction yet.",
            profileView: "View Profile",

            profile: "Profile",
            deleteRoom: "Delete chat for me",
            roomDeleteConfirmSuffix: "'s chat room for me only?",
            conversation: "Conversation",
            emptyMessage: "No messages yet.",
            firstMessage: "Send the first message.",
            delete: "Delete",
            inputPlaceholder: "Enter a message. Shift + Enter for a new line",
            send: "Send",

            noRoomLabel: "K-STEP Direct",
            noRoomTitleBefore: "",
            noRoomTitleAfter: ", start a travel conversation",
            noRoomDesc1: "Send a message to someone whose travel route you are curious about,",
            noRoomDesc2: "or start a new chat with a recommended traveler.",
            exploreTraveler: "Explore Travelers",
            recommendChatUser: "Recommended Chat Partners",

            deleteModalTitle: "Delete Message",
            deleteForEveryone: "Delete for everyone",
            deleteForMe: "Delete for me",
            deleteHelp: "Messages sent by the other person can only be deleted for you.",
            cancel: "Cancel",
            confirm: "Confirm"
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

    function getToken() {
        return localStorage.getItem("token");
    }

    function refreshMenuCount() {
        window.dispatchEvent(new Event("kstepMenuCountRefresh"));
    }

    function moveLoginPage(message) {
        localStorage.removeItem("token");
        localStorage.removeItem("userNo");
        localStorage.removeItem("userId");
        localStorage.removeItem("nickname");
        localStorage.removeItem("userType");

        refreshMenuCount();

        alert(message || getPageText("loginRequired"));
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
            moveLoginPage(data.message || getPageText("loginRequired"));
            return true;
        }

        return false;
    }

    function pingOnlineStatus() {
        const token = getToken();

        if (!token) {
            return;
        }

        fetch("http://localhost:3010/chat/status/ping", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("온라인 상태 갱신", data);

                if (handleLoginRequired(data)) {
                    return;
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    function refreshChat() {
        pingOnlineStatus();
        getRoomList(selectedRoomNo, false);
        getRecommendUserList();

        if (selectedRoomNo) {
            getMessageList(selectedRoomNo, false);
        }

        refreshMenuCount();
    }

    function getRecommendUserList() {
        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        fetch("http://localhost:3010/user/recommend/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("추천 사용자 목록", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setRecommendUserList(data.list || []);
                } else {
                    console.log(data.message || getPageText("recommendLoadFail"));
                    setRecommendUserList([]);
                }
            })
            .catch(err => {
                console.error(err);
                setRecommendUserList([]);
            });
    }

    function getCurrentRoom() {
        const room = roomList.find(item => String(item.ROOM_NO) === String(selectedRoomNo));

        if (!room) {
            return null;
        }

        return room;
    }

    function getFirstLetter(value) {
        if (!value) {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
    }

    function getProfileImageUrl(value) {
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

    function getDisplayTime(value) {
        if (!value) {
            return "";
        }

        const text = String(value);

        if (text.length >= 16) {
            return text.substring(11, 16);
        }

        return text;
    }

    function getMessageText(item) {
        if (!item) {
            return "";
        }

        if (item.MESSAGE_STATUS === "D") {
            return getPageText("deletedMessage");
        }

        return item.CONTENT || item.MESSAGE_CONTENT || "";
    }

    function showUnreadOne(item) {
        if (!item) {
            return false;
        }

        if (item.MINE_YN !== "Y") {
            return false;
        }

        if (item.MESSAGE_STATUS === "D") {
            return false;
        }

        if (item.READ_YN === "Y") {
            return false;
        }

        return true;
    }

    function getOnlineText(room) {
        if (!room) {
            return getPageText("offline");
        }

        if (room.ONLINE_YN === "Y") {
            return getPageText("online");
        }

        if (room.LAST_ACTIVE_TEXT) {
            return getPageText("lastActive") + room.LAST_ACTIVE_TEXT;
        }

        return getPageText("offline");
    }

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
    }

    function getRoomList(selectRoomNo, silent) {
        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        if (!silent) {
            setLoading(true);
        }

        fetch("http://localhost:3010/chat/room/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("채팅방 목록", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    const list = data.list || [];

                    setRoomList(list);
                    refreshMenuCount();

                    if (selectRoomNo) {
                        const selectedExists = list.some(item => String(item.ROOM_NO) === String(selectRoomNo));

                        if (selectedExists) {
                            setSelectedRoomNo(selectRoomNo);
                        } else if (list.length > 0) {
                            setSelectedRoomNo(list[0].ROOM_NO);
                        } else {
                            setSelectedRoomNo(null);
                            setMessageList([]);
                        }

                        return;
                    }

                    if (!selectedRoomNo && list.length > 0) {
                        setSelectedRoomNo(list[0].ROOM_NO);
                    } else if (selectedRoomNo) {
                        const exists = list.some(item => String(item.ROOM_NO) === String(selectedRoomNo));

                        if (!exists && list.length > 0) {
                            setSelectedRoomNo(list[0].ROOM_NO);
                        }

                        if (!exists && list.length === 0) {
                            setSelectedRoomNo(null);
                            setMessageList([]);
                        }
                    }
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("roomLoadError"));
            })
            .finally(() => {
                if (!silent) {
                    setLoading(false);
                }
            });
    }

    function getMessageList(roomNo, silent) {
        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        fetch("http://localhost:3010/chat/message/list", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                roomNo: roomNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("메시지 목록", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setMessageList(data.list || []);

                    setRoomList(prevList =>
                        prevList.map(room => {
                            if (String(room.ROOM_NO) === String(roomNo)) {
                                return {
                                    ...room,
                                    UNREAD_COUNT: 0
                                };
                            }

                            return room;
                        })
                    );

                    refreshMenuCount();

                    if (!silent) {
                        getRoomList(roomNo, true);
                    }
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("messageLoadError"));
            });
    }

    function openRoom(targetUserNo) {
        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        fetch("http://localhost:3010/chat/room/open", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                targetUserNo: targetUserNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("채팅방 열기", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setSelectedRoomNo(data.roomNo);
                    getRoomList(data.roomNo, false);
                    refreshMenuCount();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("roomOpenError"));
            });
    }

    function selectRoom(roomNo) {
        setSelectedRoomNo(roomNo);
        setMessage("");
        refreshMenuCount();
    }

    function sendMessage() {
        const cleanMessage = message.trim();

        if (cleanMessage === "") {
            alert(getPageText("messageRequired"));
            return;
        }

        if (cleanMessage.length > 1000) {
            alert(getPageText("messageLimit"));
            return;
        }

        if (!selectedRoomNo) {
            alert(getPageText("roomRequired"));
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        fetch("http://localhost:3010/chat/message/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                roomNo: selectedRoomNo,
                content: cleanMessage
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("메시지 전송", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setMessage("");
                    getMessageList(selectedRoomNo, false);
                    getRoomList(selectedRoomNo, true);
                    refreshMenuCount();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("messageSendError"));
            });
    }

    function enterSend(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function openDeleteModal(item) {
        if (!item) {
            return;
        }

        if (item.MESSAGE_STATUS === "D") {
            return;
        }

        setDeleteTargetMessage(item);

        if (item.MINE_YN === "Y") {
            setDeleteOption("everyone");
        } else {
            setDeleteOption("me");
        }
    }

    function closeDeleteModal() {
        setDeleteTargetMessage(null);
        setDeleteOption("everyone");
    }

    function confirmDeleteMessage() {
        if (!deleteTargetMessage) {
            return;
        }

        if (deleteOption === "everyone") {
            deleteMessageForEveryone(deleteTargetMessage.MESSAGE_NO);
            return;
        }

        deleteMessageForMe(deleteTargetMessage.MESSAGE_NO);
    }

    function deleteMessageForMe(messageNo) {
        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        fetch("http://localhost:3010/chat/message/delete-for-me", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                messageNo: messageNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("나에게서만 메시지 삭제", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    closeDeleteModal();
                    getMessageList(selectedRoomNo, false);
                    getRoomList(selectedRoomNo, true);
                    refreshMenuCount();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("messageDeleteError"));
            });
    }

    function deleteMessageForEveryone(messageNo) {
        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        fetch("http://localhost:3010/chat/message/delete-for-everyone", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                messageNo: messageNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("모두에게서 메시지 삭제", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    closeDeleteModal();
                    getMessageList(selectedRoomNo, false);
                    getRoomList(selectedRoomNo, true);
                    refreshMenuCount();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("messageDeleteError"));
            });
    }

    function deleteRoomForMe() {
        const currentRoom = getCurrentRoom();

        if (!currentRoom) {
            return;
        }

        const confirmMessage = language === "en"
            ? "Delete " + currentRoom.NICKNAME + getPageText("roomDeleteConfirmSuffix")
            : currentRoom.NICKNAME + getPageText("roomDeleteConfirmSuffix");

        if (!window.confirm(confirmMessage)) {
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        fetch("http://localhost:3010/chat/room/delete-for-me", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                roomNo: selectedRoomNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("나에게서만 채팅방 삭제", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setSelectedRoomNo(null);
                    setMessageList([]);
                    getRoomList(null, false);
                    refreshMenuCount();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("roomDeleteError"));
            });
    }

    function moveProfile(userNo, e) {
        if (e) {
            e.stopPropagation();
        }

        if (!userNo) {
            alert(getPageText("noUserInfo"));
            return;
        }

        navigate("/profile/" + userNo);
    }

    function getFilteredRoomList() {
        const keyword = searchKeyword.trim().toLowerCase();

        if (keyword === "") {
            return roomList;
        }

        return roomList.filter(room =>
            String(room.NICKNAME || "").toLowerCase().includes(keyword) ||
            String(room.USER_ID || "").toLowerCase().includes(keyword) ||
            String(room.USER_TYPE || "").toLowerCase().includes(keyword) ||
            String(room.INTRO || "").toLowerCase().includes(keyword) ||
            String(room.LAST_MESSAGE || "").toLowerCase().includes(keyword)
        );
    }

    const currentRoom = getCurrentRoom();
    const filteredRoomList = getFilteredRoomList();

    return (
        <div className="chat-page" data-lang={language}>
            <PageDecor />

            <div className="chat-shell">
                <section className="chat-app-top">
                    <PageDecor variant="box" />

                    <div className="chat-brand-row">
                        <div className="chat-brand-mark">K</div>

                        <div>
                            <p className="chat-top-label">{getPageText("topLabel")}</p>
                            <h1>{getPageText("topTitle")}</h1>
                            <p className="chat-top-copy">
                                {getPageText("topCopyBefore")}{nickname}{getPageText("topCopyAfter")}
                            </p>
                        </div>
                    </div>

                    <div className="chat-top-icons">
                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                            title={getPageText("homeTitle")}
                        >
                            ⌂
                        </button>

                        <button
                            type="button"
                            className="write"
                            onClick={() => navigate("/feed/new")}
                            title={getPageText("createTitle")}
                        >
                            +
                        </button>
                    </div>
                </section>

                <div className="chat-container">
                    <aside className="chat-list-card">
                        <div className="chat-list-header">
                            <div>
                                <p>{getPageText("listLabel")}</p>
                                <h1>{getPageText("roomListTitle")}</h1>
                            </div>

                            <div className="chat-list-header-actions">
                                <button
                                    className="chat-home-btn"
                                    onClick={refreshChat}
                                    type="button"
                                >
                                    {getPageText("refresh")}
                                </button>
                            </div>
                        </div>

                        <div className="chat-search-box">
                            <span>⌕</span>

                            <input
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder={getPageText("searchPlaceholder")}
                            />
                        </div>

                        <div className="chat-user-list">
                            {loading && (
                                <div className="chat-empty-user">
                                    {getPageText("loadingRooms")}
                                </div>
                            )}

                            {!loading && filteredRoomList.length === 0 && searchKeyword.trim() !== "" && (
                                <div className="chat-empty-user">
                                    {getPageText("noSearchResult")}
                                </div>
                            )}

                            {!loading && roomList.length === 0 && searchKeyword.trim() === "" && (
                                <>
                                    <div className="chat-empty-user pretty">
                                        <strong>{getPageText("noChatTitle")}</strong>
                                        <span>{getPageText("noChatDesc")}</span>
                                    </div>

                                    {recommendUserList.length === 0 && (
                                        <div className="chat-empty-user">
                                            {getPageText("noRecommendUser")}
                                        </div>
                                    )}

                                    {recommendUserList.map(user => (
                                        <div
                                            className="chat-user-item"
                                            key={user.USER_NO}
                                            onClick={() => openRoom(user.USER_NO)}
                                        >
                                            <div className="chat-user-avatar-wrap">
                                                <div className="chat-user-avatar">
                                                    {getProfileImageUrl(user.PROFILE_IMG) !== "" ? (
                                                        <img
                                                            src={getProfileImageUrl(user.PROFILE_IMG)}
                                                            alt={safeText(user.NICKNAME, getPageText("profileAlt"))}
                                                        />
                                                    ) : (
                                                        getFirstLetter(user.NICKNAME || user.USER_ID)
                                                    )}
                                                </div>
                                            </div>

                                            <div className="chat-user-info">
                                                <div className="chat-user-name-row">
                                                    <strong>{safeText(user.NICKNAME, getPageText("traveler"))}</strong>
                                                    <span>{getPageText("start")}</span>
                                                </div>

                                                <p>{safeText(user.INTRO || user.BIO, getPageText("noIntro"))}</p>

                                                <div className="chat-user-chip-row">
                                                    <em>{safeText(user.USER_TYPE, "TRAVELER")}</em>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {!loading && filteredRoomList.map(room => (
                                <div
                                    className={String(selectedRoomNo) === String(room.ROOM_NO) ? "chat-user-item active" : "chat-user-item"}
                                    key={room.ROOM_NO}
                                    onClick={() => selectRoom(room.ROOM_NO)}
                                >
                                    <div
                                        className="chat-user-avatar-wrap"
                                        onClick={(e) => moveProfile(room.OTHER_USER_NO, e)}
                                        title={getPageText("profileView")}
                                    >
                                        <div className="chat-user-avatar">
                                            {getProfileImageUrl(room.PROFILE_IMG) !== "" ? (
                                                <img
                                                    src={getProfileImageUrl(room.PROFILE_IMG)}
                                                    alt={safeText(room.NICKNAME, getPageText("profileAlt"))}
                                                />
                                            ) : (
                                                getFirstLetter(room.NICKNAME || room.USER_ID)
                                            )}
                                        </div>

                                        <span className={room.ONLINE_YN === "Y" ? "chat-online-dot active" : "chat-online-dot"}></span>
                                    </div>

                                    <div className="chat-user-info">
                                        <div className="chat-user-name-row">
                                            <strong>{safeText(room.NICKNAME, getPageText("traveler"))}</strong>
                                            <span>{getDisplayTime(room.LAST_MESSAGE_DATE)}</span>
                                        </div>

                                        <p>{room.LAST_MESSAGE}</p>

                                        <div className="chat-user-chip-row">
                                            <em>{safeText(room.USER_TYPE, "TRAVELER")}</em>
                                            <em className={room.ONLINE_YN === "Y" ? "online" : ""}>
                                                {room.ONLINE_YN === "Y" ? getPageText("online") : getPageText("offline")}
                                            </em>
                                        </div>
                                    </div>

                                    {room.UNREAD_COUNT > 0 && (
                                        <span className="chat-unread-count">
                                            {room.UNREAD_COUNT}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </aside>

                    <section className="chat-room-card">
                        {currentRoom ? (
                            <>
                                <div className="chat-room-header">
                                    <div className="chat-room-title">
                                        <div
                                            className="chat-user-avatar-wrap"
                                            onClick={(e) => moveProfile(currentRoom.OTHER_USER_NO, e)}
                                            title={getPageText("profileView")}
                                        >
                                            <div className="chat-user-avatar big">
                                                {getProfileImageUrl(currentRoom.PROFILE_IMG) !== "" ? (
                                                    <img
                                                        src={getProfileImageUrl(currentRoom.PROFILE_IMG)}
                                                        alt={safeText(currentRoom.NICKNAME, getPageText("profileAlt"))}
                                                    />
                                                ) : (
                                                    getFirstLetter(currentRoom.NICKNAME || currentRoom.USER_ID)
                                                )}
                                            </div>

                                            <span className={currentRoom.ONLINE_YN === "Y" ? "chat-online-dot big active" : "chat-online-dot big"}></span>
                                        </div>

                                        <div
                                            className="chat-room-profile-text"
                                            onClick={(e) => moveProfile(currentRoom.OTHER_USER_NO, e)}
                                        >
                                            <strong>{safeText(currentRoom.NICKNAME, getPageText("traveler"))}</strong>
                                            <p>
                                                {safeText(currentRoom.USER_TYPE, "TRAVELER")} · {getOnlineText(currentRoom)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="chat-room-actions">
                                        <button
                                            type="button"
                                            className="chat-profile-btn"
                                            onClick={(e) => moveProfile(currentRoom.OTHER_USER_NO, e)}
                                        >
                                            {getPageText("profile")}
                                        </button>

                                        <button
                                            type="button"
                                            className="chat-delete-room-btn"
                                            onClick={deleteRoomForMe}
                                        >
                                            {getPageText("deleteRoom")}
                                        </button>
                                    </div>
                                </div>

                                <div className="chat-message-area">
                                    <div className="chat-date-divider">
                                        <span>{getPageText("conversation")}</span>
                                    </div>

                                    {messageList.length === 0 && (
                                        <div className="chat-empty-message">
                                            {getPageText("emptyMessage")}
                                            <br />
                                            {getPageText("firstMessage")}
                                        </div>
                                    )}

                                    {messageList.map(item => (
                                        <div
                                            key={item.MESSAGE_NO}
                                            className={item.MINE_YN === "Y" ? "chat-message-row me" : "chat-message-row other"}
                                        >
                                            {item.MINE_YN !== "Y" && (
                                                <div
                                                    className="chat-message-avatar"
                                                    onClick={(e) => moveProfile(currentRoom.OTHER_USER_NO, e)}
                                                >
                                                    {getProfileImageUrl(currentRoom.PROFILE_IMG) !== "" ? (
                                                        <img
                                                            src={getProfileImageUrl(currentRoom.PROFILE_IMG)}
                                                            alt={safeText(currentRoom.NICKNAME, getPageText("profileAlt"))}
                                                        />
                                                    ) : (
                                                        getFirstLetter(currentRoom.NICKNAME || currentRoom.USER_ID)
                                                    )}
                                                </div>
                                            )}

                                            <div className="chat-message-group">
                                                {item.MINE_YN !== "Y" && (
                                                    <strong
                                                        className="chat-message-name"
                                                        onClick={(e) => moveProfile(currentRoom.OTHER_USER_NO, e)}
                                                    >
                                                        {safeText(currentRoom.NICKNAME, getPageText("traveler"))}
                                                    </strong>
                                                )}

                                                <div className="chat-message-bubble-wrap">
                                                    <div className={item.MESSAGE_STATUS === "D" ? "chat-message deleted" : item.MINE_YN === "Y" ? "chat-message me" : "chat-message other"}>
                                                        {getMessageText(item)}
                                                    </div>

                                                    {item.MESSAGE_STATUS !== "D" && (
                                                        <button
                                                            type="button"
                                                            className="chat-message-delete-btn"
                                                            onClick={() => openDeleteModal(item)}
                                                        >
                                                            {getPageText("delete")}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="chat-message-meta">
                                                    {showUnreadOne(item) && (
                                                        <span className="chat-message-unread-one">1</span>
                                                    )}

                                                    <span className="chat-message-time">
                                                        {getDisplayTime(item.CDATE_TEXT)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div ref={messageEndRef}></div>
                                </div>

                                <div className="chat-input-area">
                                    <div className="chat-input-box">
                                        <textarea
                                            value={message}
                                            maxLength={1000}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={enterSend}
                                            placeholder={getPageText("inputPlaceholder")}
                                        ></textarea>

                                        <span className="chat-message-count">
                                            {message.length}/1000
                                        </span>
                                    </div>

                                    <button
                                        className={message.trim() === "" ? "chat-send-btn disabled" : "chat-send-btn"}
                                        onClick={sendMessage}
                                    >
                                        {getPageText("send")}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="chat-no-room">
                                <div className="chat-no-room-icon">✉</div>

                                <p className="chat-no-room-label">{getPageText("noRoomLabel")}</p>

                                <h2>{getPageText("noRoomTitleBefore")}{nickname}{getPageText("noRoomTitleAfter")}</h2>

                                <p>
                                    {getPageText("noRoomDesc1")}
                                    <br />
                                    {getPageText("noRoomDesc2")}
                                </p>

                                <div className="chat-no-room-actions">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/explore")}
                                    >
                                        {getPageText("exploreTraveler")}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={refreshChat}
                                    >
                                        {getPageText("refresh")}
                                    </button>
                                </div>

                                {recommendUserList.length > 0 && (
                                    <div className="chat-start-section">
                                        <strong>{getPageText("recommendChatUser")}</strong>

                                        <div className="chat-start-user-row">
                                            {recommendUserList.slice(0, 4).map(user => (
                                                <button
                                                    type="button"
                                                    className="chat-start-user"
                                                    key={user.USER_NO}
                                                    onClick={() => openRoom(user.USER_NO)}
                                                >
                                                    <span className="chat-start-avatar">
                                                        {getProfileImageUrl(user.PROFILE_IMG) !== "" ? (
                                                            <img
                                                                src={getProfileImageUrl(user.PROFILE_IMG)}
                                                                alt={safeText(user.NICKNAME, getPageText("profileAlt"))}
                                                            />
                                                        ) : (
                                                            getFirstLetter(user.NICKNAME || user.USER_ID)
                                                        )}
                                                    </span>

                                                    <em>{safeText(user.NICKNAME, getPageText("traveler"))}</em>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <ScrollTopButton />

            {deleteTargetMessage && (
                <div className="chat-delete-modal-bg">
                    <div className="chat-delete-modal">
                        <h3>{getPageText("deleteModalTitle")}</h3>

                        <label className={deleteTargetMessage.MINE_YN === "Y" ? "chat-delete-option" : "chat-delete-option disabled"}>
                            <span>{getPageText("deleteForEveryone")}</span>

                            <input
                                type="radio"
                                name="deleteOption"
                                checked={deleteOption === "everyone"}
                                disabled={deleteTargetMessage.MINE_YN !== "Y"}
                                onChange={() => setDeleteOption("everyone")}
                            />

                            <em></em>
                        </label>

                        <label className="chat-delete-option">
                            <span>{getPageText("deleteForMe")}</span>

                            <input
                                type="radio"
                                name="deleteOption"
                                checked={deleteOption === "me"}
                                onChange={() => setDeleteOption("me")}
                            />

                            <em></em>
                        </label>

                        {deleteTargetMessage.MINE_YN !== "Y" && (
                            <p className="chat-delete-help">
                                {getPageText("deleteHelp")}
                            </p>
                        )}

                        <div className="chat-delete-modal-btn-row">
                            <button
                                type="button"
                                className="chat-delete-cancel-btn"
                                onClick={closeDeleteModal}
                            >
                                {getPageText("cancel")}
                            </button>

                            <button
                                type="button"
                                className="chat-delete-confirm-btn"
                                onClick={confirmDeleteMessage}
                            >
                                {getPageText("confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chat;
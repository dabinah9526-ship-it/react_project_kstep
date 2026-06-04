import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Chat.css";

function Chat() {
    const navigate = useNavigate();
    const messageEndRef = useRef(null);

    const nickname = localStorage.getItem("nickname") || "여행자";

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
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        pingOnlineStatus();
        getRoomList(null, false);
        getRecommendUserList();

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
    }, [navigate, selectedRoomNo]);

    useEffect(() => {
        if (selectedRoomNo) {
            getMessageList(selectedRoomNo, false);
        }
    }, [selectedRoomNo]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({
                behavior: "smooth"
            });
        }
    }, [messageList]);

    function getToken() {
        return localStorage.getItem("token");
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
            })
            .catch(err => {
                console.error(err);
            });
    }

    function getRecommendUserList() {
        const token = getToken();

        fetch("http://localhost:3010/user/recommend/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("추천 사용자 목록", data);

                if (data.result === "success") {
                    setRecommendUserList(data.list || []);
                } else {
                    console.log(data.message || "추천 사용자 목록을 불러오지 못했습니다.");
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
            return "삭제된 메시지입니다.";
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
            return "오프라인";
        }

        if (room.ONLINE_YN === "Y") {
            return "온라인";
        }

        if (room.LAST_ACTIVE_TEXT) {
            return "오프라인 · 마지막 활동 " + room.LAST_ACTIVE_TEXT;
        }

        return "오프라인";
    }

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
    }

    function getRoomList(selectRoomNo, silent) {
        const token = getToken();

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

                if (data.result === "success") {
                    const list = data.list || [];

                    setRoomList(list);

                    if (selectRoomNo) {
                        setSelectedRoomNo(selectRoomNo);
                    } else if (!selectedRoomNo && list.length > 0) {
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
                alert("채팅방 목록을 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => {
                if (!silent) {
                    setLoading(false);
                }
            });
    }

    function getMessageList(roomNo, silent) {
        const token = getToken();

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

                    if (!silent) {
                        getRoomList(roomNo, true);
                    }
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("메시지 목록을 불러오는 중 오류가 발생했습니다.");
            });
    }

    function openRoom(targetUserNo) {
        const token = getToken();

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

                if (data.result === "success") {
                    setSelectedRoomNo(data.roomNo);
                    getRoomList(data.roomNo, false);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("채팅방을 여는 중 오류가 발생했습니다.");
            });
    }

    function selectRoom(roomNo) {
        setSelectedRoomNo(roomNo);
        setMessage("");
    }

    function sendMessage() {
        const cleanMessage = message.trim();

        if (cleanMessage === "") {
            alert("메시지를 입력해주세요.");
            return;
        }

        if (cleanMessage.length > 1000) {
            alert("메시지는 1000자 이하로 입력해주세요.");
            return;
        }

        if (!selectedRoomNo) {
            alert("채팅방을 선택해주세요.");
            return;
        }

        const token = getToken();

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

                if (data.result === "success") {
                    setMessage("");
                    getMessageList(selectedRoomNo, false);
                    getRoomList(selectedRoomNo, true);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("메시지 전송 중 오류가 발생했습니다.");
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

                if (data.result === "success") {
                    closeDeleteModal();
                    getMessageList(selectedRoomNo, false);
                    getRoomList(selectedRoomNo, true);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("메시지 삭제 중 오류가 발생했습니다.");
            });
    }

    function deleteMessageForEveryone(messageNo) {
        const token = getToken();

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

                if (data.result === "success") {
                    closeDeleteModal();
                    getMessageList(selectedRoomNo, false);
                    getRoomList(selectedRoomNo, true);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("메시지 삭제 중 오류가 발생했습니다.");
            });
    }

    function deleteRoomForMe() {
        const currentRoom = getCurrentRoom();

        if (!currentRoom) {
            return;
        }

        if (!window.confirm(currentRoom.NICKNAME + "님과의 채팅방을 나에게서만 삭제할까요?")) {
            return;
        }

        const token = getToken();

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

                if (data.result === "success") {
                    setSelectedRoomNo(null);
                    setMessageList([]);
                    getRoomList(null, false);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("채팅방 삭제 중 오류가 발생했습니다.");
            });
    }

    function moveProfile(userNo, e) {
        if (e) {
            e.stopPropagation();
        }

        if (!userNo) {
            alert("사용자 정보가 없습니다.");
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
        <div className="chat-page">
            <div className="chat-bg-flower chat-bg-flower-one">✿</div>
            <div className="chat-bg-flower chat-bg-flower-two">❀</div>

            <div className="chat-container">
                <aside className="chat-list-card">
                    <div className="chat-list-header">
                        <div>
                            <p>K-STEP Direct</p>
                            <h1>여행자 메시지</h1>
                        </div>

                        <button
                            className="chat-home-btn"
                            onClick={() => navigate("/home")}
                        >
                            홈
                        </button>
                    </div>

                    <div className="chat-search-box">
                        <span>⌕</span>

                        <input
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="여행자, 지역, 키워드 검색"
                        />
                    </div>

                    <div className="chat-user-list">
                        {loading && (
                            <div className="chat-empty-user">
                                채팅방을 불러오는 중입니다.
                            </div>
                        )}

                        {!loading && filteredRoomList.length === 0 && searchKeyword.trim() !== "" && (
                            <div className="chat-empty-user">
                                검색 결과가 없습니다.
                            </div>
                        )}

                        {!loading && roomList.length === 0 && searchKeyword.trim() === "" && (
                            <>
                                <div className="chat-empty-user">
                                    아직 채팅방이 없습니다.
                                    추천 여행자와 대화를 시작해보세요.
                                </div>

                                {recommendUserList.length === 0 && (
                                    <div className="chat-empty-user">
                                        추천할 여행자가 아직 없습니다.
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
                                                        alt={safeText(user.NICKNAME, "프로필")}
                                                    />
                                                ) : (
                                                    getFirstLetter(user.NICKNAME || user.USER_ID)
                                                )}
                                            </div>
                                        </div>

                                        <div className="chat-user-info">
                                            <div className="chat-user-name-row">
                                                <strong>{safeText(user.NICKNAME, "여행자")}</strong>
                                                <span>시작</span>
                                            </div>

                                            <p>{safeText(user.INTRO || user.BIO, "소개가 없습니다.")}</p>

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
                                    title="프로필 보기"
                                >
                                    <div className="chat-user-avatar">
                                        {getProfileImageUrl(room.PROFILE_IMG) !== "" ? (
                                            <img
                                                src={getProfileImageUrl(room.PROFILE_IMG)}
                                                alt={safeText(room.NICKNAME, "프로필")}
                                            />
                                        ) : (
                                            getFirstLetter(room.NICKNAME || room.USER_ID)
                                        )}
                                    </div>

                                    <span className={room.ONLINE_YN === "Y" ? "chat-online-dot active" : "chat-online-dot"}></span>
                                </div>

                                <div className="chat-user-info">
                                    <div className="chat-user-name-row">
                                        <strong>{safeText(room.NICKNAME, "여행자")}</strong>
                                        <span>{getDisplayTime(room.LAST_MESSAGE_DATE)}</span>
                                    </div>

                                    <p>{room.LAST_MESSAGE}</p>

                                    <div className="chat-user-chip-row">
                                        <em>{safeText(room.USER_TYPE, "TRAVELER")}</em>
                                        <em className={room.ONLINE_YN === "Y" ? "online" : ""}>
                                            {room.ONLINE_YN === "Y" ? "온라인" : "오프라인"}
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
                                        title="프로필 보기"
                                    >
                                        <div className="chat-user-avatar big">
                                            {getProfileImageUrl(currentRoom.PROFILE_IMG) !== "" ? (
                                                <img
                                                    src={getProfileImageUrl(currentRoom.PROFILE_IMG)}
                                                    alt={safeText(currentRoom.NICKNAME, "프로필")}
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
                                        <strong>{safeText(currentRoom.NICKNAME, "여행자")}</strong>
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
                                        프로필
                                    </button>

                                    <button
                                        type="button"
                                        className="chat-delete-room-btn"
                                        onClick={deleteRoomForMe}
                                    >
                                        나에게서만 채팅방 삭제
                                    </button>
                                </div>
                            </div>

                            <div className="chat-message-area">
                                <div className="chat-date-divider">
                                    <span>대화</span>
                                </div>

                                {messageList.length === 0 && (
                                    <div className="chat-empty-message">
                                        아직 대화가 없습니다. 첫 메시지를 보내보세요.
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
                                                        alt={safeText(currentRoom.NICKNAME, "프로필")}
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
                                                    {safeText(currentRoom.NICKNAME, "여행자")}
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
                                                        삭제
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
                                        placeholder="메시지를 입력하세요. Shift + Enter로 줄바꿈"
                                    ></textarea>

                                    <span className="chat-message-count">
                                        {message.length}/1000
                                    </span>
                                </div>

                                <button
                                    className={message.trim() === "" ? "chat-send-btn disabled" : "chat-send-btn"}
                                    onClick={sendMessage}
                                >
                                    전송
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="chat-no-room">
                            <h2>선택된 채팅방이 없습니다.</h2>
                            <p>왼쪽에서 대화 상대를 선택하거나 새 대화를 시작해주세요.</p>
                        </div>
                    )}
                </section>
            </div>

            {deleteTargetMessage && (
                <div className="chat-delete-modal-bg">
                    <div className="chat-delete-modal">
                        <h3>메시지 삭제</h3>

                        <label className={deleteTargetMessage.MINE_YN === "Y" ? "chat-delete-option" : "chat-delete-option disabled"}>
                            <span>모두에게서 삭제</span>

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
                            <span>나에게서만 삭제</span>

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
                                상대방이 보낸 메시지는 나에게서만 삭제할 수 있어요.
                            </p>
                        )}

                        <div className="chat-delete-modal-btn-row">
                            <button
                                type="button"
                                className="chat-delete-cancel-btn"
                                onClick={closeDeleteModal}
                            >
                                취소
                            </button>

                            <button
                                type="button"
                                className="chat-delete-confirm-btn"
                                onClick={confirmDeleteMessage}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chat;
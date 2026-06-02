import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Chat.css";

function Chat() {
    const navigate = useNavigate();

    const nickname = localStorage.getItem("nickname") || "traveler01";

    const [selectedUser, setSelectedUser] = useState(0);
    const [message, setMessage] = useState("");

    const chatUserList = [
        {
            id: 1,
            name: "서울 로컬 가이드",
            type: "GUIDE",
            preview: "북촌 루트 문의 가능해요."
        },
        {
            id: 2,
            name: "전주 맛집 큐레이터",
            type: "LOCAL",
            preview: "한옥마을 맛집 추천드려요."
        },
        {
            id: 3,
            name: "부산 감성 여행자",
            type: "TRAVELER",
            preview: "감천문화마을 포토스팟 공유해요."
        }
    ];

    const [messageList, setMessageList] = useState([
        {
            id: 1,
            type: "other",
            text: "안녕하세요! 여행 루트 보고 문의 주셨나요?"
        },
        {
            id: 2,
            type: "me",
            text: "네, 북촌 한옥마을 코스가 좋아 보여서 자세히 알고 싶어요."
        },
        {
            id: 3,
            type: "other",
            text: "안국역에서 시작해서 북촌 골목, 작은 찻집, 삼청동 순서로 가면 좋아요."
        }
    ]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
        }
    }, [navigate]);

    function sendMessage() {
        if (message.trim() === "") {
            alert("메시지를 입력해주세요.");
            return;
        }

        const newMessage = {
            id: messageList.length + 1,
            type: "me",
            text: message
        };

        setMessageList([...messageList, newMessage]);
        setMessage("");
    }

    function enterSend(e) {
        if (e.key === "Enter") {
            sendMessage();
        }
    }

    const currentUser = chatUserList[selectedUser];

    return (
        <div className="chat-page">
            <div className="chat-container">
                <aside className="chat-list-card">
                    <div className="chat-list-header">
                        <p>K-STEP Chat</p>
                        <h1>여행자 채팅</h1>
                    </div>

                    <div className="chat-user-list">
                        {chatUserList.map((user, index) => (
                            <div
                                className={selectedUser === index ? "chat-user-item active" : "chat-user-item"}
                                key={user.id}
                                onClick={() => setSelectedUser(index)}
                            >
                                <div className="chat-user-avatar">
                                    {user.name.substring(0, 1)}
                                </div>

                                <div className="chat-user-info">
                                    <strong>{user.name}</strong>
                                    <p>{user.preview}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <section className="chat-room-card">
                    <div className="chat-room-header">
                        <div className="chat-room-title">
                            <div className="chat-user-avatar">
                                {currentUser.name.substring(0, 1)}
                            </div>

                            <div>
                                <strong>{currentUser.name}</strong>
                                <p>{currentUser.type} · {nickname}님과 대화 중</p>
                            </div>
                        </div>

                        <span className="chat-status">
                            Demo Chat
                        </span>
                    </div>

                    <div className="chat-message-area">
                        {messageList.map((item) => (
                            <div
                                key={item.id}
                                className={item.type === "me" ? "chat-message me" : "chat-message other"}
                            >
                                {item.text}
                            </div>
                        ))}
                    </div>

                    <div className="chat-input-row">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={enterSend}
                            placeholder="메시지를 입력하세요"
                        />

                        <button onClick={sendMessage}>
                            전송
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Chat;
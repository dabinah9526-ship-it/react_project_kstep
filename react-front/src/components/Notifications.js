import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import "./Notifications.css";

function Notifications() {
    const navigate = useNavigate();

    const [notificationList, setNotificationList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        getNotificationList();
    }, [navigate]);

    function refreshMenuCount() {
        window.dispatchEvent(new Event("kstepMenuCountRefresh"));
    }

    function getNotificationList() {
        const token = localStorage.getItem("token");

        setLoading(true);

        fetch("http://localhost:3010/notification/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("알림 목록 조회", data);

                if (data.result === "success") {
                    setNotificationList(data.list || []);
                    refreshMenuCount();
                } else {
                    alert(data.message || "알림 목록을 불러오지 못했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("알림 목록을 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function readNotification(item) {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/notification/read", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                notiNo: item.NOTI_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("알림 읽음 처리", data);

                if (data.result === "success") {
                    refreshMenuCount();
                    moveByNotification(item);
                    getNotificationList();
                } else {
                    alert(data.message || "알림 처리에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("알림 처리 중 오류가 발생했습니다.");
            });
    }

    function readAllNotification() {
        const token = localStorage.getItem("token");

        fetch("http://localhost:3010/notification/read-all", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("전체 읽음 처리", data);

                if (data.result === "success") {
                    refreshMenuCount();
                    getNotificationList();
                } else {
                    alert(data.message || "전체 읽음 처리에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("전체 읽음 처리 중 오류가 발생했습니다.");
            });
    }

    function moveByNotification(item) {
        if (!item) {
            return;
        }

        if (item.NOTI_TYPE === "FOLLOW") {
            if (item.SENDER_NO) {
                navigate("/profile/" + item.SENDER_NO);
            } else {
                navigate("/profile/settings");
            }

            return;
        }

        if (
            item.NOTI_TYPE === "LIKE" ||
            item.NOTI_TYPE === "COMMENT" ||
            item.NOTI_TYPE === "BOOKMARK"
        ) {
            if (item.TARGET_FEED_NO) {
                sessionStorage.setItem("selectedFeedNo", item.TARGET_FEED_NO);

                navigate("/feed/detail", {
                    state: {
                        feedNo: item.TARGET_FEED_NO
                    }
                });
            } else {
                navigate("/home");
            }

            return;
        }

        navigate("/home");
    }

    function goSettings() {
        navigate("/profile/settings");
    }

    function goExplore() {
        navigate("/explore");
    }

    function getNotificationTitle(item) {
        if (!item) {
            return "알림";
        }

        if (item.NOTI_TYPE === "FOLLOW") {
            return "새 팔로우";
        }

        if (item.NOTI_TYPE === "LIKE") {
            return "좋아요 알림";
        }

        if (item.NOTI_TYPE === "COMMENT") {
            return "댓글 알림";
        }

        if (item.NOTI_TYPE === "BOOKMARK") {
            return "저장 알림";
        }

        return "알림";
    }

    function getNotificationTypeClass(type) {
        if (type === "FOLLOW") {
            return "follow";
        }

        if (type === "LIKE") {
            return "like";
        }

        if (type === "COMMENT") {
            return "comment";
        }

        if (type === "BOOKMARK") {
            return "save";
        }

        return "basic";
    }

    function getNotificationIcon(type) {
        if (type === "FOLLOW") {
            return "＋";
        }

        if (type === "LIKE") {
            return "♥";
        }

        if (type === "COMMENT") {
            return "✦";
        }

        if (type === "BOOKMARK") {
            return "✓";
        }

        return "•";
    }

    function getTimeText(item) {
        if (!item) {
            return "";
        }

        if (item.CDATE_TEXT) {
            return item.CDATE_TEXT;
        }

        if (item.CDATE) {
            const date = new Date(item.CDATE);
            return date.toLocaleDateString("ko-KR");
        }

        return "";
    }

    function getUnreadCount() {
        let count = 0;

        for (let i = 0; i < notificationList.length; i++) {
            if (notificationList[i].READ_YN === "N") {
                count++;
            }
        }

        return count;
    }

    return (
        <div className="notifications-page">
            <PageDecor />

            <div className="notifications-container">
                <section className="notifications-card">
                    <PageDecor variant="box" />

                    <header className="notifications-header">
                        <div className="notifications-title-row">
                            <div className="notifications-brand-row">
                                <div className="notifications-brand-mark">K</div>

                                <div>
                                    <p className="notifications-page-label">Notifications</p>

                                    <h1>K-STEP 알림</h1>

                                    <p className="notifications-sub-copy">
                                        팔로우, 댓글, 좋아요, 저장 알림을 확인해요.
                                    </p>
                                </div>
                            </div>

                            <div className="notifications-top-icons">
                                <button
                                    type="button"
                                    onClick={() => navigate("/home")}
                                    title="홈으로"
                                >
                                    ⌂
                                </button>

                                <button
                                    type="button"
                                    className="write"
                                    onClick={() => navigate("/feed/new")}
                                    title="작성"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="notifications-layout">
                        <section className="notifications-list-card">
                            <div className="notifications-list-top">
                                <strong>새 알림 {getUnreadCount()}개</strong>

                                {notificationList.length > 0 && (
                                    <button
                                        type="button"
                                        className="noti-read-all-btn"
                                        onClick={readAllNotification}
                                    >
                                        모두 읽음
                                    </button>
                                )}
                            </div>

                            {loading && (
                                <div className="notifications-empty">
                                    알림을 불러오는 중입니다...
                                </div>
                            )}

                            {!loading && notificationList.length === 0 && (
                                <div className="notifications-empty">
                                    아직 받은 알림이 없습니다.
                                </div>
                            )}

                            {!loading && notificationList.length > 0 && (
                                <>
                                    {notificationList.map((item) => (
                                        <div
                                            className={item.READ_YN === "N" ? "notification-item unread" : "notification-item"}
                                            key={item.NOTI_NO}
                                            onClick={() => readNotification(item)}
                                        >
                                            <div className={"notification-icon " + getNotificationTypeClass(item.NOTI_TYPE)}>
                                                {getNotificationIcon(item.NOTI_TYPE)}
                                            </div>

                                            <div className="notification-text">
                                                <strong>{getNotificationTitle(item)}</strong>

                                                <p>{item.NOTI_CONTENT}</p>

                                                {item.FEED_TITLE && (
                                                    <span className="notification-feed-title">
                                                        {item.FEED_TITLE}
                                                    </span>
                                                )}
                                            </div>

                                            <span className="notification-time">
                                                {getTimeText(item)}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </section>

                        <aside className="notifications-side-card">
                            <h3>알림 설정</h3>

                            <p>
                                알림 수신 설정은 프로필 설정에서 변경할 수 있어요.
                            </p>

                            <button
                                type="button"
                                onClick={goSettings}
                            >
                                설정으로 이동
                            </button>

                            <button
                                type="button"
                                className="sub"
                                onClick={goExplore}
                            >
                                탐색하기
                            </button>
                        </aside>
                    </div>
                </section>
            </div>

            <ScrollTopButton />
        </div>
    );
}

export default Notifications;
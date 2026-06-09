import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./Notifications.css";

function Notifications() {
    const navigate = useNavigate();

    const [language, setLanguage] = useState(getLang());

    const [notificationList, setNotificationList] = useState([]);
    const [loading, setLoading] = useState(false);

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

        getNotificationList();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    function getPageText(key) {
        const ko = {
            loginRequired: "로그인이 필요합니다.",
            loadFail: "알림 목록을 불러오지 못했습니다.",
            loadError: "알림 목록을 불러오는 중 오류가 발생했습니다.",
            readFail: "알림 처리에 실패했습니다.",
            readError: "알림 처리 중 오류가 발생했습니다.",
            readAllFail: "전체 읽음 처리에 실패했습니다.",
            readAllError: "전체 읽음 처리 중 오류가 발생했습니다.",

            defaultTitle: "알림",
            followTitle: "새 팔로우",
            likeTitle: "좋아요 알림",
            commentTitle: "댓글 알림",
            bookmarkTitle: "저장 알림",

            pageLabel: "Notifications",
            title: "K-STEP 알림",
            subtitle: "팔로우, 댓글, 좋아요, 저장 알림을 확인해요.",
            homeTitle: "홈으로",
            createTitle: "작성",

            newNotification: "새 알림",
            countUnit: "개",
            readAll: "모두 읽음",
            loading: "알림을 불러오는 중입니다.",
            empty: "아직 받은 알림이 없습니다.",

            settingTitle: "알림 설정",
            settingDesc: "알림 수신 설정은 프로필 설정에서 변경할 수 있어요.",
            goSetting: "설정으로 이동",
            explore: "탐색하기"
        };

        const en = {
            loginRequired: "Please log in first.",
            loadFail: "Failed to load notifications.",
            loadError: "An error occurred while loading notifications.",
            readFail: "Failed to process notification.",
            readError: "An error occurred while processing notification.",
            readAllFail: "Failed to mark all notifications as read.",
            readAllError: "An error occurred while marking all notifications as read.",

            defaultTitle: "Notification",
            followTitle: "New Follow",
            likeTitle: "Like Notification",
            commentTitle: "Comment Notification",
            bookmarkTitle: "Saved Route Notification",

            pageLabel: "Notifications",
            title: "K-STEP Notifications",
            subtitle: "Check your follows, comments, likes, and saved route notifications.",
            homeTitle: "Home",
            createTitle: "Create",

            newNotification: "Unread",
            countUnit: "",
            readAll: "Mark all as read",
            loading: "Loading notifications.",
            empty: "No notifications yet.",

            settingTitle: "Notification Settings",
            settingDesc: "You can change notification preferences in Profile Settings.",
            goSetting: "Go to Settings",
            explore: "Explore"
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

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
                    alert(data.message || getPageText("loadFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("loadError"));
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
                    alert(data.message || getPageText("readFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("readError"));
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
                    alert(data.message || getPageText("readAllFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("readAllError"));
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
            return getPageText("defaultTitle");
        }

        if (item.NOTI_TYPE === "FOLLOW") {
            return getPageText("followTitle");
        }

        if (item.NOTI_TYPE === "LIKE") {
            return getPageText("likeTitle");
        }

        if (item.NOTI_TYPE === "COMMENT") {
            return getPageText("commentTitle");
        }

        if (item.NOTI_TYPE === "BOOKMARK") {
            return getPageText("bookmarkTitle");
        }

        return getPageText("defaultTitle");
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

            if (Number.isNaN(date.getTime())) {
                return "";
            }

            if (language === "en") {
                return date.toLocaleDateString("en-US");
            }

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
        <div className="notifications-page" data-lang={language}>
            <PageDecor />

            <div className="notifications-container">
                <section className="notifications-card">
                    <PageDecor variant="box" />

                    <header className="notifications-header">
                        <div className="notifications-title-row">
                            <div className="notifications-brand-row">
                                <div className="notifications-brand-mark">K</div>

                                <div>
                                    <p className="notifications-page-label">
                                        {getPageText("pageLabel")}
                                    </p>

                                    <h1>{getPageText("title")}</h1>

                                    <p className="notifications-sub-copy">
                                        {getPageText("subtitle")}
                                    </p>
                                </div>
                            </div>

                            <div className="notifications-top-icons">
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
                        </div>
                    </header>

                    <div className="notifications-layout">
                        <section className="notifications-list-card">
                            <div className="notifications-list-top">
                                <strong>
                                    {getPageText("newNotification")} {getUnreadCount()}{getPageText("countUnit")}
                                </strong>

                                {notificationList.length > 0 && (
                                    <button
                                        type="button"
                                        className="noti-read-all-btn"
                                        onClick={readAllNotification}
                                    >
                                        {getPageText("readAll")}
                                    </button>
                                )}
                            </div>

                            {loading && (
                                <div className="notifications-empty">
                                    {getPageText("loading")}
                                </div>
                            )}

                            {!loading && notificationList.length === 0 && (
                                <div className="notifications-empty">
                                    {getPageText("empty")}
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
                            <h3>{getPageText("settingTitle")}</h3>

                            <p>
                                {getPageText("settingDesc")}
                            </p>

                            <button
                                type="button"
                                onClick={goSettings}
                            >
                                {getPageText("goSetting")}
                            </button>

                            <button
                                type="button"
                                className="sub"
                                onClick={goExplore}
                            >
                                {getPageText("explore")}
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
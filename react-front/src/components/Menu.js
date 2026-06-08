import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Menu.css";

function Menu() {
    const navigate = useNavigate();
    const location = useLocation();

    const logoUrl = "/images/k_step_logo3.png";

    const [isLogin, setIsLogin] = useState(false);
    const [loginUserNo, setLoginUserNo] = useState("");
    const [chatUnreadCount, setChatUnreadCount] = useState(0);
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

    useEffect(() => {
        refreshMenuState();

        const timer = setInterval(() => {
            refreshMenuState();
        }, 30000);

        window.addEventListener("focus", refreshMenuState);
        window.addEventListener("kstepMenuCountRefresh", refreshMenuState);

        return () => {
            clearInterval(timer);
            window.removeEventListener("focus", refreshMenuState);
            window.removeEventListener("kstepMenuCountRefresh", refreshMenuState);
        };
    }, [location.pathname]);

    function clearLoginStorage() {
        localStorage.removeItem("token");
        localStorage.removeItem("userNo");
        localStorage.removeItem("userId");
        localStorage.removeItem("nickname");
        localStorage.removeItem("userType");
    }

    function getToken() {
        return localStorage.getItem("token");
    }

    function checkLoginState() {
        const token = localStorage.getItem("token");
        const userNo = localStorage.getItem("userNo");

        if (!token || !userNo) {
            clearLoginStorage();

            return {
                isLogin: false,
                userNo: ""
            };
        }

        try {
            const tokenParts = token.split(".");

            if (tokenParts.length !== 3) {
                clearLoginStorage();

                return {
                    isLogin: false,
                    userNo: ""
                };
            }

            const payload = tokenParts[1];
            const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
            const decoded = JSON.parse(window.atob(base64));

            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                clearLoginStorage();

                return {
                    isLogin: false,
                    userNo: ""
                };
            }

            return {
                isLogin: true,
                userNo: userNo
            };

        } catch (err) {
            console.error("로그인 상태 확인 실패", err);

            clearLoginStorage();

            return {
                isLogin: false,
                userNo: ""
            };
        }
    }

    function refreshMenuState() {
        const loginState = checkLoginState();

        setIsLogin(loginState.isLogin);
        setLoginUserNo(loginState.userNo);

        if (loginState.isLogin) {
            getMenuCount();
        } else {
            setChatUnreadCount(0);
            setNotificationUnreadCount(0);
        }

        return loginState;
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

    function handleMenuLoginRequired(data) {
        if (isLoginRequired(data)) {
            clearLoginStorage();
            setIsLogin(false);
            setLoginUserNo("");
            setChatUnreadCount(0);
            setNotificationUnreadCount(0);

            if (location.pathname !== "/" && location.pathname !== "/join") {
                navigate("/", { replace: true });
            }

            return true;
        }

        return false;
    }

    function getMenuCount() {
        getChatUnreadCount();
        getNotificationUnreadCount();
    }

    function getChatUnreadCount() {
        const token = getToken();

        if (!token) {
            setChatUnreadCount(0);
            return;
        }

        fetch("http://localhost:3010/chat/room/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("메뉴 채팅 카운트", data);

                if (handleMenuLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    const list = data.list || [];
                    let totalCount = 0;

                    for (let i = 0; i < list.length; i++) {
                        totalCount += Number(list[i].UNREAD_COUNT || 0);
                    }

                    setChatUnreadCount(totalCount);
                } else {
                    setChatUnreadCount(0);
                }
            })
            .catch(err => {
                console.error("메뉴 채팅 카운트 조회 실패", err);
                setChatUnreadCount(0);
            });
    }

    function getNotificationUnreadCount() {
        const token = getToken();

        if (!token) {
            setNotificationUnreadCount(0);
            return;
        }

        fetch("http://localhost:3010/notification/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("메뉴 알림 카운트", data);

                if (handleMenuLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    const list = data.list || [];
                    let totalCount = 0;

                    for (let i = 0; i < list.length; i++) {
                        if (list[i].READ_YN === "N") {
                            totalCount++;
                        }
                    }

                    setNotificationUnreadCount(totalCount);
                } else {
                    setNotificationUnreadCount(0);
                }
            })
            .catch(err => {
                console.error("메뉴 알림 카운트 조회 실패", err);
                setNotificationUnreadCount(0);
            });
    }

    const menuList = [
        {
            name: "홈",
            path: "/home",
            icon: "home",
            needLogin: true
        },
        {
            name: "검색",
            path: "/explore",
            icon: "search",
            needLogin: true
        },
        {
            name: "작성",
            path: "/feed/new",
            icon: "plus",
            needLogin: true
        },
        {
            name: "즐겨찾기",
            path: "/saved",
            icon: "saved",
            needLogin: true
        },
        {
            name: "알림",
            path: "/notifications",
            icon: "bell",
            needLogin: true
        },
        {
            name: "채팅",
            path: "/chat",
            icon: "chat",
            needLogin: true
        },
        {
            name: "프로필",
            path: isLogin ? "/profile/" + loginUserNo : "/",
            icon: "user",
            needLogin: true
        }
    ];

    function movePage(path, needLogin) {
        const loginState = checkLoginState();

        setIsLogin(loginState.isLogin);
        setLoginUserNo(loginState.userNo);

        if (needLogin && !loginState.isLogin) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        navigate(path);
    }

    function moveLogo() {
        const loginState = checkLoginState();

        setIsLogin(loginState.isLogin);
        setLoginUserNo(loginState.userNo);

        if (loginState.isLogin) {
            navigate("/home");
        } else {
            navigate("/");
        }
    }

    function login() {
        clearLoginStorage();
        setIsLogin(false);
        setLoginUserNo("");
        setChatUnreadCount(0);
        setNotificationUnreadCount(0);
        navigate("/");
    }

    function logout() {
        if (!window.confirm("로그아웃할까요?")) {
            return;
        }

        clearLoginStorage();

        setIsLogin(false);
        setLoginUserNo("");
        setChatUnreadCount(0);
        setNotificationUnreadCount(0);

        navigate("/");
    }

    function isActive(path) {
        if (path === "/home") {
            return location.pathname === "/home";
        }

        if (path === "/explore") {
            return location.pathname === "/explore";
        }

        if (path === "/feed/new") {
            return location.pathname === "/feed/new";
        }

        if (path === "/saved") {
            return location.pathname === "/saved";
        }

        if (path === "/notifications") {
            return location.pathname === "/notifications";
        }

        if (path === "/chat") {
            return location.pathname === "/chat";
        }

        if (path === "/business") {
            return location.pathname === "/business";
        }

        if (path.startsWith("/profile")) {
            return location.pathname.startsWith("/profile");
        }

        return false;
    }

    function getBadgeCount(icon) {
        if (icon === "bell") {
            return notificationUnreadCount;
        }

        if (icon === "chat") {
            return chatUnreadCount;
        }

        return 0;
    }

    function getBadgeText(count) {
        if (Number(count) > 99) {
            return "99+";
        }

        return String(count);
    }

    function MenuIcon({ type }) {
        if (type === "home") {
            return (
                <svg viewBox="0 0 24 24">
                    <path d="M3 11.5L12 4L21 11.5" />
                    <path d="M5.5 10.5V20H18.5V10.5" />
                    <path d="M9.5 20V14H14.5V20" />
                </svg>
            );
        }

        if (type === "search") {
            return (
                <svg viewBox="0 0 24 24">
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="M15.5 15.5L21 21" />
                </svg>
            );
        }

        if (type === "plus") {
            return (
                <svg viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="5" />
                    <path d="M12 8V16" />
                    <path d="M8 12H16" />
                </svg>
            );
        }

        if (type === "saved") {
            return (
                <svg viewBox="0 0 24 24">
                    <path d="M6.5 5.5C6.5 4.4 7.4 3.5 8.5 3.5H15.5C16.6 3.5 17.5 4.4 17.5 5.5V20.5L12 17.2L6.5 20.5V5.5Z" />
                    <path d="M9.5 8H14.5" />
                    <path d="M9.5 11H13.2" />
                </svg>
            );
        }

        if (type === "bell") {
            return (
                <svg viewBox="0 0 24 24">
                    <path d="M18 9.5C18 6.2 15.5 4 12 4C8.5 4 6 6.2 6 9.5V13.5L4.5 17H19.5L18 13.5V9.5Z" />
                    <path d="M9.5 19C10 20.2 10.8 20.8 12 20.8C13.2 20.8 14 20.2 14.5 19" />
                </svg>
            );
        }

        if (type === "chat") {
            return (
                <svg viewBox="0 0 24 24">
                    <path d="M5 5.5H19C20.1 5.5 21 6.4 21 7.5V15.5C21 16.6 20.1 17.5 19 17.5H10L5 21V17.5H5C3.9 17.5 3 16.6 3 15.5V7.5C3 6.4 3.9 5.5 5 5.5Z" />
                    <path d="M8 10H16" />
                    <path d="M8 13H13" />
                </svg>
            );
        }

        if (type === "business") {
            return (
                <svg viewBox="0 0 24 24">
                    <path d="M4 20V8H20V20" />
                    <path d="M8 8V5H16V8" />
                    <path d="M4 12H20" />
                    <path d="M9 16H15" />
                </svg>
            );
        }

        if (type === "user") {
            return (
                <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4.5 20C5.5 15.8 8.4 13.5 12 13.5C15.6 13.5 18.5 15.8 19.5 20" />
                </svg>
            );
        }

        if (type === "login") {
            return (
                <svg viewBox="0 0 24 24">
                    <path d="M14 5H19V19H14" />
                    <path d="M9 8L13 12L9 16" />
                    <path d="M4 12H13" />
                </svg>
            );
        }

        if (type === "logout") {
            return (
                <svg viewBox="0 0 24 24">
                    <path d="M10 5H5V19H10" />
                    <path d="M14 8L18 12L14 16" />
                    <path d="M8 12H18" />
                </svg>
            );
        }

        return null;
    }

    return (
        <aside className="side-menu">
            <div className="side-menu-deco deco-one"></div>
            <div className="side-menu-deco deco-two"></div>
            <div className="side-menu-flower flower-a">✿</div>
            <div className="side-menu-flower flower-b">❀</div>

            <div className="side-menu-inner">
                <button
                    className="side-logo"
                    onClick={moveLogo}
                    type="button"
                    title="K-STEP 홈"
                    aria-label="K-STEP 홈"
                >
                    <img
                        src={logoUrl}
                        alt="K-STEP 로고"
                        className="side-logo-img"
                    />
                </button>

                <nav className="side-menu-list">
                    {menuList.map((menu) => {
                        const badgeCount = getBadgeCount(menu.icon);

                        return (
                            <button
                                key={menu.name}
                                className={isActive(menu.path) ? "side-menu-btn active" : "side-menu-btn"}
                                onClick={() => movePage(menu.path, menu.needLogin)}
                                type="button"
                            >
                                <span className="side-menu-icon">
                                    <MenuIcon type={menu.icon} />
                                </span>

                                {badgeCount > 0 && (
                                    <span className="side-menu-badge">
                                        {getBadgeText(badgeCount)}
                                    </span>
                                )}

                                <span className="side-menu-tooltip">
                                    {menu.name}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {isLogin ? (
                    <button
                        className="side-menu-btn side-logout-btn"
                        onClick={logout}
                        type="button"
                    >
                        <span className="side-menu-icon">
                            <MenuIcon type="logout" />
                        </span>

                        <span className="side-menu-tooltip">
                            로그아웃
                        </span>
                    </button>
                ) : (
                    <button
                        className="side-menu-btn side-logout-btn"
                        onClick={login}
                        type="button"
                    >
                        <span className="side-menu-icon">
                            <MenuIcon type="login" />
                        </span>

                        <span className="side-menu-tooltip">
                            로그인
                        </span>
                    </button>
                )}
            </div>
        </aside>
    );
}

export default Menu;
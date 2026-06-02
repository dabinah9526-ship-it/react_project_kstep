import { useLocation, useNavigate } from "react-router-dom";
import "./Menu.css";

function Menu() {
    const navigate = useNavigate();
    const location = useLocation();

    const loginUserNo = localStorage.getItem("userNo");

   
    const logoUrl = "/images/k_step_logo3.png";

    const menuList = [
        {
            name: "홈",
            path: "/home",
            icon: "home"
        },
        {
            name: "탐색",
            path: "/explore",
            icon: "search"
        },
        {
            name: "작성",
            path: "/feed/new",
            icon: "plus"
        },
        {
            name: "알림",
            path: "/notifications",
            icon: "bell"
        },
        {
            name: "채팅",
            path: "/chat",
            icon: "chat"
        },
        {
            name: "비즈니스",
            path: "/business",
            icon: "business"
        },
        {
            name: "프로필",
            path: "/profile/" + loginUserNo,
            icon: "user"
        }
    ];

    function movePage(path) {
        navigate(path);
    }

    function logout() {
        if (!window.confirm("로그아웃할까요?")) {
            return;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("userNo");
        localStorage.removeItem("userId");
        localStorage.removeItem("nickname");
        localStorage.removeItem("userType");

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
                    onClick={() => movePage("/home")}
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
                    {menuList.map((menu) => (
                        <button
                            key={menu.path}
                            className={isActive(menu.path) ? "side-menu-btn active" : "side-menu-btn"}
                            onClick={() => movePage(menu.path)}
                            type="button"
                        >
                            <span className="side-menu-icon">
                                <MenuIcon type={menu.icon} />
                            </span>

                            <span className="side-menu-tooltip">
                                {menu.name}
                            </span>
                        </button>
                    ))}
                </nav>

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
            </div>
        </aside>
    );
}

export default Menu;
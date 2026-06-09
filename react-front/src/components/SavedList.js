import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./SavedList.css";

function SavedList() {
    const navigate = useNavigate();

    const [language, setLanguage] = useState(getLang());

    const [routeList, setRouteList] = useState([]);
    const [shopList, setShopList] = useState([]);
    const [activeType, setActiveType] = useState("all");
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
        getSavedList();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function getPageText(key) {
        const ko = {
            loginRequired: "로그인이 필요합니다.",
            removeRouteConfirm: "이 여행 루트를 즐겨찾기에서 해제할까요?",
            removeRouteFail: "즐겨찾기 해제에 실패했습니다.",
            removeRouteError: "즐겨찾기 해제 중 오류가 발생했습니다.",
            removeShopConfirm: "이 가게를 즐겨찾기에서 해제할까요?",
            removeShopFail: "가게 즐겨찾기 해제에 실패했습니다.",
            removeShopError: "가게 즐겨찾기 해제 중 오류가 발생했습니다.",

            routeSectionTitle: "루트 즐겨찾기",
            shopSectionTitle: "가게 즐겨찾기",
            allSectionTitle: "전체 즐겨찾기",

            routeEmpty: "아직 즐겨찾기한 여행 루트가 없습니다.",
            shopEmpty: "아직 즐겨찾기한 가게가 없습니다.",
            allEmpty: "아직 즐겨찾기한 항목이 없습니다.",

            routeImageAlt: "저장한 루트 이미지",
            shopImageAlt: "저장한 가게 이미지",
            route: "루트",
            shop: "가게",
            travel: "여행",
            routeTitleDefault: "제목 없는 여행 루트",
            routeDescDefault: "저장한 여행 루트입니다.",
            shopTitleDefault: "저장한 가게",
            shopDescDefault: "K-STEP에서 저장한 로컬 가게입니다.",
            routeView: "루트 보기",
            shopView: "가게 보기",
            remove: "해제",

            favoriteCollection: "Favorite Collection",
            savedTitle: "즐겨찾기",
            savedSub: "마음에 든 여행 루트와 가게를 한 번에 모아볼 수 있어요.",
            homeTitle: "홈으로",
            refreshTitle: "새로고침",
            createTitle: "작성",
            routeSummary: "루트 즐겨찾기",
            shopSummary: "가게 즐겨찾기",
            allSummary: "전체 즐겨찾기",
            countUnit: "개",
            loadingText: "즐겨찾기 목록을 불러오는 중입니다..."
        };

        const en = {
            loginRequired: "Please log in first.",
            removeRouteConfirm: "Remove this travel route from your saved list?",
            removeRouteFail: "Failed to remove this route from saved list.",
            removeRouteError: "An error occurred while removing this route.",
            removeShopConfirm: "Remove this store from your saved list?",
            removeShopFail: "Failed to remove this store from saved list.",
            removeShopError: "An error occurred while removing this store.",

            routeSectionTitle: "Saved Routes",
            shopSectionTitle: "Saved Stores",
            allSectionTitle: "All Saved Items",

            routeEmpty: "No saved travel routes yet.",
            shopEmpty: "No saved stores yet.",
            allEmpty: "No saved items yet.",

            routeImageAlt: "Saved route image",
            shopImageAlt: "Saved store image",
            route: "Route",
            shop: "Store",
            travel: "Travel",
            routeTitleDefault: "Untitled Travel Route",
            routeDescDefault: "This is a saved travel route.",
            shopTitleDefault: "Saved Store",
            shopDescDefault: "This is a local store saved on K-STEP.",
            routeView: "View Route",
            shopView: "View Store",
            remove: "Remove",

            favoriteCollection: "Favorite Collection",
            savedTitle: "Saved",
            savedSub: "View your favorite travel routes and local stores in one place.",
            homeTitle: "Home",
            refreshTitle: "Refresh",
            createTitle: "Create",
            routeSummary: "Saved Routes",
            shopSummary: "Saved Stores",
            allSummary: "All Saved",
            countUnit: "",
            loadingText: "Loading saved items..."
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
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

        alert(message || t("loginRequired") || getPageText("loginRequired"));
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

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
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

    function getFeedImage(feed) {
        if (!feed) {
            return "";
        }

        return getImageUrl(
            feed.MAIN_IMG ||
            feed.IMG_URL ||
            feed.IMAGE_URL ||
            ""
        );
    }

    function getShopImage(shop) {
        if (!shop) {
            return "";
        }

        return getImageUrl(
            shop.IMAGE_URL ||
            shop.MAIN_IMG ||
            shop.IMG_URL ||
            ""
        );
    }

    function getSavedList() {
        const token = getToken();
        const loginUserNo = getLoginUserNo();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        setLoading(true);

        Promise.all([
            getRouteSavedList(token, loginUserNo),
            getShopSavedList(token)
        ])
            .then(([routeResult, shopResult]) => {
                setRouteList(routeResult);
                setShopList(shopResult);
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function getRouteSavedList(token, loginUserNo) {
        if (!loginUserNo) {
            return Promise.resolve([]);
        }

        return fetch("http://localhost:3010/user/profile/" + loginUserNo + "/bookmark", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("저장한 루트 목록", data);

                if (handleLoginRequired(data)) {
                    return [];
                }

                if (data.result === "success") {
                    return data.list || [];
                }

                return [];
            })
            .catch(err => {
                console.error(err);
                return [];
            });
    }

    function getShopSavedList(token) {
        return fetch("http://localhost:3010/business/sponsor/save/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("저장한 가게 목록", data);

                if (handleLoginRequired(data)) {
                    return [];
                }

                if (data.result === "success") {
                    return data.list || [];
                }

                return [];
            })
            .catch(err => {
                console.error(err);
                return [];
            });
    }

    function openFeedDetail(feedNo) {
        if (!feedNo) {
            return;
        }

        sessionStorage.setItem("selectedFeedNo", feedNo);

        navigate("/feed/detail", {
            state: {
                feedNo: feedNo
            }
        });
    }

    function openShopDetail(shop) {
        if (!shop || !shop.AD_NO) {
            return;
        }

        sessionStorage.setItem("selectedAd", JSON.stringify(shop));
        navigate("/ad/detail/" + shop.AD_NO);
    }

    function removeRouteBookmark(e, feedNo) {
        e.stopPropagation();

        if (!feedNo) {
            return;
        }

        if (!window.confirm(getPageText("removeRouteConfirm"))) {
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        fetch("http://localhost:3010/feed/bookmark/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                feedNo: feedNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("루트 즐겨찾기 해제", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    getSavedList();
                    refreshMenuCount();
                } else {
                    alert(data.message || getPageText("removeRouteFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("removeRouteError"));
            });
    }

    function removeShopSave(e, adNo) {
        e.stopPropagation();

        if (!adNo) {
            return;
        }

        if (!window.confirm(getPageText("removeShopConfirm"))) {
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage(getPageText("loginRequired"));
            return;
        }

        fetch("http://localhost:3010/business/sponsor/save/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                adNo: adNo
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("가게 즐겨찾기 해제", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    getSavedList();
                    refreshMenuCount();
                } else {
                    alert(data.message || getPageText("removeShopFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("removeShopError"));
            });
    }

    function getDisplayList() {
        if (activeType === "route") {
            return routeList.map(item => ({
                ...item,
                SAVE_TYPE: "route"
            }));
        }

        if (activeType === "shop") {
            return shopList.map(item => ({
                ...item,
                SAVE_TYPE: "shop"
            }));
        }

        return [
            ...routeList.map(item => ({
                ...item,
                SAVE_TYPE: "route"
            })),
            ...shopList.map(item => ({
                ...item,
                SAVE_TYPE: "shop"
            }))
        ];
    }

    function getSectionTitle() {
        if (activeType === "route") {
            return getPageText("routeSectionTitle");
        }

        if (activeType === "shop") {
            return getPageText("shopSectionTitle");
        }

        return getPageText("allSectionTitle");
    }

    function getEmptyMessage() {
        if (activeType === "route") {
            return getPageText("routeEmpty");
        }

        if (activeType === "shop") {
            return getPageText("shopEmpty");
        }

        return getPageText("allEmpty");
    }

    function renderRouteCard(feed) {
        const imageUrl = getFeedImage(feed);

        return (
            <article
                className="saved-card"
                key={"route-" + feed.FEED_NO}
                onClick={() => openFeedDetail(feed.FEED_NO)}
            >
                <div className="saved-image">
                    {imageUrl !== "" ? (
                        <img
                            src={imageUrl}
                            alt={safeText(feed.TITLE, getPageText("routeImageAlt"))}
                        />
                    ) : (
                        <div className="saved-image-empty">
                            K-STEP
                        </div>
                    )}

                    <span>{getPageText("route")}</span>
                </div>

                <div className="saved-card-body">
                    <div className="saved-card-chip-row">
                        <em>{safeText(feed.AREA, "Korea")}</em>
                        <em>{safeText(feed.CATEGORY, getPageText("travel"))}</em>
                    </div>

                    <h2>{safeText(feed.TITLE, getPageText("routeTitleDefault"))}</h2>

                    <p>
                        {feed.ROUTE_SUMMARY || feed.CONTENT || getPageText("routeDescDefault")}
                    </p>

                    <div className="saved-card-meta">
                        <span>♡ {feed.LIKE_COUNT || 0}</span>
                        <span>💬 {feed.COMMENT_COUNT || 0}</span>
                        <span>🔖 {feed.BOOKMARK_COUNT || 0}</span>
                    </div>

                    <div className="saved-card-action-row">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                openFeedDetail(feed.FEED_NO);
                            }}
                        >
                            {getPageText("routeView")}
                        </button>

                        <button
                            type="button"
                            className="danger"
                            onClick={(e) => removeRouteBookmark(e, feed.FEED_NO)}
                        >
                            {getPageText("remove")}
                        </button>
                    </div>
                </div>
            </article>
        );
    }

    function renderShopCard(shop) {
        const imageUrl = getShopImage(shop);

        return (
            <article
                className="saved-card"
                key={"shop-" + shop.AD_NO}
                onClick={() => openShopDetail(shop)}
            >
                <div className="saved-image">
                    {imageUrl !== "" ? (
                        <img
                            src={imageUrl}
                            alt={safeText(shop.BUSINESS_NAME, getPageText("shopImageAlt"))}
                        />
                    ) : (
                        <div className="saved-image-empty">
                            LOCAL
                        </div>
                    )}

                    <span>{getPageText("shop")}</span>
                </div>

                <div className="saved-card-body">
                    <div className="saved-card-chip-row">
                        <em>{safeText(shop.AREA, "Korea")}</em>
                        <em>{safeText(shop.BUSINESS_TYPE, "LOCAL")}</em>
                    </div>

                    <h2>{safeText(shop.BUSINESS_NAME, getPageText("shopTitleDefault"))}</h2>

                    <p>
                        {shop.AD_TITLE || shop.AD_TEXT || getPageText("shopDescDefault")}
                    </p>

                    <div className="saved-card-meta">
                        <span>👁 {shop.VIEW_COUNT || 0}</span>
                        <span>↗ {shop.CLICK_COUNT || 0}</span>
                        <span>Sponsored</span>
                    </div>

                    <div className="saved-card-action-row">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                openShopDetail(shop);
                            }}
                        >
                            {getPageText("shopView")}
                        </button>

                        <button
                            type="button"
                            className="danger"
                            onClick={(e) => removeShopSave(e, shop.AD_NO)}
                        >
                            {getPageText("remove")}
                        </button>
                    </div>
                </div>
            </article>
        );
    }

    const displayList = getDisplayList();

    return (
        <div className="saved-page" data-lang={language}>
            <PageDecor />

            <div className="saved-layout">
                <section className="saved-header">
                    <PageDecor variant="box" />

                    <div className="saved-brand-row">
                        <div className="saved-brand-mark">K</div>

                        <div className="saved-header-content">
                            <p>{getPageText("favoriteCollection")}</p>

                            <h1>{getPageText("savedTitle")}</h1>

                            <span>
                                {getPageText("savedSub")}
                            </span>
                        </div>
                    </div>

                    <div className="saved-header-actions">
                        <button
                            type="button"
                            className="saved-icon-btn"
                            onClick={() => navigate("/home")}
                            title={getPageText("homeTitle")}
                        >
                            ⌂
                        </button>

                        <button
                            type="button"
                            className="saved-icon-btn refresh"
                            onClick={getSavedList}
                            title={getPageText("refreshTitle")}
                        >
                            ↻
                        </button>

                        <button
                            type="button"
                            className="saved-icon-btn write"
                            onClick={() => navigate("/feed/new")}
                            title={getPageText("createTitle")}
                        >
                            +
                        </button>
                    </div>
                </section>

                <section className="saved-summary-row">
                    <button
                        type="button"
                        className={activeType === "route" ? "saved-summary-card active" : "saved-summary-card"}
                        onClick={() => setActiveType("route")}
                    >
                        <strong>{routeList.length}</strong>
                        <span>{getPageText("routeSummary")}</span>
                    </button>

                    <button
                        type="button"
                        className={activeType === "shop" ? "saved-summary-card active" : "saved-summary-card"}
                        onClick={() => setActiveType("shop")}
                    >
                        <strong>{shopList.length}</strong>
                        <span>{getPageText("shopSummary")}</span>
                    </button>

                    <button
                        type="button"
                        className={activeType === "all" ? "saved-summary-card active" : "saved-summary-card"}
                        onClick={() => setActiveType("all")}
                    >
                        <strong>{routeList.length + shopList.length}</strong>
                        <span>{getPageText("allSummary")}</span>
                    </button>
                </section>

                <div className="saved-list-section-title">
                    <strong>{getSectionTitle()}</strong>
                    <span>{displayList.length}{getPageText("countUnit")}</span>
                </div>

                {loading && (
                    <div className="saved-empty-box">
                        {getPageText("loadingText")}
                    </div>
                )}

                {!loading && displayList.length === 0 && (
                    <div className="saved-empty-box">
                        {getEmptyMessage()}
                    </div>
                )}

                {!loading && displayList.length > 0 && (
                    <section className="saved-grid">
                        {displayList.map(item => {
                            if (item.SAVE_TYPE === "route") {
                                return renderRouteCard(item);
                            }

                            return renderShopCard(item);
                        })}
                    </section>
                )}
            </div>

            <ScrollTopButton />
        </div>
    );
}

export default SavedList;
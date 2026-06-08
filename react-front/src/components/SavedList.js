import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import "./SavedList.css";

function SavedList() {
    const navigate = useNavigate();

    const [routeList, setRouteList] = useState([]);
    const [shopList, setShopList] = useState([]);
    const [activeType, setActiveType] = useState("all");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getSavedList();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

        alert(message || "로그인이 필요합니다.");
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
            moveLoginPage(data.message || "로그인이 필요합니다.");
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
            moveLoginPage("로그인이 필요합니다.");
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

        if (!window.confirm("이 여행 루트를 즐겨찾기에서 해제할까요?")) {
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
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
                    alert(data.message || "즐겨찾기 해제에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("즐겨찾기 해제 중 오류가 발생했습니다.");
            });
    }

    function removeShopSave(e, adNo) {
        e.stopPropagation();

        if (!adNo) {
            return;
        }

        if (!window.confirm("이 가게를 즐겨찾기에서 해제할까요?")) {
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
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
                    alert(data.message || "가게 즐겨찾기 해제에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("가게 즐겨찾기 해제 중 오류가 발생했습니다.");
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
            return "루트 즐겨찾기";
        }

        if (activeType === "shop") {
            return "가게 즐겨찾기";
        }

        return "전체 즐겨찾기";
    }

    function getEmptyMessage() {
        if (activeType === "route") {
            return "아직 즐겨찾기한 여행 루트가 없습니다.";
        }

        if (activeType === "shop") {
            return "아직 즐겨찾기한 가게가 없습니다.";
        }

        return "아직 즐겨찾기한 항목이 없습니다.";
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
                            alt={safeText(feed.TITLE, "저장한 루트 이미지")}
                        />
                    ) : (
                        <div className="saved-image-empty">
                            K-STEP
                        </div>
                    )}

                    <span>루트</span>
                </div>

                <div className="saved-card-body">
                    <div className="saved-card-chip-row">
                        <em>{safeText(feed.AREA, "Korea")}</em>
                        <em>{safeText(feed.CATEGORY, "여행")}</em>
                    </div>

                    <h2>{safeText(feed.TITLE, "제목 없는 여행 루트")}</h2>

                    <p>
                        {feed.ROUTE_SUMMARY || feed.CONTENT || "저장한 여행 루트입니다."}
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
                            루트 보기
                        </button>

                        <button
                            type="button"
                            className="danger"
                            onClick={(e) => removeRouteBookmark(e, feed.FEED_NO)}
                        >
                            해제
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
                            alt={safeText(shop.BUSINESS_NAME, "저장한 가게 이미지")}
                        />
                    ) : (
                        <div className="saved-image-empty">
                            LOCAL
                        </div>
                    )}

                    <span>가게</span>
                </div>

                <div className="saved-card-body">
                    <div className="saved-card-chip-row">
                        <em>{safeText(shop.AREA, "Korea")}</em>
                        <em>{safeText(shop.BUSINESS_TYPE, "LOCAL")}</em>
                    </div>

                    <h2>{safeText(shop.BUSINESS_NAME, "저장한 가게")}</h2>

                    <p>
                        {shop.AD_TITLE || shop.AD_TEXT || "K-STEP에서 저장한 로컬 가게입니다."}
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
                            가게 보기
                        </button>

                        <button
                            type="button"
                            className="danger"
                            onClick={(e) => removeShopSave(e, shop.AD_NO)}
                        >
                            해제
                        </button>
                    </div>
                </div>
            </article>
        );
    }

    const displayList = getDisplayList();

    return (
        <div className="saved-page">
            <PageDecor />

            <div className="saved-layout">
                <section className="saved-header">
                    <PageDecor variant="box" />

                    <div className="saved-brand-row">
                        <div className="saved-brand-mark">K</div>

                        <div className="saved-header-content">
                            <p>Favorite Collection</p>

                            <h1>즐겨찾기</h1>

                            <span>
                                마음에 든 여행 루트와 가게를 한 번에 모아볼 수 있어요.
                            </span>
                        </div>
                    </div>

                    <div className="saved-header-actions">
                        <button
                            type="button"
                            className="saved-icon-btn"
                            onClick={() => navigate("/home")}
                            title="홈으로"
                        >
                            ⌂
                        </button>

                        <button
                            type="button"
                            className="saved-icon-btn refresh"
                            onClick={getSavedList}
                            title="새로고침"
                        >
                            ↻
                        </button>

                        <button
                            type="button"
                            className="saved-icon-btn write"
                            onClick={() => navigate("/feed/new")}
                            title="작성"
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
                        <span>루트 즐겨찾기</span>
                    </button>

                    <button
                        type="button"
                        className={activeType === "shop" ? "saved-summary-card active" : "saved-summary-card"}
                        onClick={() => setActiveType("shop")}
                    >
                        <strong>{shopList.length}</strong>
                        <span>가게 즐겨찾기</span>
                    </button>

                    <button
                        type="button"
                        className={activeType === "all" ? "saved-summary-card active" : "saved-summary-card"}
                        onClick={() => setActiveType("all")}
                    >
                        <strong>{routeList.length + shopList.length}</strong>
                        <span>전체 즐겨찾기</span>
                    </button>
                </section>

                <div className="saved-list-section-title">
                    <strong>{getSectionTitle()}</strong>
                    <span>{displayList.length}개</span>
                </div>

                {loading && (
                    <div className="saved-empty-box">
                        즐겨찾기 목록을 불러오는 중입니다...
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
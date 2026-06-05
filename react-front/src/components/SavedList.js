import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SavedList.css";

function SavedList() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("route");
    const [routeList, setRouteList] = useState([]);
    const [storeList, setStoreList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = getToken();

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        getSavedList();
    }, [navigate]);

    function getToken() {
        return localStorage.getItem("token");
    }

    function safeText(value, defaultText) {
        if (value === undefined || value === null || value === "") {
            return defaultText;
        }

        return value;
    }

    function getFirstLetter(value) {
        if (!value) {
            return "K";
        }

        return String(value).substring(0, 1).toUpperCase();
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

    function getDateText(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString("ko-KR");
    }

    function getSavedList() {
        setLoading(true);

        Promise.all([
            getSavedRouteList(),
            getSavedStoreList()
        ])
            .finally(() => {
                setLoading(false);
            });
    }

    function getSavedRouteList() {
        const token = getToken();

        return fetch("http://localhost:3010/feed/bookmark/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("저장한 루트 목록", data);

                if (data.result === "success") {
                    setRouteList(data.list || []);
                } else {
                    console.log(data.message || "저장한 루트 목록 조회 실패");
                    setRouteList([]);
                }
            })
            .catch(err => {
                console.error(err);
                setRouteList([]);
            });
    }

    function getSavedStoreList() {
        const token = getToken();

        return fetch("http://localhost:3010/business/sponsor/save/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("저장한 가게 목록", data);

                if (data.result === "success") {
                    setStoreList(data.list || []);
                } else {
                    console.log(data.message || "저장한 가게 목록 조회 실패");
                    setStoreList([]);
                }
            })
            .catch(err => {
                console.error(err);
                setStoreList([]);
            });
    }

    function moveFeedDetail(feed) {
        if (!feed || !feed.FEED_NO) {
            return;
        }

        sessionStorage.setItem("selectedFeedNo", feed.FEED_NO);

        navigate("/feed/detail", {
            state: {
                feedNo: feed.FEED_NO
            }
        });
    }

    function moveAdDetail(ad) {
        if (!ad || !ad.AD_NO) {
            return;
        }

        sessionStorage.setItem("selectedAd", JSON.stringify(ad));
        navigate("/ad/detail/" + ad.AD_NO);
    }

    function removeSavedRoute(e, feed) {
        e.stopPropagation();

        if (!feed || !feed.FEED_NO) {
            return;
        }

        if (!window.confirm("저장한 루트를 해제할까요?")) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/feed/bookmark/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                feedNo: feed.FEED_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("루트 저장 해제", data);

                if (data.result === "success") {
                    setRouteList(prevList =>
                        prevList.filter(item => String(item.FEED_NO) !== String(feed.FEED_NO))
                    );
                    alert(data.message || "루트 저장을 해제했습니다.");
                } else {
                    alert(data.message || "루트 저장 해제에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("루트 저장 해제 중 오류가 발생했습니다.");
            });
    }

    function removeSavedStore(e, ad) {
        e.stopPropagation();

        if (!ad || !ad.AD_NO) {
            return;
        }

        if (!window.confirm("저장한 가게를 해제할까요?")) {
            return;
        }

        const token = getToken();

        fetch("http://localhost:3010/business/sponsor/save/toggle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                adNo: ad.AD_NO
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("가게 저장 해제", data);

                if (data.result === "success") {
                    setStoreList(prevList =>
                        prevList.filter(item => String(item.AD_NO) !== String(ad.AD_NO))
                    );
                    alert(data.message || "가게 저장을 해제했습니다.");
                } else {
                    alert(data.message || "가게 저장 해제에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("가게 저장 해제 중 오류가 발생했습니다.");
            });
    }

    function shareRoute(e, feed) {
        e.stopPropagation();

        if (!feed || !feed.FEED_NO) {
            return;
        }

        const shareUrl = window.location.origin + "/feed/detail?feedNo=" + feed.FEED_NO;
        copyText(shareUrl, "루트 링크가 복사되었습니다.");
    }

    function shareStore(e, ad) {
        e.stopPropagation();

        if (!ad || !ad.AD_NO) {
            return;
        }

        const shareUrl = window.location.origin + "/ad/detail/" + ad.AD_NO;
        copyText(shareUrl, "가게 링크가 복사되었습니다.");
    }

    function copyText(text, successMessage) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert(successMessage);
                })
                .catch(err => {
                    console.error(err);
                    alert("링크 복사에 실패했습니다.");
                });

            return;
        }

        alert(text);
    }

    return (
        <div className="saved-page">
            <div className="saved-bg-flower saved-flower-one">✿</div>
            <div className="saved-bg-flower saved-flower-two">❀</div>

            <div className="saved-layout">
                <section className="saved-header">
                    <div>
                        <p>Saved Collection</p>
                        <h1>저장함</h1>
                        <span>
                            저장한 여행 루트와 가게를 한 번에 모아볼 수 있어요.
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={getSavedList}
                    >
                        새로고침
                    </button>
                </section>

                <section className="saved-summary-row">
                    <div className="saved-summary-card">
                        <strong>{routeList.length}</strong>
                        <span>저장한 루트</span>
                    </div>

                    <div className="saved-summary-card">
                        <strong>{storeList.length}</strong>
                        <span>저장한 가게</span>
                    </div>

                    <div className="saved-summary-card">
                        <strong>{routeList.length + storeList.length}</strong>
                        <span>전체 저장</span>
                    </div>
                </section>

                <section className="saved-tab-row">
                    <button
                        type="button"
                        className={activeTab === "route" ? "active" : ""}
                        onClick={() => setActiveTab("route")}
                    >
                        저장한 루트
                    </button>

                    <button
                        type="button"
                        className={activeTab === "store" ? "active" : ""}
                        onClick={() => setActiveTab("store")}
                    >
                        저장한 가게
                    </button>
                </section>

                {loading && (
                    <div className="saved-empty-box">
                        저장함을 불러오는 중입니다...
                    </div>
                )}

                {!loading && activeTab === "route" && routeList.length === 0 && (
                    <div className="saved-empty-box">
                        아직 저장한 루트가 없습니다.
                        <br />
                        마음에 드는 여행 피드에서 루트 저장을 눌러보세요.
                    </div>
                )}

                {!loading && activeTab === "store" && storeList.length === 0 && (
                    <div className="saved-empty-box">
                        아직 저장한 가게가 없습니다.
                        <br />
                        광고 상세 페이지에서 가게 저장을 눌러보세요.
                    </div>
                )}

                {!loading && activeTab === "route" && routeList.length > 0 && (
                    <section className="saved-grid">
                        {routeList.map(feed => (
                            <article
                                className="saved-card"
                                key={feed.FEED_NO}
                                onClick={() => moveFeedDetail(feed)}
                            >
                                <div className="saved-image">
                                    {getImageUrl(feed.MAIN_IMG) !== "" ? (
                                        <img
                                            src={getImageUrl(feed.MAIN_IMG)}
                                            alt={safeText(feed.TITLE, "저장한 루트")}
                                        />
                                    ) : (
                                        <div className="saved-image-empty">
                                            K-STEP
                                        </div>
                                    )}

                                    <span>Route</span>
                                </div>

                                <div className="saved-card-body">
                                    <div className="saved-card-chip-row">
                                        <em>{safeText(feed.CATEGORY, "여행")}</em>
                                        <em>{safeText(feed.AREA, "Korea")}</em>
                                    </div>

                                    <h2>{safeText(feed.TITLE, "제목 없음")}</h2>

                                    <p>
                                        {safeText(feed.ROUTE_SUMMARY || feed.CONTENT, "저장한 여행 루트입니다.")}
                                    </p>

                                    <div className="saved-card-meta">
                                        <span>by {safeText(feed.NICKNAME, "traveler")}</span>
                                        <span>{getDateText(feed.CDATE)}</span>
                                    </div>

                                    <div className="saved-card-action-row">
                                        <button
                                            type="button"
                                            onClick={(e) => shareRoute(e, feed)}
                                        >
                                            공유
                                        </button>

                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={(e) => removeSavedRoute(e, feed)}
                                        >
                                            저장 해제
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}

                {!loading && activeTab === "store" && storeList.length > 0 && (
                    <section className="saved-grid">
                        {storeList.map(ad => (
                            <article
                                className="saved-card"
                                key={ad.AD_NO}
                                onClick={() => moveAdDetail(ad)}
                            >
                                <div className="saved-image">
                                    {getImageUrl(ad.IMAGE_URL) !== "" ? (
                                        <img
                                            src={getImageUrl(ad.IMAGE_URL)}
                                            alt={safeText(ad.BUSINESS_NAME, "저장한 가게")}
                                        />
                                    ) : (
                                        <div className="saved-image-empty">
                                            {getFirstLetter(ad.BUSINESS_NAME)}
                                        </div>
                                    )}

                                    <span>Store</span>
                                </div>

                                <div className="saved-card-body">
                                    <div className="saved-card-chip-row">
                                        <em>Sponsored</em>
                                        <em>{safeText(ad.AREA, "Korea")}</em>
                                    </div>

                                    <h2>{safeText(ad.BUSINESS_NAME, "로컬 가게")}</h2>

                                    <p>
                                        {safeText(ad.AD_TITLE || ad.AD_TEXT, "저장한 가게입니다.")}
                                    </p>

                                    <div className="saved-card-meta">
                                        <span>{safeText(ad.BUSINESS_TYPE, "LOCAL")}</span>
                                        <span>가게 저장됨</span>
                                    </div>

                                    <div className="saved-card-action-row">
                                        <button
                                            type="button"
                                            onClick={(e) => shareStore(e, ad)}
                                        >
                                            공유
                                        </button>

                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={(e) => removeSavedStore(e, ad)}
                                        >
                                            저장 해제
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
}

export default SavedList;
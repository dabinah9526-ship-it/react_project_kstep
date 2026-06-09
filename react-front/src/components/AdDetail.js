import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import "./AdDetail.css";

function AdDetail() {
    const navigate = useNavigate();
    const { adNo } = useParams();

    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getAdDetail();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adNo]);

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

    function stopButtonEvent(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
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

    function getAdImageUrl(value) {
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

    function normalizeLinkUrl(value) {
        if (!value) {
            return "";
        }

        const link = String(value).trim();

        if (link === "") {
            return "";
        }

        if (link.startsWith("http://") || link.startsWith("https://")) {
            return link;
        }

        return "https://" + link;
    }

    function getAddressText() {
        if (!ad) {
            return "";
        }

        return (
            ad.ADDRESS ||
            ad.BUSINESS_ADDRESS ||
            ad.PLACE_ADDRESS ||
            ad.ROAD_ADDRESS ||
            ""
        );
    }

    function getPhoneText() {
        if (!ad) {
            return "";
        }

        return (
            ad.PHONE ||
            ad.TEL ||
            ad.BUSINESS_PHONE ||
            ad.CONTACT ||
            ""
        );
    }

    function getOpenHoursText() {
        if (!ad) {
            return "";
        }

        return ad.OPEN_HOURS || ad.BUSINESS_HOURS || ad.OPERATING_HOURS || "";
    }

    function getMainMenuText() {
        if (!ad) {
            return "";
        }

        return ad.MAIN_MENU || ad.MENU_INFO || ad.MAIN_PRODUCT || "";
    }

    function getPriceInfoText() {
        if (!ad) {
            return "";
        }

        return ad.PRICE_INFO || ad.PRICE_RANGE || ad.PRICE || "";
    }

    function getParkingInfoText() {
        if (!ad) {
            return "";
        }

        return ad.PARKING_INFO || ad.PARKING || "";
    }

    function getMapUrl() {
        if (!ad) {
            return "";
        }

        return normalizeLinkUrl(
            ad.MAP_URL ||
            ad.NAVER_MAP_URL ||
            ad.KAKAO_MAP_URL ||
            ad.PLACE_URL ||
            ""
        );
    }

    function getInstagramUrl() {
        if (!ad) {
            return "";
        }

        return normalizeLinkUrl(
            ad.INSTAGRAM_URL ||
            ad.INSTA_URL ||
            ad.SNS_URL ||
            ""
        );
    }

    function getAdLinkUrl() {
        if (!ad) {
            return "";
        }

        return normalizeLinkUrl(
            ad.LINK_URL ||
            ad.LINK ||
            ad.URL ||
            ad.HOMEPAGE ||
            ad.HOME_PAGE ||
            ""
        );
    }

    function getKakaoMapSearchUrl() {
        const addressText = getAddressText();
        const businessName = ad ? safeText(ad.BUSINESS_NAME, "") : "";

        const keyword = addressText !== ""
            ? addressText
            : businessName;

        if (!keyword) {
            return "";
        }

        return "https://map.kakao.com/link/search/" + encodeURIComponent(keyword);
    }

    function getGoogleMapEmbedUrl() {
        const addressText = getAddressText();
        const businessName = ad ? safeText(ad.BUSINESS_NAME, "") : "";

        const keyword = addressText !== ""
            ? addressText
            : businessName;

        if (!keyword) {
            return "";
        }

        return "https://www.google.com/maps?q=" + encodeURIComponent(keyword) + "&output=embed";
    }

    function getAdDetail() {
        const token = getToken();

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
            return;
        }

        if (!adNo) {
            alert("광고 번호가 없습니다.");
            navigate("/home");
            return;
        }

        setLoading(true);

        const savedAdText = sessionStorage.getItem("selectedAd");

        if (savedAdText) {
            try {
                const savedAd = JSON.parse(savedAdText);

                if (String(savedAd.AD_NO) === String(adNo)) {
                    setAd(savedAd);
                }
            } catch (err) {
                console.error("저장된 광고 정보 읽기 실패", err);
            }
        }

        fetch("http://localhost:3010/business/sponsor/detail/" + adNo, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("광고 상세 조회", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    setAd(data.ad);
                    sessionStorage.setItem("selectedAd", JSON.stringify(data.ad));
                    return;
                }

                getAdDetailFallback();
            })
            .catch(err => {
                console.error(err);
                getAdDetailFallback();
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function getAdDetailFallback() {
        const token = getToken();

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
            return;
        }

        fetch("http://localhost:3010/business/sponsor/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("광고 상세 대체 목록 조회", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    const list = data.list || [];
                    const selectedAd = list.find(item => String(item.AD_NO) === String(adNo));

                    if (selectedAd) {
                        setAd(selectedAd);
                        sessionStorage.setItem("selectedAd", JSON.stringify(selectedAd));
                    }
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    function openExternalLink(e) {
        stopButtonEvent(e);

        if (!ad || !ad.AD_NO) {
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
            return;
        }

        fetch("http://localhost:3010/business/sponsor/click", {
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
                console.log("광고 클릭 처리", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                let linkUrl = "";

                if (data.result === "success") {
                    linkUrl = normalizeLinkUrl(data.linkUrl);
                }

                if (linkUrl === "") {
                    linkUrl = getAdLinkUrl();
                }

                if (linkUrl === "") {
                    linkUrl = getMapUrl();
                }

                if (linkUrl === "") {
                    linkUrl = getKakaoMapSearchUrl();
                }

                if (linkUrl === "") {
                    alert("연결된 외부 링크가 없습니다.");
                    return;
                }

                window.open(linkUrl, "_blank", "noopener,noreferrer");
            })
            .catch(err => {
                console.error(err);

                const linkUrl = getAdLinkUrl() || getMapUrl() || getKakaoMapSearchUrl();

                if (linkUrl === "") {
                    alert("연결된 외부 링크가 없습니다.");
                    return;
                }

                window.open(linkUrl, "_blank", "noopener,noreferrer");
            });
    }

    function toggleSaveAd(e) {
        stopButtonEvent(e);

        if (!ad || !ad.AD_NO) {
            return;
        }

        const token = getToken();

        if (!token) {
            moveLoginPage("로그인이 필요합니다.");
            return;
        }

        setSaving(true);

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
                console.log("가게 저장 처리", data);

                if (handleLoginRequired(data)) {
                    return;
                }

                if (data.result === "success") {
                    const nextSaveYn =
                        data.saveYn ||
                        data.savedYn ||
                        data.SAVE_YN ||
                        "N";

                    const savedAd = {
                        ...ad,
                        SAVE_YN: nextSaveYn
                    };

                    setAd(savedAd);
                    sessionStorage.setItem("selectedAd", JSON.stringify(savedAd));

                    alert(data.message || "가게 저장 처리가 완료되었습니다.");
                } else {
                    alert(data.message || "가게 저장 처리에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("가게 저장 처리 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setSaving(false);
            });
    }

    function shareAd(e) {
        stopButtonEvent(e);

        if (!ad) {
            return;
        }

        const shareUrl = window.location.href;
        const title = safeText(ad.BUSINESS_NAME, "K-STEP 추천 가게");

        if (navigator.share) {
            navigator.share({
                title: title,
                text: title + " 정보를 확인해보세요.",
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        copyText(shareUrl, "광고 링크가 복사되었습니다.");
    }

    function copyText(text, successMessage) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert(successMessage);
                })
                .catch(err => {
                    console.error(err);
                    alert("복사에 실패했습니다.");
                });

            return;
        }

        alert(text);
    }

    function copyAddress(e) {
        stopButtonEvent(e);

        const addressText = getAddressText();

        if (!addressText) {
            alert("복사할 주소가 없습니다.");
            return;
        }

        copyText(addressText, "주소가 복사되었습니다.");
    }

    function openMapSearch(e) {
        stopButtonEvent(e);

        const mapUrl = getMapUrl() || getKakaoMapSearchUrl();

        if (!mapUrl) {
            alert("지도에서 검색할 주소나 가게명이 없습니다.");
            return;
        }

        window.open(mapUrl, "_blank", "noopener,noreferrer");
    }

    function openInstagram(e) {
        stopButtonEvent(e);

        const instagramUrl = getInstagramUrl();

        if (!instagramUrl) {
            alert("등록된 인스타그램 링크가 없습니다.");
            return;
        }

        window.open(instagramUrl, "_blank", "noopener,noreferrer");
    }

    if (loading && !ad) {
        return (
            <div className="ad-detail-page">
                <PageDecor />

                <div className="ad-detail-empty">
                    <div className="ad-detail-empty-icon">⌛</div>
                    <strong>광고 정보를 불러오는 중입니다...</strong>
                    <p>잠시만 기다려주세요.</p>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    if (!ad) {
        return (
            <div className="ad-detail-page">
                <PageDecor />

                <div className="ad-detail-empty">
                    <div className="ad-detail-empty-icon">!</div>
                    <strong>광고 정보를 찾을 수 없습니다.</strong>
                    <p>광고가 종료되었거나 존재하지 않는 광고일 수 있어요.</p>

                    <button
                        type="button"
                        onClick={() => navigate("/home")}
                    >
                        홈으로 돌아가기
                    </button>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    const addressText = getAddressText();
    const phoneText = getPhoneText();
    const openHoursText = getOpenHoursText();
    const mainMenuText = getMainMenuText();
    const priceInfoText = getPriceInfoText();
    const parkingInfoText = getParkingInfoText();
    const linkUrl = getAdLinkUrl();
    const mapUrl = getMapUrl();
    const instagramUrl = getInstagramUrl();
    const mapEmbedUrl = getGoogleMapEmbedUrl();
    const saveYn = ad.SAVE_YN === "Y" || ad.SAVED_YN === "Y";

    return (
        <div className="ad-detail-page">
            <PageDecor />

            <div className="ad-detail-wrap">
                <section className="ad-detail-app-top">
                    <PageDecor variant="box" />

                    <div className="ad-detail-brand-row">
                        <div className="ad-detail-brand-mark">K</div>

                        <div>
                            <p className="ad-detail-top-label">K-STEP Local Sponsor</p>
                            <h1>가게 상세</h1>
                            <span>
                                여행 중 들러보기 좋은 로컬 스폰서 정보를 확인해요.
                            </span>
                        </div>
                    </div>

                    <div className="ad-detail-top-icons">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            title="뒤로가기"
                        >
                            ↩
                        </button>

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
                </section>

                <section className="ad-detail-hero">
                    <div className="ad-detail-image-box">
                        {getAdImageUrl(ad.IMAGE_URL) !== "" ? (
                            <img
                                src={getAdImageUrl(ad.IMAGE_URL)}
                                alt={safeText(ad.AD_TITLE, "광고 이미지")}
                            />
                        ) : (
                            <div className="ad-detail-gradient">
                                <span>{getFirstLetter(ad.BUSINESS_NAME)}</span>
                            </div>
                        )}

                        <div className="ad-detail-sponsored">Sponsored</div>

                        <div className="ad-detail-image-bottom">
                            <span>{safeText(ad.BUSINESS_TYPE, "LOCAL")}</span>
                            <strong>{safeText(ad.AREA, "Korea")}</strong>
                        </div>
                    </div>

                    <div className="ad-detail-info">
                        <div className="ad-detail-chip-row">
                            <span>Sponsored</span>
                            <em>{safeText(ad.BUSINESS_TYPE, "LOCAL")}</em>
                            <em>{safeText(ad.AREA, "Korea")}</em>
                        </div>

                        <p className="ad-detail-page-label">K-STEP 로컬 스폰서</p>

                        <h1>{safeText(ad.BUSINESS_NAME, "로컬 스폰서")}</h1>

                        <h2>{safeText(ad.AD_TITLE, "여행자에게 추천하는 장소")}</h2>

                        <p className="ad-detail-text">
                            {safeText(ad.AD_TEXT, "K-STEP 여행자에게 추천하는 로컬 스폰서입니다.")}
                        </p>

                        <div className="ad-detail-feature-grid">
                            <div>
                                <span>운영시간</span>
                                <strong>{safeText(openHoursText, "매일 10:00 - 21:00")}</strong>
                            </div>

                            <div>
                                <span>가격대</span>
                                <strong>{safeText(priceInfoText, "1인 평균 10,000원 - 30,000원")}</strong>
                            </div>

                            <div>
                                <span>주차</span>
                                <strong>{safeText(parkingInfoText, "인근 주차장 이용 가능")}</strong>
                            </div>
                        </div>

                        <div className="ad-detail-action-row">
                            <button
                                type="button"
                                className="primary"
                                onClick={openExternalLink}
                            >
                                가게보기
                            </button>

                            <button
                                type="button"
                                className={saveYn ? "saved" : ""}
                                onClick={toggleSaveAd}
                                disabled={saving}
                            >
                                {saving ? "처리중..." : saveYn ? "저장 취소" : "가게 저장"}
                            </button>

                            <button
                                type="button"
                                onClick={shareAd}
                            >
                                공유하기
                            </button>
                        </div>
                    </div>
                </section>

                <section className="ad-detail-card">
                    <div className="ad-detail-section-title">
                        <div>
                            <span>Information</span>
                            <h3>가게 정보</h3>
                        </div>

                        <p>광고주가 등록한 기본 정보입니다.</p>
                    </div>

                    <div className="ad-detail-info-list">
                        <div>
                            <strong>상호명</strong>
                            <p>{safeText(ad.BUSINESS_NAME, "정보 없음")}</p>
                        </div>

                        <div>
                            <strong>분류</strong>
                            <p>{safeText(ad.BUSINESS_TYPE, "정보 없음")}</p>
                        </div>

                        <div>
                            <strong>지역</strong>
                            <p>{safeText(ad.AREA, "정보 없음")}</p>
                        </div>

                        <div>
                            <strong>주소</strong>
                            <p>{safeText(addressText, "등록된 주소가 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>연락처</strong>
                            <p>{safeText(phoneText, "등록된 연락처가 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>운영시간</strong>
                            <p>{safeText(openHoursText, "등록된 운영시간이 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>대표메뉴 / 상품</strong>
                            <p>{safeText(mainMenuText, "등록된 대표 메뉴가 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>가격 정보</strong>
                            <p>{safeText(priceInfoText, "등록된 가격 정보가 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>주차 정보</strong>
                            <p>{safeText(parkingInfoText, "등록된 주차 정보가 없습니다.")}</p>
                        </div>
                    </div>

                    <div className="ad-detail-link-row">
                        <button
                            type="button"
                            onClick={openExternalLink}
                        >
                            외부 링크 열기
                        </button>

                        <button
                            type="button"
                            onClick={openMapSearch}
                        >
                            지도 보기
                        </button>

                        <button
                            type="button"
                            onClick={openInstagram}
                        >
                            인스타그램
                        </button>
                    </div>

                    <div className="ad-detail-url-list">
                        <p>
                            <strong>외부 링크</strong>
                            <span>{linkUrl || "등록된 외부 링크가 없습니다."}</span>
                        </p>

                        <p>
                            <strong>지도 링크</strong>
                            <span>{mapUrl || "등록된 지도 링크가 없습니다."}</span>
                        </p>

                        <p>
                            <strong>인스타그램</strong>
                            <span>{instagramUrl || "등록된 인스타그램 링크가 없습니다."}</span>
                        </p>
                    </div>
                </section>

                <section className="ad-detail-map-card">
                    <div className="ad-detail-section-title">
                        <div>
                            <span>Map</span>
                            <h3>위치 확인</h3>
                        </div>

                        <p>주소가 있으면 지도에서 바로 확인할 수 있어요.</p>
                    </div>

                    {mapEmbedUrl !== "" ? (
                        <>
                            <div className="ad-detail-map-box">
                                <iframe
                                    title="가게 위치 지도"
                                    src={mapEmbedUrl}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>

                            <div className="ad-detail-map-action-row">
                                <button
                                    type="button"
                                    onClick={openMapSearch}
                                >
                                    지도에서 보기
                                </button>

                                <button
                                    type="button"
                                    onClick={copyAddress}
                                >
                                    주소 복사
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="ad-detail-map-empty">
                            등록된 주소가 없어서 지도를 표시할 수 없습니다.
                        </div>
                    )}
                </section>

                <section className="ad-detail-bottom-grid">
                    <div className="ad-detail-card small">
                        <div className="ad-detail-section-title">
                            <div>
                                <span>Menu</span>
                                <h3>대표 메뉴 / 추천 상품</h3>
                            </div>
                        </div>

                        <p className="ad-detail-menu-text">
                            {safeText(mainMenuText, "대표 메뉴 또는 추천 상품 정보가 아직 등록되지 않았습니다.")}
                        </p>
                    </div>

                    <div className="ad-detail-card small">
                        <div className="ad-detail-section-title">
                            <div>
                                <span>Notice</span>
                                <h3>방문 전 확인</h3>
                            </div>
                        </div>

                        <p className="ad-detail-notice">
                            운영시간, 예약 가능 여부, 가격 정보는 가게 사정에 따라 달라질 수 있어요.
                            방문 전 외부 링크나 연락처로 한 번 더 확인하는 걸 추천해요.
                        </p>
                    </div>
                </section>
            </div>

            <ScrollTopButton />
        </div>
    );
}

export default AdDetail;
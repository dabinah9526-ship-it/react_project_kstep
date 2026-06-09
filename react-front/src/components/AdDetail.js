import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./AdDetail.css";

function AdDetail() {
    const navigate = useNavigate();
    const { adNo } = useParams();

    const [language, setLanguage] = useState(getLang());

    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

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

        alert(message || t("loginRequired"));
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
            moveLoginPage(data.message || t("loginRequired"));
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

        return (
            ad.OPEN_HOURS ||
            ad.BUSINESS_HOURS ||
            ad.OPERATING_HOURS ||
            ""
        );
    }

    function getMainMenuText() {
        if (!ad) {
            return "";
        }

        return (
            ad.MAIN_MENU ||
            ad.MENU_INFO ||
            ad.MAIN_PRODUCT ||
            ""
        );
    }

    function getPriceInfoText() {
        if (!ad) {
            return "";
        }

        return (
            ad.PRICE_INFO ||
            ad.PRICE_RANGE ||
            ad.PRICE ||
            ""
        );
    }

    function getParkingInfoText() {
        if (!ad) {
            return "";
        }

        return (
            ad.PARKING_INFO ||
            ad.PARKING ||
            ""
        );
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
            moveLoginPage(t("loginRequired"));
            return;
        }

        if (!adNo) {
            alert(language === "en" ? "Sponsor number is missing." : "광고 번호가 없습니다.");
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
            moveLoginPage(t("loginRequired"));
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
            moveLoginPage(t("loginRequired"));
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
                    alert(language === "en" ? "No external link has been added." : "연결된 외부 링크가 없습니다.");
                    return;
                }

                window.open(linkUrl, "_blank", "noopener,noreferrer");
            })
            .catch(err => {
                console.error(err);

                const linkUrl = getAdLinkUrl() || getMapUrl() || getKakaoMapSearchUrl();

                if (linkUrl === "") {
                    alert(language === "en" ? "No external link has been added." : "연결된 외부 링크가 없습니다.");
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
            moveLoginPage(t("loginRequired"));
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

                    alert(data.message || (language === "en" ? "Store save status has been updated." : "가게 저장 처리가 완료되었습니다."));
                } else {
                    alert(data.message || (language === "en" ? "Failed to save store." : "가게 저장 처리에 실패했습니다."));
                }
            })
            .catch(err => {
                console.error(err);
                alert(language === "en" ? "An error occurred while saving store." : "가게 저장 처리 중 오류가 발생했습니다.");
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
        const title = safeText(ad.BUSINESS_NAME, "K-STEP Local Sponsor");

        if (navigator.share) {
            navigator.share({
                title: title,
                text: title,
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        copyText(
            shareUrl,
            language === "en" ? "Sponsor link has been copied." : "광고 링크가 복사되었습니다."
        );
    }

    function copyText(text, successMessage) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert(successMessage);
                })
                .catch(err => {
                    console.error(err);
                    alert(language === "en" ? "Failed to copy." : "복사에 실패했습니다.");
                });

            return;
        }

        alert(text);
    }

    function copyAddress(e) {
        stopButtonEvent(e);

        const addressText = getAddressText();

        if (!addressText) {
            alert(language === "en" ? "No address to copy." : "복사할 주소가 없습니다.");
            return;
        }

        copyText(
            addressText,
            language === "en" ? "Address has been copied." : "주소가 복사되었습니다."
        );
    }

    function openMapSearch(e) {
        stopButtonEvent(e);

        const mapUrl = getMapUrl() || getKakaoMapSearchUrl();

        if (!mapUrl) {
            alert(language === "en" ? "No address or store name to search." : "지도에서 검색할 주소나 가게명이 없습니다.");
            return;
        }

        window.open(mapUrl, "_blank", "noopener,noreferrer");
    }

    function openInstagram(e) {
        stopButtonEvent(e);

        const instagramUrl = getInstagramUrl();

        if (!instagramUrl) {
            alert(language === "en" ? "No Instagram link has been added." : "등록된 인스타그램 링크가 없습니다.");
            return;
        }

        window.open(instagramUrl, "_blank", "noopener,noreferrer");
    }

    if (loading && !ad) {
        return (
            <div className="ad-detail-page" data-lang={language}>
                <PageDecor />

                <div className="ad-detail-empty">
                    <div className="ad-detail-empty-icon">⌛</div>
                    <strong>{t("adLoading")}</strong>
                    <p>{t("waitText")}</p>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    if (!ad) {
        return (
            <div className="ad-detail-page" data-lang={language}>
                <PageDecor />

                <div className="ad-detail-empty">
                    <div className="ad-detail-empty-icon">!</div>
                    <strong>{t("adNotFound")}</strong>
                    <p>{t("adNotFoundSub")}</p>

                    <button
                        type="button"
                        onClick={() => navigate("/home")}
                    >
                        {t("goHome")}
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
        <div className="ad-detail-page" data-lang={language}>
            <PageDecor />

            <div className="ad-detail-wrap">
                <section className="ad-detail-app-top">
                    <PageDecor variant="box" />

                    <div className="ad-detail-brand-row">
                        <div className="ad-detail-brand-mark">K</div>

                        <div>
                            <p className="ad-detail-top-label">{t("sponsorLabel")}</p>
                            <h1>{t("adDetailTitle")}</h1>
                            <span>{t("adDetailSub")}</span>
                        </div>
                    </div>

                    <div className="ad-detail-top-icons">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            title={t("back")}
                        >
                            ↩
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                            title={t("home")}
                        >
                            ⌂
                        </button>

                        <button
                            type="button"
                            className="write"
                            onClick={() => navigate("/feed/new")}
                            title={t("create")}
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
                                alt={safeText(ad.AD_TITLE, "sponsor image")}
                            />
                        ) : (
                            <div className="ad-detail-gradient">
                                <span>{getFirstLetter(ad.BUSINESS_NAME)}</span>
                            </div>
                        )}

                        <div className="ad-detail-sponsored">{t("sponsored")}</div>

                        <div className="ad-detail-image-bottom">
                            <span>{safeText(ad.BUSINESS_TYPE, "LOCAL")}</span>
                            <strong>{safeText(ad.AREA, "Korea")}</strong>
                        </div>
                    </div>

                    <div className="ad-detail-info">
                        <div className="ad-detail-chip-row">
                            <span>{t("sponsored")}</span>
                            <em>{safeText(ad.BUSINESS_TYPE, "LOCAL")}</em>
                            <em>{safeText(ad.AREA, "Korea")}</em>
                        </div>

                        <p className="ad-detail-page-label">{t("localSponsor")}</p>

                        <h1>{safeText(ad.BUSINESS_NAME, language === "en" ? "Local Sponsor" : "로컬 스폰서")}</h1>

                        <h2>
                            {safeText(
                                ad.AD_TITLE,
                                language === "en" ? "Recommended place for travelers" : "여행자에게 추천하는 장소"
                            )}
                        </h2>

                        <p className="ad-detail-text">
                            {safeText(
                                ad.AD_TEXT,
                                language === "en"
                                    ? "A local sponsor recommended for K-STEP travelers."
                                    : "K-STEP 여행자에게 추천하는 로컬 스폰서입니다."
                            )}
                        </p>

                        <div className="ad-detail-feature-grid">
                            <div>
                                <span>{t("openHours")}</span>
                                <strong>
                                    {safeText(
                                        openHoursText,
                                        language === "en" ? "Daily 10:00 - 21:00" : "매일 10:00 - 21:00"
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>{t("priceInfo")}</span>
                                <strong>
                                    {safeText(
                                        priceInfoText,
                                        language === "en" ? "Average 10,000 - 30,000 KRW per person" : "1인 평균 10,000원 - 30,000원"
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>{t("parkingInfo")}</span>
                                <strong>
                                    {safeText(
                                        parkingInfoText,
                                        language === "en" ? "Nearby parking available" : "인근 주차장 이용 가능"
                                    )}
                                </strong>
                            </div>
                        </div>

                        <div className="ad-detail-action-row">
                            <button
                                type="button"
                                className="primary"
                                onClick={openExternalLink}
                            >
                                {t("storeView")}
                            </button>

                            <button
                                type="button"
                                className={saveYn ? "saved" : ""}
                                onClick={toggleSaveAd}
                                disabled={saving}
                            >
                                {saving
                                    ? (language === "en" ? "Saving..." : "처리중...")
                                    : saveYn
                                        ? t("unsaveStore")
                                        : t("saveStore")
                                }
                            </button>

                            <button
                                type="button"
                                onClick={shareAd}
                            >
                                {t("shareStore")}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="ad-detail-card">
                    <div className="ad-detail-section-title">
                        <div>
                            <span>Information</span>
                            <h3>{t("information")}</h3>
                        </div>

                        <p>{t("informationSub")}</p>
                    </div>

                    <div className="ad-detail-info-list">
                        <div>
                            <strong>{t("businessName")}</strong>
                            <p>{safeText(ad.BUSINESS_NAME, language === "en" ? "No information" : "정보 없음")}</p>
                        </div>

                        <div>
                            <strong>{t("category")}</strong>
                            <p>{safeText(ad.BUSINESS_TYPE, language === "en" ? "No information" : "정보 없음")}</p>
                        </div>

                        <div>
                            <strong>{t("area")}</strong>
                            <p>{safeText(ad.AREA, language === "en" ? "No information" : "정보 없음")}</p>
                        </div>

                        <div>
                            <strong>{t("address")}</strong>
                            <p>{safeText(addressText, language === "en" ? "No address has been added." : "등록된 주소가 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>{t("phone")}</strong>
                            <p>{safeText(phoneText, language === "en" ? "No phone number has been added." : "등록된 연락처가 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>{t("openHours")}</strong>
                            <p>{safeText(openHoursText, language === "en" ? "No opening hours have been added." : "등록된 운영시간이 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>{t("mainMenu")}</strong>
                            <p>{safeText(mainMenuText, language === "en" ? "No main menu has been added." : "등록된 대표 메뉴가 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>{t("priceInfo")}</strong>
                            <p>{safeText(priceInfoText, language === "en" ? "No price information has been added." : "등록된 가격 정보가 없습니다.")}</p>
                        </div>

                        <div>
                            <strong>{t("parkingInfo")}</strong>
                            <p>{safeText(parkingInfoText, language === "en" ? "No parking information has been added." : "등록된 주차 정보가 없습니다.")}</p>
                        </div>
                    </div>

                    <div className="ad-detail-link-row">
                        <button
                            type="button"
                            onClick={openExternalLink}
                        >
                            {t("openExternalLink")}
                        </button>

                        <button
                            type="button"
                            onClick={openMapSearch}
                        >
                            {t("mapView")}
                        </button>

                        <button
                            type="button"
                            onClick={openInstagram}
                        >
                            {t("instagram")}
                        </button>
                    </div>

                    <div className="ad-detail-url-list">
                        <p>
                            <strong>{t("externalLink")}</strong>
                            <span>{linkUrl || (language === "en" ? "No external link has been added." : "등록된 외부 링크가 없습니다.")}</span>
                        </p>

                        <p>
                            <strong>{t("mapView")}</strong>
                            <span>{mapUrl || (language === "en" ? "No map link has been added." : "등록된 지도 링크가 없습니다.")}</span>
                        </p>

                        <p>
                            <strong>{t("instagram")}</strong>
                            <span>{instagramUrl || (language === "en" ? "No Instagram link has been added." : "등록된 인스타그램 링크가 없습니다.")}</span>
                        </p>
                    </div>
                </section>

                <section className="ad-detail-map-card">
                    <div className="ad-detail-section-title">
                        <div>
                            <span>Map</span>
                            <h3>{t("map")}</h3>
                        </div>

                        <p>{t("mapSub")}</p>
                    </div>

                    {mapEmbedUrl !== "" ? (
                        <>
                            <div className="ad-detail-map-box">
                                <iframe
                                    title={t("map")}
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
                                    {t("openInMap")}
                                </button>

                                <button
                                    type="button"
                                    onClick={copyAddress}
                                >
                                    {t("copyAddress")}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="ad-detail-map-empty">
                            {language === "en"
                                ? "No address has been added, so the map cannot be displayed."
                                : "등록된 주소가 없어서 지도를 표시할 수 없습니다."
                            }
                        </div>
                    )}
                </section>

                <section className="ad-detail-bottom-grid">
                    <div className="ad-detail-card small">
                        <div className="ad-detail-section-title">
                            <div>
                                <span>Menu</span>
                                <h3>{t("menuTitle")}</h3>
                            </div>
                        </div>

                        <p className="ad-detail-menu-text">
                            {safeText(
                                mainMenuText,
                                language === "en"
                                    ? "No main menu or recommended item has been added yet."
                                    : "대표 메뉴 또는 추천 상품 정보가 아직 등록되지 않았습니다."
                            )}
                        </p>
                    </div>

                    <div className="ad-detail-card small">
                        <div className="ad-detail-section-title">
                            <div>
                                <span>Notice</span>
                                <h3>{t("noticeTitle")}</h3>
                            </div>
                        </div>

                        <p className="ad-detail-notice">
                            {t("noticeText")}
                        </p>
                    </div>
                </section>
            </div>

            <ScrollTopButton />
        </div>
    );
}

export default AdDetail;
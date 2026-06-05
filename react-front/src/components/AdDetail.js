import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdDetail.css";

function AdDetail() {
    const navigate = useNavigate();
    const { adNo } = useParams();

    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getAdDetail();
    }, [adNo]);

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

    function getAdDetail() {
        const token = getToken();

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
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

        fetch("http://localhost:3010/business/sponsor/list", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("광고 상세 대체 목록 조회", data);

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

    function openExternalLink() {
        if (!ad || !ad.AD_NO) {
            return;
        }

        const token = getToken();

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

                let linkUrl = "";

                if (data.result === "success") {
                    linkUrl = normalizeLinkUrl(data.linkUrl);
                }

                if (linkUrl === "") {
                    linkUrl = getAdLinkUrl();
                }

                if (linkUrl === "") {
                    alert("연결된 외부 링크가 없습니다.");
                    return;
                }

                window.open(linkUrl, "_blank");
            })
            .catch(err => {
                console.error(err);

                const linkUrl = getAdLinkUrl();

                if (linkUrl === "") {
                    alert("연결된 외부 링크가 없습니다.");
                    return;
                }

                window.open(linkUrl, "_blank");
            });
    }

    function toggleSaveAd() {
        if (!ad || !ad.AD_NO) {
            return;
        }

        const token = getToken();

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

                if (data.result === "success") {
                    setAd({
                        ...ad,
                        SAVE_YN: data.saveYn
                    });

                    const savedAd = {
                        ...ad,
                        SAVE_YN: data.saveYn
                    };

                    sessionStorage.setItem("selectedAd", JSON.stringify(savedAd));
                    alert(data.message);
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

    function shareAd() {
        const shareUrl = window.location.href;
        const title = ad ? safeText(ad.BUSINESS_NAME, "K-STEP 추천 가게") : "K-STEP 추천 가게";

        if (navigator.share) {
            navigator.share({
                title: title,
                text: title + " 광고를 확인해보세요.",
                url: shareUrl
            })
                .catch(err => {
                    console.error(err);
                });

            return;
        }

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert("광고 링크가 복사되었습니다.");
            })
            .catch(err => {
                console.error(err);
                alert("링크 복사에 실패했습니다.");
            });
    }

    if (loading && !ad) {
        return (
            <div className="ad-detail-page">
                <div className="ad-detail-empty">
                    <div className="ad-detail-empty-icon">⌛</div>
                    <strong>광고 정보를 불러오는 중입니다...</strong>
                    <p>잠시만 기다려주세요.</p>
                </div>
            </div>
        );
    }

    if (!ad) {
        return (
            <div className="ad-detail-page">
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
            </div>
        );
    }

    const addressText = getAddressText();
    const phoneText = getPhoneText();
    const linkUrl = getAdLinkUrl();
    const saveYn = ad.SAVE_YN === "Y";

    return (
        <div className="ad-detail-page">
            <div className="ad-detail-bg-flower flower-one">✿</div>
            <div className="ad-detail-bg-flower flower-two">❀</div>

            <div className="ad-detail-wrap">
                <div className="ad-detail-topbar">
                    <button
                        type="button"
                        className="ad-detail-back"
                        onClick={() => navigate(-1)}
                    >
                        ‹ 뒤로
                    </button>

                    <button
                        type="button"
                        className="ad-detail-home-btn"
                        onClick={() => navigate("/home")}
                    >
                        홈으로
                    </button>
                </div>

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

                        <div className="ad-detail-mini-stat-row">
                            <div>
                                <strong>{Number(ad.VIEW_COUNT || 0).toLocaleString()}</strong>
                                <span>노출</span>
                            </div>

                            <div>
                                <strong>{Number(ad.CLICK_COUNT || 0).toLocaleString()}</strong>
                                <span>클릭</span>
                            </div>

                            <div>
                                <strong>{saveYn ? "저장됨" : "저장 가능"}</strong>
                                <span>가게 저장</span>
                            </div>
                        </div>

                        <div className="ad-detail-action-row">
                            <button
                                type="button"
                                className="primary"
                                onClick={openExternalLink}
                            >
                                {safeText(ad.CTA_TEXT, "가게보기")}
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

                        {linkUrl === "" && (
                            <p className="ad-detail-link-alert">
                                아직 외부 링크가 등록되지 않은 광고입니다.
                            </p>
                        )}
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
                            <strong>외부 링크</strong>
                            <p>{linkUrl !== "" ? linkUrl : "등록된 링크가 없습니다."}</p>
                        </div>
                    </div>
                </section>

                <section className="ad-detail-bottom-grid">
                    <div className="ad-detail-card small">
                        <div className="ad-detail-section-title">
                            <div>
                                <span>Point</span>
                                <h3>여행자 추천 포인트</h3>
                            </div>
                        </div>

                        <ul className="ad-detail-point-list">
                            <li>여행 중 바로 들르기 좋은 로컬 장소예요.</li>
                            <li>지역, 업종, 소개를 확인하고 일정에 넣어볼 수 있어요.</li>
                            <li>마음에 들면 가게 저장으로 나중에 다시 확인할 수 있어요.</li>
                        </ul>
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
        </div>
    );
}

export default AdDetail;
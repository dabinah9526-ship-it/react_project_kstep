import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./BusinessBoost.css";

function BusinessBoost() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
        }
    }, [navigate]);

    function requestAd(planName) {
        alert(planName + " 광고 신청은 다음 단계에서 결제/신청 API와 연결하면 됩니다.");
    }

    return (
        <div className="business-page">
            <div className="business-container">
                <section className="business-hero">
                    <p className="business-badge">K-STEP Business Boost</p>

                    <h1>
                        로컬 가게와 여행 코스를<br />
                        더 많은 여행자에게 보여주세요
                    </h1>

                    <p>
                        맛집, 카페, 숙소, 체험 공간을 운영하는 사업자를 위한 홍보 페이지입니다.
                        K-STEP 피드와 탐색 화면에서 가게를 자연스럽게 노출할 수 있도록 설계한 광고 상품이에요.
                    </p>
                </section>

                <section className="business-plan-grid">
                    <div className="business-plan-card">
                        <span className="business-plan-label">Basic</span>

                        <h2>로컬 노출형</h2>

                        <p className="business-price">
                            19,000원 <span>/ 7일</span>
                        </p>

                        <ul>
                            <li>탐색 페이지 추천 노출</li>
                            <li>지역/카테고리 태그 연결</li>
                            <li>기본 통계 제공</li>
                        </ul>

                        <button onClick={() => requestAd("로컬 노출형")}>
                            신청하기
                        </button>
                    </div>

                    <div className="business-plan-card recommend">
                        <span className="business-plan-label">Recommend</span>

                        <h2>피드 부스트형</h2>

                        <p className="business-price">
                            39,000원 <span>/ 14일</span>
                        </p>

                        <ul>
                            <li>홈 피드 추천 영역 노출</li>
                            <li>여행 루트와 장소 연결</li>
                            <li>클릭/저장 통계 제공</li>
                        </ul>

                        <button onClick={() => requestAd("피드 부스트형")}>
                            추천 상품 신청
                        </button>
                    </div>

                    <div className="business-plan-card">
                        <span className="business-plan-label">Premium</span>

                        <h2>브랜드 집중형</h2>

                        <p className="business-price">
                            79,000원 <span>/ 30일</span>
                        </p>

                        <ul>
                            <li>메인 추천 배너 노출</li>
                            <li>브랜드 소개 카드 제공</li>
                            <li>상세 리포트 제공</li>
                        </ul>

                        <button onClick={() => requestAd("브랜드 집중형")}>
                            프리미엄 신청
                        </button>
                    </div>
                </section>

                <section className="business-info-section">
                    <div className="business-info-card">
                        <h2>사업자 홍보 흐름</h2>

                        <p>
                            사업자가 광고 상품을 선택하면, 관리자 승인 후 여행자 홈 피드와 탐색 페이지에
                            로컬 장소가 노출되는 구조로 확장할 수 있습니다. 지금 화면은 발표용 MVP로,
                            다음 단계에서 결제 API와 광고 신청 DB를 연결하면 됩니다.
                        </p>

                        <div className="business-stat-row">
                            <div className="business-stat">
                                <strong>3</strong>
                                <span>광고 상품</span>
                            </div>

                            <div className="business-stat">
                                <strong>7~30</strong>
                                <span>노출 기간</span>
                            </div>

                            <div className="business-stat">
                                <strong>Local</strong>
                                <span>타깃 홍보</span>
                            </div>
                        </div>
                    </div>

                    
                </section>
            </div>
        </div>
    );
}

export default BusinessBoost;
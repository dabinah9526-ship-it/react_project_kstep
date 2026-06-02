import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateFeed.css";

function CreateFeed() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [title, setTitle] = useState("");
    const [area, setArea] = useState("서울");
    const [category, setCategory] = useState("관광");
    const [routeSummary, setRouteSummary] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [content, setContent] = useState("");

    const [imageFileList, setImageFileList] = useState([]);
    const [imagePreviewList, setImagePreviewList] = useState([]);

    const [spotList, setSpotList] = useState([
        {
            spotName: "",
            spotMemo: "",
            address: "",
            lat: "",
            lng: ""
        }
    ]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
        }
    }, [navigate]);

    function openImageFile() {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    function changeFeedImages(e) {
        const files = Array.from(e.target.files || []);

        if (files.length === 0) {
            return;
        }

        let newFileList = [...imageFileList];
        let newPreviewList = [...imagePreviewList];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (!file.type.startsWith("image/")) {
                alert("이미지 파일만 첨부할 수 있습니다.");
                continue;
            }

            if (newFileList.length >= 10) {
                alert("이미지는 최대 10장까지 첨부할 수 있습니다.");
                break;
            }

            newFileList.push(file);
            newPreviewList.push(URL.createObjectURL(file));
        }

        setImageFileList(newFileList);
        setImagePreviewList(newPreviewList);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function removeFeedImage(index) {
        const newFileList = imageFileList.filter((item, idx) => idx !== index);
        const newPreviewList = imagePreviewList.filter((item, idx) => idx !== index);

        setImageFileList(newFileList);
        setImagePreviewList(newPreviewList);
    }

    function changeSpot(index, name, value) {
        const newList = [...spotList];

        newList[index] = {
            ...newList[index],
            [name]: value
        };

        setSpotList(newList);
    }

    function addSpot() {
        setSpotList([
            ...spotList,
            {
                spotName: "",
                spotMemo: "",
                address: "",
                lat: "",
                lng: ""
            }
        ]);
    }

    function removeSpot(index) {
        if (spotList.length === 1) {
            setSpotList([
                {
                    spotName: "",
                    spotMemo: "",
                    address: "",
                    lat: "",
                    lng: ""
                }
            ]);

            return;
        }

        const newList = spotList.filter((item, idx) => idx !== index);
        setSpotList(newList);
    }

    function makeRouteSummaryFromSpots() {
        let routeNameList = [];

        for (let i = 0; i < spotList.length; i++) {
            if (spotList[i].spotName.trim() !== "") {
                routeNameList.push(spotList[i].spotName.trim());
            }
        }

        if (routeNameList.length === 0) {
            alert("장소명을 먼저 입력해주세요.");
            return;
        }

        setRouteSummary(routeNameList.join(" → "));
    }

    function getCleanSpotList() {
        let cleanList = [];

        for (let i = 0; i < spotList.length; i++) {
            const spot = spotList[i];

            const hasInput =
                spot.spotName.trim() !== "" ||
                spot.spotMemo.trim() !== "" ||
                spot.address.trim() !== "" ||
                spot.lat.trim() !== "" ||
                spot.lng.trim() !== "";

            if (hasInput) {
                cleanList.push({
                    spotName: spot.spotName.trim(),
                    spotMemo: spot.spotMemo.trim(),
                    address: spot.address.trim(),
                    lat: spot.lat.trim(),
                    lng: spot.lng.trim()
                });
            }
        }

        return cleanList;
    }

    function checkSpotList(cleanSpotList) {
        for (let i = 0; i < cleanSpotList.length; i++) {
            const spot = cleanSpotList[i];

            if (spot.spotName === "") {
                alert((i + 1) + "번째 장소명을 입력해주세요.");
                return false;
            }

            if ((spot.lat !== "" && spot.lng === "") || (spot.lat === "" && spot.lng !== "")) {
                alert((i + 1) + "번째 장소의 위도와 경도는 둘 다 입력하거나 둘 다 비워주세요.");
                return false;
            }

            if (spot.lat !== "" && isNaN(Number(spot.lat))) {
                alert((i + 1) + "번째 장소의 위도는 숫자로 입력해주세요.");
                return false;
            }

            if (spot.lng !== "" && isNaN(Number(spot.lng))) {
                alert((i + 1) + "번째 장소의 경도는 숫자로 입력해주세요.");
                return false;
            }
        }

        return true;
    }

    function saveFeed() {
        if (title.trim() === "") {
            alert("제목을 입력해주세요.");
            return;
        }

        if (imageFileList.length === 0) {
            alert("피드 이미지를 1장 이상 첨부해주세요.");
            return;
        }

        if (routeSummary.trim() === "") {
            alert("여행 루트를 입력해주세요.");
            return;
        }

        if (content.trim() === "") {
            alert("여행 이야기를 입력해주세요.");
            return;
        }

        const cleanSpotList = getCleanSpotList();

        if (!checkSpotList(cleanSpotList)) {
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        const formData = new FormData();

        formData.append("title", title.trim());
        formData.append("area", area);
        formData.append("category", category);
        formData.append("routeSummary", routeSummary.trim());
        formData.append("hashtags", hashtags.trim());
        formData.append("content", content.trim());
        formData.append("spotList", JSON.stringify(cleanSpotList));

        for (let i = 0; i < imageFileList.length; i++) {
            formData.append("feedImages", imageFileList[i]);
        }

        fetch("http://localhost:3010/feed/add", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                console.log("피드 등록 결과", data);

                if (data.result === "success") {
                    alert("피드가 등록되었습니다.");

                    if (data.feedNo) {
                        sessionStorage.setItem("selectedFeedNo", data.feedNo);

                        navigate("/feed/detail", {
                            state: {
                                feedNo: data.feedNo
                            }
                        });
                    } else {
                        navigate("/home");
                    }
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("서버 연결 중 오류가 발생했습니다.");
            });
    }

    function getPreviewRoute() {
        if (routeSummary.trim() !== "") {
            return routeSummary;
        }

        let routeNameList = [];

        for (let i = 0; i < spotList.length; i++) {
            if (spotList[i].spotName.trim() !== "") {
                routeNameList.push(spotList[i].spotName.trim());
            }
        }

        if (routeNameList.length > 0) {
            return routeNameList.join(" → ");
        }

        return "여행 루트가 여기에 표시돼요";
    }

    return (
        <div className="create-page">
            <div className="create-cloud create-cloud-one"></div>
            <div className="create-cloud create-cloud-two"></div>

            <div className="create-motif create-motif-one"></div>
            <div className="create-motif create-motif-two"></div>

            <div className="create-flower create-flower-one">✿</div>
            <div className="create-flower create-flower-two">❀</div>

            <div className="create-container">
                <div className="create-header">
                    <button className="create-back-btn" onClick={() => navigate("/home")}>
                        ← 피드로 돌아가기
                    </button>

                    <div className="create-title-box">
                        <p className="create-badge">Korea Route Diary</p>
                        <h1>나만의 한국 여행 루트 작성하기</h1>
                        <p>
                            맛집, 카페, 쇼핑, 관광, 야경, 자연까지<br />
                            오늘의 예쁜 순간을 하나의 여행 루트로 기록해보세요.
                        </p>
                    </div>
                </div>

                <div className="create-layout">
                    <section className="create-form-card">
                        <div className="traditional-band create-band">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>

                        <div className="create-section-title">
                            <span>✦</span>
                            <div>
                                <h2>여행 피드 작성</h2>
                                <p>사진 여러 장과 루트를 함께 기록해주세요.</p>
                            </div>
                        </div>

                        <div className="create-form">
                            <div className="create-input-box">
                                <label>피드 이미지</label>

                                <div className="create-multi-image-box">
                                    {imagePreviewList.length === 0 ? (
                                        <div
                                            className="create-image-placeholder"
                                            onClick={openImageFile}
                                            role="button"
                                            tabIndex={0}
                                        >
                                         

                                            <p>
                                                최대 10장까지 첨부할 수 있어요.
                                                첫 번째 이미지가 대표 이미지가 됩니다.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="create-image-preview-grid">
                                            {imagePreviewList.map((preview, index) => (
                                                <div className="create-image-preview-item" key={index}>
                                                    <img src={preview} alt={"첨부 이미지 " + (index + 1)} />

                                                    {index === 0 && (
                                                        <span className="create-main-image-badge">
                                                            대표
                                                        </span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="create-image-delete-btn"
                                                        onClick={() => removeFeedImage(index)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}

                                            {imagePreviewList.length < 10 && (
                                                <button
                                                    type="button"
                                                    className="create-image-add-tile"
                                                    onClick={openImageFile}
                                                >
                                                    <span>＋</span>
                                                    <p>추가</p>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <span className="create-image-count">
                                        {imagePreviewList.length}/10
                                    </span>

                                    <input
                                        ref={fileInputRef}
                                        id="feedImageFiles"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={changeFeedImages}
                                        className="create-file-input"
                                    />
                                </div>
                            </div>

                            <div className="create-input-box">
                                <label>피드 제목</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="예: 북촌 한옥 골목 산책 루트"
                                />
                            </div>

                            <div className="create-two-column">
                                <div className="create-input-box">
                                    <label>지역</label>
                                    <select value={area} onChange={(e) => setArea(e.target.value)}>
                                        <option value="서울">서울</option>
                                        <option value="부산">부산</option>
                                        <option value="전주">전주</option>
                                        <option value="경주">경주</option>
                                        <option value="제주">제주</option>
                                        <option value="강릉">강릉</option>
                                        <option value="여수">여수</option>
                                        <option value="속초">속초</option>
                                        <option value="안동">안동</option>
                                        <option value="포항">포항</option>
                                        <option value="대구">대구</option>
                                        <option value="기타">기타</option>
                                    </select>
                                </div>

                                <div className="create-input-box">
                                    <label>카테고리</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option value="맛집">맛집</option>
                                        <option value="카페">카페</option>
                                        <option value="쇼핑">쇼핑</option>
                                        <option value="관광">관광</option>
                                        <option value="야경">야경</option>
                                        <option value="자연">자연</option>
                                    </select>
                                </div>
                            </div>

                            <div className="create-input-box">
                                <label>여행 루트</label>

                                <div className="create-route-summary-row">
                                    <input
                                        value={routeSummary}
                                        onChange={(e) => setRouteSummary(e.target.value)}
                                        placeholder="예: 안국역 → 북촌한옥마을 → 작은 찻집 → 삼청동"
                                    />

                                    <button
                                        type="button"
                                        className="create-small-btn"
                                        onClick={makeRouteSummaryFromSpots}
                                    >
                                        장소명으로 채우기
                                    </button>
                                </div>
                            </div>

                            <div className="create-input-box">
                                <label>지도 루트 장소</label>

                                <div className="create-spot-list">
                                    {spotList.map((spot, index) => (
                                        <div className="create-spot-card" key={index}>
                                            <div className="create-spot-card-head">
                                                <strong>{index + 1}번째 장소</strong>

                                                <button
                                                    type="button"
                                                    className="create-spot-delete-btn"
                                                    onClick={() => removeSpot(index)}
                                                >
                                                    삭제
                                                </button>
                                            </div>

                                            <div className="create-input-box">
                                                <label>장소명</label>
                                                <input
                                                    value={spot.spotName}
                                                    onChange={(e) => changeSpot(index, "spotName", e.target.value)}
                                                    placeholder="예: 북촌한옥마을"
                                                />
                                            </div>

                                            <div className="create-input-box">
                                                <label>장소 메모</label>
                                                <input
                                                    value={spot.spotMemo}
                                                    onChange={(e) => changeSpot(index, "spotMemo", e.target.value)}
                                                    placeholder="예: 사진 찍기 좋은 한옥 골목"
                                                />
                                            </div>

                                            <div className="create-input-box">
                                                <label>주소</label>
                                                <input
                                                    value={spot.address}
                                                    onChange={(e) => changeSpot(index, "address", e.target.value)}
                                                    placeholder="예: 서울 종로구 계동길 37"
                                                />
                                            </div>

                                            <div className="create-two-column">
                                                <div className="create-input-box">
                                                    <label>위도</label>
                                                    <input
                                                        value={spot.lat}
                                                        onChange={(e) => changeSpot(index, "lat", e.target.value)}
                                                        placeholder="예: 37.582604"
                                                    />
                                                </div>

                                                <div className="create-input-box">
                                                    <label>경도</label>
                                                    <input
                                                        value={spot.lng}
                                                        onChange={(e) => changeSpot(index, "lng", e.target.value)}
                                                        placeholder="예: 126.983998"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className="create-add-spot-btn"
                                    onClick={addSpot}
                                >
                                    + 장소 추가
                                </button>
                            </div>

                            <div className="create-input-box">
                                <label>해시태그</label>
                                <input
                                    value={hashtags}
                                    onChange={(e) => setHashtags(e.target.value)}
                                    placeholder="예: #북촌 #한옥 #관광 #감성산책"
                                />
                            </div>

                            <div className="create-input-box">
                                <label>여행 이야기</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="이 루트의 분위기, 추천 시간대, 사진 찍기 좋은 장소를 적어주세요."
                                />
                            </div>

                            <button className="create-submit-btn" onClick={saveFeed}>
                                여행 루트 피드 올리기
                            </button>
                        </div>
                    </section>

                    <aside className="create-preview-card">
                        <div className="preview-top">
                            <p>Preview</p>
                            <span>{area}</span>
                        </div>

                        <div className="preview-image">
                            {imagePreviewList.length > 0 && (
                                <img
                                    src={imagePreviewList[0]}
                                    alt="대표 이미지 미리보기"
                                    className="preview-main-img"
                                />
                            )}

                            <div className="preview-image-label">
                                {category}
                            </div>

                            {imagePreviewList.length === 0 && (
                                <div className="preview-flower">✿</div>
                            )}
                        </div>

                        {imagePreviewList.length > 1 && (
                            <div className="preview-thumb-row">
                                {imagePreviewList.slice(0, 5).map((preview, index) => (
                                    <div className="preview-thumb" key={index}>
                                        <img src={preview} alt={"미리보기 썸네일 " + (index + 1)} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="preview-body">
                            <div className="preview-user">
                                <div className="preview-avatar">
                                    {(localStorage.getItem("nickname") || "K").substring(0, 1).toUpperCase()}
                                </div>

                                <div>
                                    <strong>{localStorage.getItem("nickname") || "traveler01"}</strong>
                                    <p>K-STEP Route Creator</p>
                                </div>
                            </div>

                            <h3>{title || "피드 제목이 여기에 보여요"}</h3>

                            <p className="preview-route">
                                {getPreviewRoute()}
                            </p>

                            <p className="preview-content">
                                {content || "여행 이야기를 작성하면 미리보기 카드에 반영돼요."}
                            </p>

                            <div className="preview-tags">
                                {hashtags
                                    ? hashtags.split(" ").map((tag, index) => (
                                        <span key={index}>{tag}</span>
                                    ))
                                    : (
                                        <>
                                            <span>#한국여행</span>
                                            <span>#로컬루트</span>
                                            <span>#{category}</span>
                                        </>
                                    )
                                }
                            </div>

                            <div className="preview-bottom">
                                <span>♡ 0</span>
                                <span>💬 0</span>
                                <span>🔖 저장</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default CreateFeed;
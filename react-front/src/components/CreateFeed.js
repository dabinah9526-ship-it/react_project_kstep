import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageDecor from "./PageDecor";
import ScrollTopButton from "./ScrollTopButton";
import { getLang, t } from "../utils/language";
import "./CreateFeed.css";

function CreateFeed() {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const isEditMode = location.state?.mode === "edit";
    const editFeedNo = location.state?.feedNo || sessionStorage.getItem("editFeedNo") || "";

    const LIMIT = {
        title: 40,
        routeSummary: 120,
        hashtags: 100,
        content: 1000,
        spotName: 30,
        spotMemo: 80,
        address: 120,
        lat: 20,
        lng: 20
    };

    const [language, setLanguage] = useState(getLang());

    const [title, setTitle] = useState("");
    const [area, setArea] = useState("서울");
    const [category, setCategory] = useState("관광");
    const [routeSummary, setRouteSummary] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [content, setContent] = useState("");

    const [imageItemList, setImageItemList] = useState([]);

    const [spotList, setSpotList] = useState([
        {
            spotName: "",
            spotMemo: "",
            address: "",
            lat: "",
            lng: ""
        }
    ]);

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
        const token = localStorage.getItem("token");

        if (!token) {
            alert(t("loginRequired"));
            navigate("/");
            return;
        }

        if (isEditMode) {
            if (!editFeedNo) {
                alert(getPageText("noEditFeedNo"));
                navigate("/home");
                return;
            }

            sessionStorage.setItem("editFeedNo", editFeedNo);
            loadEditFeed(editFeedNo);
        }
    }, []);

    function getPageText(key) {
        const ko = {
            noEditFeedNo: "수정할 피드 번호가 없습니다.",
            editLoadFail: "수정할 피드를 불러오지 못했습니다.",
            editLoadError: "수정할 피드 조회 중 오류가 발생했습니다.",
            imageOnly: "이미지 파일만 첨부할 수 있습니다.",
            imageLimit: "이미지는 최대 10장까지 첨부할 수 있습니다.",
            spotNameFirst: "장소명을 먼저 입력해주세요.",
            routeAutoTooLong: "자동 생성된 여행 루트가 너무 길어서 ",
            routeAutoCut: "자까지만 입력됩니다.",
            maxLengthText: "은(는) 최대 ",
            maxLengthTextEnd: "자까지 입력할 수 있습니다.",
            spotNameRequiredFront: "번째 장소명을 입력해주세요.",
            latLngTogetherFront: "번째 장소의 위도와 경도는 둘 다 입력하거나 둘 다 비워주세요.",
            latNumberFront: "번째 장소의 위도는 숫자로 입력해주세요.",
            lngNumberFront: "번째 장소의 경도는 숫자로 입력해주세요.",
            titleRequired: "제목을 입력해주세요.",
            titleLabel: "피드 제목",
            imageRequired: "피드 이미지를 1장 이상 첨부해주세요.",
            routeRequired: "여행 루트를 입력해주세요.",
            routeLabel: "여행 루트",
            hashtagLabel: "해시태그",
            contentRequired: "여행 이야기를 입력해주세요.",
            contentLabel: "여행 이야기",
            feedEditDone: "피드가 수정되었습니다.",
            feedAddDone: "피드가 등록되었습니다.",
            processError: "처리 중 오류가 발생했습니다.",
            serverError: "서버 연결 중 오류가 발생했습니다.",
            previewRouteEmpty: "여행 루트가 여기에 표시돼요",
            loadingTitle: "피드 수정",
            loadingSub: "기존 피드를 불러오는 중입니다.",
            editTitle: "여행 루트 수정",
            addTitle: "여행 루트 작성",
            editSub: "기존 여행 코스를 수정하고 다시 저장해요.",
            addSub: "사진 여러 장과 장소를 연결해 나만의 한국 여행 코스를 기록해요.",
            homeTitle: "홈으로",
            editSaveTitle: "수정 저장",
            uploadTitle: "올리기",
            formEditTitle: "여행 피드 수정",
            formAddTitle: "여행 피드 작성",
            formSub: "사진 여러 장과 루트를 함께 기록해주세요.",
            feedImage: "피드 이미지",
            imageGuide1: "최대 10장까지 첨부할 수 있어요.",
            imageGuide2: "첫 번째 이미지가 대표 이미지가 됩니다.",
            attachedImageAlt: "첨부 이미지 ",
            mainImage: "대표",
            addImage: "추가",
            titlePlaceholder: "예: 북촌 한옥 골목 산책 루트",
            area: "지역",
            category: "카테고리",
            routeSummary: "여행 루트",
            routePlaceholder: "예: 안국역 → 북촌한옥마을 → 작은 찻집 → 삼청동",
            fillBySpot: "장소명으로 채우기",
            mapRouteSpot: "지도 루트 장소",
            spotOrderSuffix: "번째 장소",
            delete: "삭제",
            spotName: "장소명",
            spotNamePlaceholder: "예: 북촌한옥마을",
            spotMemo: "장소 메모",
            spotMemoPlaceholder: "예: 사진 찍기 좋은 한옥 골목",
            address: "주소",
            addressPlaceholder: "예: 서울 종로구 계동길 37",
            lat: "위도",
            latPlaceholder: "예: 37.582604",
            lng: "경도",
            lngPlaceholder: "예: 126.983998",
            addSpot: "+ 장소 추가",
            hashtagPlaceholder: "예: #북촌 #한옥 #관광 #감성산책",
            storyPlaceholder: "이 루트의 분위기, 추천 시간대, 사진 찍기 좋은 장소를 적어주세요.",
            submitEdit: "여행 루트 피드 수정하기",
            submitAdd: "여행 루트 피드 올리기",
            previewImageAlt: "대표 이미지 미리보기",
            previewThumbAlt: "미리보기 썸네일 ",
            routeCreator: "K-STEP Route Creator",
            previewTitleEmpty: "피드 제목이 여기에 보여요",
            previewContentEmpty: "여행 이야기를 작성하면 미리보기 카드에 반영돼요.",
            previewTag1: "#한국여행",
            previewTag2: "#로컬루트",
            save: "저장",
            areaSeoul: "서울",
            areaBusan: "부산",
            areaJeonju: "전주",
            areaGyeongju: "경주",
            areaJeju: "제주",
            areaGangneung: "강릉",
            areaYeosu: "여수",
            areaSokcho: "속초",
            areaAndong: "안동",
            areaPohang: "포항",
            areaDaegu: "대구",
            areaEtc: "기타",
            food: "맛집",
            cafe: "카페",
            shopping: "쇼핑",
            tour: "관광",
            nightView: "야경",
            nature: "자연"
        };

        const en = {
            noEditFeedNo: "Feed number for editing is missing.",
            editLoadFail: "Failed to load the feed for editing.",
            editLoadError: "An error occurred while loading the feed for editing.",
            imageOnly: "Only image files can be attached.",
            imageLimit: "You can attach up to 10 images.",
            spotNameFirst: "Please enter place names first.",
            routeAutoTooLong: "The auto-generated route is too long, so only ",
            routeAutoCut: " characters will be entered.",
            maxLengthText: " can be up to ",
            maxLengthTextEnd: " characters.",
            spotNameRequiredFront: " place name is required.",
            latLngTogetherFront: " place latitude and longitude must both be filled or both be empty.",
            latNumberFront: " place latitude must be a number.",
            lngNumberFront: " place longitude must be a number.",
            titleRequired: "Please enter a title.",
            titleLabel: "Feed title",
            imageRequired: "Please attach at least one feed image.",
            routeRequired: "Please enter a travel route.",
            routeLabel: "Travel route",
            hashtagLabel: "Hashtags",
            contentRequired: "Please write a travel story.",
            contentLabel: "Travel story",
            feedEditDone: "The feed has been updated.",
            feedAddDone: "The feed has been posted.",
            processError: "An error occurred while processing.",
            serverError: "An error occurred while connecting to the server.",
            previewRouteEmpty: "Your travel route will appear here.",
            loadingTitle: "Edit Feed",
            loadingSub: "Loading the existing feed.",
            editTitle: "Edit Travel Route",
            addTitle: "Create Travel Route",
            editSub: "Update your existing travel course and save it again.",
            addSub: "Record your Korea travel course with multiple photos and connected places.",
            homeTitle: "Home",
            editSaveTitle: "Save Changes",
            uploadTitle: "Post",
            formEditTitle: "Edit Travel Feed",
            formAddTitle: "Create Travel Feed",
            formSub: "Please record your route with multiple photos.",
            feedImage: "Feed Images",
            imageGuide1: "You can attach up to 10 images.",
            imageGuide2: "The first image becomes the main image.",
            attachedImageAlt: "Attached image ",
            mainImage: "Main",
            addImage: "Add",
            titlePlaceholder: "Example: Bukchon Hanok Alley Walking Route",
            area: "Area",
            category: "Category",
            routeSummary: "Travel Route",
            routePlaceholder: "Example: Anguk Station → Bukchon Hanok Village → Tea House → Samcheong-dong",
            fillBySpot: "Fill by place names",
            mapRouteSpot: "Map Route Places",
            spotOrderSuffix: " Place",
            delete: "Delete",
            spotName: "Place Name",
            spotNamePlaceholder: "Example: Bukchon Hanok Village",
            spotMemo: "Place Memo",
            spotMemoPlaceholder: "Example: A hanok alley good for photos",
            address: "Address",
            addressPlaceholder: "Example: 37 Gyedong-gil, Jongno-gu, Seoul",
            lat: "Latitude",
            latPlaceholder: "Example: 37.582604",
            lng: "Longitude",
            lngPlaceholder: "Example: 126.983998",
            addSpot: "+ Add Place",
            hashtagPlaceholder: "Example: #Bukchon #Hanok #Travel #Walking",
            storyPlaceholder: "Write about the mood, best time to visit, and photo spots.",
            submitEdit: "Update Travel Route Feed",
            submitAdd: "Post Travel Route Feed",
            previewImageAlt: "Main image preview",
            previewThumbAlt: "Preview thumbnail ",
            routeCreator: "K-STEP Route Creator",
            previewTitleEmpty: "Your feed title will appear here",
            previewContentEmpty: "Your travel story will appear in the preview card.",
            previewTag1: "#KoreaTravel",
            previewTag2: "#LocalRoute",
            save: "Save",
            areaSeoul: "Seoul",
            areaBusan: "Busan",
            areaJeonju: "Jeonju",
            areaGyeongju: "Gyeongju",
            areaJeju: "Jeju",
            areaGangneung: "Gangneung",
            areaYeosu: "Yeosu",
            areaSokcho: "Sokcho",
            areaAndong: "Andong",
            areaPohang: "Pohang",
            areaDaegu: "Daegu",
            areaEtc: "Other",
            food: "Food",
            cafe: "Cafe",
            shopping: "Shopping",
            tour: "Tour",
            nightView: "Night View",
            nature: "Nature"
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

    function getToken() {
        return localStorage.getItem("token");
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

    function getCountClass(value, maxLength) {
        if (value.length >= maxLength) {
            return "create-inside-count is-limit";
        }

        return "create-inside-count";
    }

    function openImageFile() {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    function resizeImageFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = function (event) {
                const img = new Image();

                img.onload = function () {
                    const maxSize = 1400;

                    let width = img.width;
                    let height = img.height;

                    if (width > maxSize || height > maxSize) {
                        if (width >= height) {
                            const ratio = maxSize / width;
                            width = maxSize;
                            height = Math.round(height * ratio);
                        } else {
                            const ratio = maxSize / height;
                            height = maxSize;
                            width = Math.round(width * ratio);
                        }
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");

                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        function (blob) {
                            if (!blob) {
                                resolve(file);
                                return;
                            }

                            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

                            const resizedFile = new File(
                                [blob],
                                fileNameWithoutExt + ".jpg",
                                {
                                    type: "image/jpeg",
                                    lastModified: Date.now()
                                }
                            );

                            resolve(resizedFile);
                        },
                        "image/jpeg",
                        0.82
                    );
                };

                img.onerror = function () {
                    resolve(file);
                };

                img.src = event.target.result;
            };

            reader.onerror = function () {
                resolve(file);
            };

            reader.readAsDataURL(file);
        });
    }

    function loadEditFeed(feedNo) {
        const token = getToken();

        setLoading(true);

        fetch("http://localhost:3010/feed/detail", {
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
                console.log("수정 피드 상세 조회", data);

                if (data.result === "success" && data.feed) {
                    const feed = data.feed;

                    setTitle(feed.TITLE || "");
                    setArea(feed.AREA || "서울");
                    setCategory(feed.CATEGORY || "관광");
                    setRouteSummary(feed.ROUTE_SUMMARY || "");
                    setHashtags(feed.HASHTAGS || "");
                    setContent(feed.CONTENT || "");
                } else {
                    alert(data.message || getPageText("editLoadFail"));
                    navigate("/home");
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("editLoadError"));
                navigate("/home");
            });

        fetch("http://localhost:3010/feed/image/list", {
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
                console.log("수정 피드 이미지 조회", data);

                if (data.result === "success") {
                    const list = data.list || [];

                    const oldImageList = list.map((image, index) => {
                        const imageUrl = image.IMG_URL || image.IMAGE_URL || "";

                        return {
                            type: "old",
                            imageNo: image.IMG_NO || image.IMAGE_NO || index,
                            originalUrl: imageUrl,
                            previewUrl: getImageUrl(imageUrl)
                        };
                    });

                    setImageItemList(oldImageList);
                }
            })
            .catch(err => {
                console.error(err);
            });

        fetch("http://localhost:3010/feed/route/spot/list", {
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
                console.log("수정 피드 장소 조회", data);

                if (data.result === "success" && data.list && data.list.length > 0) {
                    const newSpotList = data.list.map(spot => {
                        return {
                            spotName: spot.SPOT_NAME || "",
                            spotMemo: spot.SPOT_MEMO || "",
                            address: spot.ADDRESS || "",
                            lat: spot.LAT === null || spot.LAT === undefined ? "" : String(spot.LAT),
                            lng: spot.LNG === null || spot.LNG === undefined ? "" : String(spot.LNG)
                        };
                    });

                    setSpotList(newSpotList);
                } else {
                    setSpotList([
                        {
                            spotName: "",
                            spotMemo: "",
                            address: "",
                            lat: "",
                            lng: ""
                        }
                    ]);
                }
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }

    async function changeFeedImages(e) {
        const files = Array.from(e.target.files || []);

        if (files.length === 0) {
            return;
        }

        let newItemList = [...imageItemList];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (!file.type.startsWith("image/")) {
                alert(getPageText("imageOnly"));
                continue;
            }

            if (newItemList.length >= 10) {
                alert(getPageText("imageLimit"));
                break;
            }

            const resizedFile = await resizeImageFile(file);

            newItemList.push({
                type: "new",
                file: resizedFile,
                previewUrl: URL.createObjectURL(resizedFile)
            });
        }

        setImageItemList(newItemList);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function removeFeedImage(index) {
        const target = imageItemList[index];

        if (target && target.type === "new" && target.previewUrl) {
            URL.revokeObjectURL(target.previewUrl);
        }

        const newItemList = imageItemList.filter((item, idx) => idx !== index);
        setImageItemList(newItemList);
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
            alert(getPageText("spotNameFirst"));
            return;
        }

        const madeRouteSummary = routeNameList.join(" → ");

        if (madeRouteSummary.length > LIMIT.routeSummary) {
            alert(getPageText("routeAutoTooLong") + LIMIT.routeSummary + getPageText("routeAutoCut"));
            setRouteSummary(madeRouteSummary.substring(0, LIMIT.routeSummary));
            return;
        }

        setRouteSummary(madeRouteSummary);
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

    function checkTextLength(value, maxLength, labelName) {
        if (value.trim().length > maxLength) {
            if (language === "en") {
                alert(labelName + getPageText("maxLengthText") + maxLength + getPageText("maxLengthTextEnd"));
            } else {
                alert(labelName + getPageText("maxLengthText") + maxLength + getPageText("maxLengthTextEnd"));
            }

            return false;
        }

        return true;
    }

    function getSpotOrderText(index) {
        if (language === "en") {
            return (index + 1) + getPageText("spotOrderSuffix");
        }

        return (index + 1) + getPageText("spotOrderSuffix");
    }

    function checkSpotList(cleanSpotList) {
        for (let i = 0; i < cleanSpotList.length; i++) {
            const spot = cleanSpotList[i];
            const spotOrderText = getSpotOrderText(i);

            if (spot.spotName === "") {
                if (language === "en") {
                    alert(spotOrderText + getPageText("spotNameRequiredFront"));
                } else {
                    alert((i + 1) + getPageText("spotNameRequiredFront"));
                }

                return false;
            }

            if (!checkTextLength(spot.spotName, LIMIT.spotName, spotOrderText + " " + getPageText("spotName"))) {
                return false;
            }

            if (!checkTextLength(spot.spotMemo, LIMIT.spotMemo, spotOrderText + " " + getPageText("spotMemo"))) {
                return false;
            }

            if (!checkTextLength(spot.address, LIMIT.address, spotOrderText + " " + getPageText("address"))) {
                return false;
            }

            if ((spot.lat !== "" && spot.lng === "") || (spot.lat === "" && spot.lng !== "")) {
                if (language === "en") {
                    alert(spotOrderText + getPageText("latLngTogetherFront"));
                } else {
                    alert((i + 1) + getPageText("latLngTogetherFront"));
                }

                return false;
            }

            if (spot.lat !== "" && isNaN(Number(spot.lat))) {
                if (language === "en") {
                    alert(spotOrderText + getPageText("latNumberFront"));
                } else {
                    alert((i + 1) + getPageText("latNumberFront"));
                }

                return false;
            }

            if (spot.lng !== "" && isNaN(Number(spot.lng))) {
                if (language === "en") {
                    alert(spotOrderText + getPageText("lngNumberFront"));
                } else {
                    alert((i + 1) + getPageText("lngNumberFront"));
                }

                return false;
            }
        }

        return true;
    }

    function saveFeed() {
        if (title.trim() === "") {
            alert(getPageText("titleRequired"));
            return;
        }

        if (!checkTextLength(title, LIMIT.title, getPageText("titleLabel"))) {
            return;
        }

        if (imageItemList.length === 0) {
            alert(getPageText("imageRequired"));
            return;
        }

        if (routeSummary.trim() === "") {
            alert(getPageText("routeRequired"));
            return;
        }

        if (!checkTextLength(routeSummary, LIMIT.routeSummary, getPageText("routeLabel"))) {
            return;
        }

        if (!checkTextLength(hashtags, LIMIT.hashtags, getPageText("hashtagLabel"))) {
            return;
        }

        if (content.trim() === "") {
            alert(getPageText("contentRequired"));
            return;
        }

        if (!checkTextLength(content, LIMIT.content, getPageText("contentLabel"))) {
            return;
        }

        const cleanSpotList = getCleanSpotList();

        if (!checkSpotList(cleanSpotList)) {
            return;
        }

        const token = getToken();

        if (!token) {
            alert(t("loginRequired"));
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

        const newImageList = imageItemList.filter(item => item.type === "new");
        const remainImageNoList = imageItemList
            .filter(item => item.type === "old")
            .map(item => item.imageNo);

        for (let i = 0; i < newImageList.length; i++) {
            formData.append("feedImages", newImageList[i].file);
        }

        let apiUrl = "http://localhost:3010/feed/add";

        if (isEditMode) {
            if (!editFeedNo) {
                alert(getPageText("noEditFeedNo"));
                return;
            }

            formData.append("feedNo", editFeedNo);
            formData.append("remainImageNoList", JSON.stringify(remainImageNoList));

            apiUrl = "http://localhost:3010/feed/update";
        }

        fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                console.log(isEditMode ? "피드 수정 결과" : "피드 등록 결과", data);

                if (data.result === "success") {
                    alert(isEditMode ? getPageText("feedEditDone") : getPageText("feedAddDone"));

                    const savedFeedNo = data.feedNo || editFeedNo;

                    if (savedFeedNo) {
                        sessionStorage.setItem("selectedFeedNo", savedFeedNo);

                        navigate("/feed/detail", {
                            state: {
                                feedNo: savedFeedNo
                            }
                        });
                    } else {
                        navigate("/home");
                    }
                } else {
                    alert(data.message || getPageText("processError"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("serverError"));
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

        return getPageText("previewRouteEmpty");
    }

    if (loading) {
        return (
            <div className="create-page" data-lang={language}>
                <PageDecor />

                <div className="create-container">
                    <section className="create-header">
                        <PageDecor variant="box" />

                        <div className="create-brand-row">
                            <div className="create-brand-mark">K</div>

                            <div>
                                <h1>{getPageText("loadingTitle")}</h1>
                                <p>{getPageText("loadingSub")}</p>
                            </div>
                        </div>
                    </section>
                </div>

                <ScrollTopButton />
            </div>
        );
    }

    return (
        <div className="create-page" data-lang={language}>
            <PageDecor />

            <div className="create-container">
                <section className="create-header">
                    <PageDecor variant="box" />

                    <div className="create-brand-row">
                        <div className="create-brand-mark">K</div>

                        <div>
                            <h1>{isEditMode ? getPageText("editTitle") : getPageText("addTitle")}</h1>
                            <p>
                                {isEditMode
                                    ? getPageText("editSub")
                                    : getPageText("addSub")
                                }
                            </p>
                        </div>
                    </div>

                    <div className="create-top-icons">
                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                            title={getPageText("homeTitle")}
                        >
                            ⌂
                        </button>

                        <button
                            type="button"
                            className="write"
                            onClick={saveFeed}
                            title={isEditMode ? getPageText("editSaveTitle") : getPageText("uploadTitle")}
                        >
                            {isEditMode ? "✓" : "+"}
                        </button>
                    </div>
                </section>

                <div className="create-layout">
                    <section className="create-form-card">
                        <div className="create-section-title">
                            <span>✦</span>
                            <div>
                                <h2>{isEditMode ? getPageText("formEditTitle") : getPageText("formAddTitle")}</h2>
                                <p>{getPageText("formSub")}</p>
                            </div>
                        </div>

                        <div className="create-form">
                            <div className="create-input-box">
                                <label>{getPageText("feedImage")}</label>

                                <div className="create-multi-image-box">
                                    {imageItemList.length === 0 ? (
                                        <div
                                            className="create-image-placeholder"
                                            onClick={openImageFile}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <p>
                                                {getPageText("imageGuide1")}
                                                <br />
                                                {getPageText("imageGuide2")}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="create-image-preview-grid">
                                            {imageItemList.map((image, index) => (
                                                <div className="create-image-preview-item" key={index}>
                                                    <img src={image.previewUrl} alt={getPageText("attachedImageAlt") + (index + 1)} />

                                                    {index === 0 && (
                                                        <span className="create-main-image-badge">
                                                            {getPageText("mainImage")}
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

                                            {imageItemList.length < 10 && (
                                                <button
                                                    type="button"
                                                    className="create-image-add-tile"
                                                    onClick={openImageFile}
                                                >
                                                    <span>＋</span>
                                                    <p>{getPageText("addImage")}</p>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <span className="create-image-count">
                                        {imageItemList.length}/10
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
                                <label>{getPageText("titleLabel")}</label>

                                <div className="create-field-with-count">
                                    <input
                                        value={title}
                                        maxLength={LIMIT.title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={getPageText("titlePlaceholder")}
                                    />

                                    <span className={getCountClass(title, LIMIT.title)}>
                                        {title.length}/{LIMIT.title}
                                    </span>
                                </div>
                            </div>

                            <div className="create-two-column">
                                <div className="create-input-box">
                                    <label>{getPageText("area")}</label>

                                    <select value={area} onChange={(e) => setArea(e.target.value)}>
                                        <option value="서울">{getPageText("areaSeoul")}</option>
                                        <option value="부산">{getPageText("areaBusan")}</option>
                                        <option value="전주">{getPageText("areaJeonju")}</option>
                                        <option value="경주">{getPageText("areaGyeongju")}</option>
                                        <option value="제주">{getPageText("areaJeju")}</option>
                                        <option value="강릉">{getPageText("areaGangneung")}</option>
                                        <option value="여수">{getPageText("areaYeosu")}</option>
                                        <option value="속초">{getPageText("areaSokcho")}</option>
                                        <option value="안동">{getPageText("areaAndong")}</option>
                                        <option value="포항">{getPageText("areaPohang")}</option>
                                        <option value="대구">{getPageText("areaDaegu")}</option>
                                        <option value="기타">{getPageText("areaEtc")}</option>
                                    </select>
                                </div>

                                <div className="create-input-box">
                                    <label>{getPageText("category")}</label>

                                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option value="맛집">{getPageText("food")}</option>
                                        <option value="카페">{getPageText("cafe")}</option>
                                        <option value="쇼핑">{getPageText("shopping")}</option>
                                        <option value="관광">{getPageText("tour")}</option>
                                        <option value="야경">{getPageText("nightView")}</option>
                                        <option value="자연">{getPageText("nature")}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="create-input-box">
                                <label>{getPageText("routeSummary")}</label>

                                <div className="create-route-summary-row">
                                    <div className="create-field-with-count">
                                        <input
                                            value={routeSummary}
                                            maxLength={LIMIT.routeSummary}
                                            onChange={(e) => setRouteSummary(e.target.value)}
                                            placeholder={getPageText("routePlaceholder")}
                                        />

                                        <span className={getCountClass(routeSummary, LIMIT.routeSummary)}>
                                            {routeSummary.length}/{LIMIT.routeSummary}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="create-small-btn"
                                        onClick={makeRouteSummaryFromSpots}
                                    >
                                        {getPageText("fillBySpot")}
                                    </button>
                                </div>
                            </div>

                            <div className="create-input-box">
                                <label>{getPageText("mapRouteSpot")}</label>

                                <div className="create-spot-list">
                                    {spotList.map((spot, index) => (
                                        <div className="create-spot-card" key={index}>
                                            <div className="create-spot-card-head">
                                                <strong>{getSpotOrderText(index)}</strong>

                                                <button
                                                    type="button"
                                                    className="create-spot-delete-btn"
                                                    onClick={() => removeSpot(index)}
                                                >
                                                    {getPageText("delete")}
                                                </button>
                                            </div>

                                            <div className="create-input-box">
                                                <label>{getPageText("spotName")}</label>

                                                <div className="create-field-with-count">
                                                    <input
                                                        value={spot.spotName}
                                                        maxLength={LIMIT.spotName}
                                                        onChange={(e) => changeSpot(index, "spotName", e.target.value)}
                                                        placeholder={getPageText("spotNamePlaceholder")}
                                                    />

                                                    <span className={getCountClass(spot.spotName, LIMIT.spotName)}>
                                                        {spot.spotName.length}/{LIMIT.spotName}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="create-input-box">
                                                <label>{getPageText("spotMemo")}</label>

                                                <div className="create-field-with-count">
                                                    <input
                                                        value={spot.spotMemo}
                                                        maxLength={LIMIT.spotMemo}
                                                        onChange={(e) => changeSpot(index, "spotMemo", e.target.value)}
                                                        placeholder={getPageText("spotMemoPlaceholder")}
                                                    />

                                                    <span className={getCountClass(spot.spotMemo, LIMIT.spotMemo)}>
                                                        {spot.spotMemo.length}/{LIMIT.spotMemo}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="create-input-box">
                                                <label>{getPageText("address")}</label>

                                                <div className="create-field-with-count">
                                                    <input
                                                        value={spot.address}
                                                        maxLength={LIMIT.address}
                                                        onChange={(e) => changeSpot(index, "address", e.target.value)}
                                                        placeholder={getPageText("addressPlaceholder")}
                                                    />

                                                    <span className={getCountClass(spot.address, LIMIT.address)}>
                                                        {spot.address.length}/{LIMIT.address}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="create-two-column">
                                                <div className="create-input-box">
                                                    <label>{getPageText("lat")}</label>

                                                    <div className="create-field-with-count">
                                                        <input
                                                            value={spot.lat}
                                                            maxLength={LIMIT.lat}
                                                            onChange={(e) => changeSpot(index, "lat", e.target.value)}
                                                            placeholder={getPageText("latPlaceholder")}
                                                        />

                                                        <span className={getCountClass(spot.lat, LIMIT.lat)}>
                                                            {spot.lat.length}/{LIMIT.lat}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="create-input-box">
                                                    <label>{getPageText("lng")}</label>

                                                    <div className="create-field-with-count">
                                                        <input
                                                            value={spot.lng}
                                                            maxLength={LIMIT.lng}
                                                            onChange={(e) => changeSpot(index, "lng", e.target.value)}
                                                            placeholder={getPageText("lngPlaceholder")}
                                                        />

                                                        <span className={getCountClass(spot.lng, LIMIT.lng)}>
                                                            {spot.lng.length}/{LIMIT.lng}
                                                        </span>
                                                    </div>
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
                                    {getPageText("addSpot")}
                                </button>
                            </div>

                            <div className="create-input-box">
                                <label>{getPageText("hashtagLabel")}</label>

                                <div className="create-field-with-count">
                                    <input
                                        value={hashtags}
                                        maxLength={LIMIT.hashtags}
                                        onChange={(e) => setHashtags(e.target.value)}
                                        placeholder={getPageText("hashtagPlaceholder")}
                                    />

                                    <span className={getCountClass(hashtags, LIMIT.hashtags)}>
                                        {hashtags.length}/{LIMIT.hashtags}
                                    </span>
                                </div>
                            </div>

                            <div className="create-input-box">
                                <label>{getPageText("contentLabel")}</label>

                                <div className="create-field-with-count create-textarea-with-count">
                                    <textarea
                                        value={content}
                                        maxLength={LIMIT.content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder={getPageText("storyPlaceholder")}
                                    />

                                    <span className={getCountClass(content, LIMIT.content)}>
                                        {content.length}/{LIMIT.content}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="create-submit-btn"
                                onClick={saveFeed}
                            >
                                {isEditMode ? getPageText("submitEdit") : getPageText("submitAdd")}
                            </button>
                        </div>
                    </section>

                    <aside className="create-preview-card">
                        <div className="preview-top">
                            <p>Preview</p>
                            <span>{language === "en" ? getPageText("area" + area) : area}</span>
                        </div>

                        <div className="preview-image">
                            {imageItemList.length > 0 && (
                                <img
                                    src={imageItemList[0].previewUrl}
                                    alt={getPageText("previewImageAlt")}
                                    className="preview-main-img"
                                />
                            )}

                            <div className="preview-image-label">
                                {category}
                            </div>

                            {imageItemList.length === 0 && (
                                <div className="preview-flower">✿</div>
                            )}
                        </div>

                        {imageItemList.length > 1 && (
                            <div className="preview-thumb-row">
                                {imageItemList.slice(0, 5).map((image, index) => (
                                    <div className="preview-thumb" key={index}>
                                        <img src={image.previewUrl} alt={getPageText("previewThumbAlt") + (index + 1)} />
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
                                    <p>{getPageText("routeCreator")}</p>
                                </div>
                            </div>

                            <h3>{title || getPageText("previewTitleEmpty")}</h3>

                            <p className="preview-route">
                                {getPreviewRoute()}
                            </p>

                            <p className="preview-content">
                                {content || getPageText("previewContentEmpty")}
                            </p>

                            <div className="preview-tags">
                                {hashtags
                                    ? hashtags
                                        .split(" ")
                                        .filter(tag => tag.trim() !== "")
                                        .map((tag, index) => (
                                            <span key={index}>{tag}</span>
                                        ))
                                    : (
                                        <>
                                            <span>{getPageText("previewTag1")}</span>
                                            <span>{getPageText("previewTag2")}</span>
                                            <span>#{category}</span>
                                        </>
                                    )
                                }
                            </div>

                            <div className="preview-bottom">
                                <span>♡ 0</span>
                                <span>💬 0</span>
                                <span>🔖 {getPageText("save")}</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <ScrollTopButton />
        </div>
    );
}

export default CreateFeed;
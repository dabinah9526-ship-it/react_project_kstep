import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLang } from "../utils/language";
import "./Join.css";

function Join() {
    const navigate = useNavigate();

    const [language, setLanguage] = useState(getLang());

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [nickname, setNickname] = useState("");
    const [userType, setUserType] = useState("TRAVELER");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");

    const [idCheck, setIdCheck] = useState(false);
    const [passwordCheck, setPasswordCheck] = useState(false);
    const [nicknameCheck, setNicknameCheck] = useState(false);

    const [idCheckMessage, setIdCheckMessage] = useState("");
    const [passwordCheckMessage, setPasswordCheckMessage] = useState("");
    const [nicknameCheckMessage, setNicknameCheckMessage] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    useEffect(() => {
        function changeLanguage() {
            setLanguage(getLang());
        }

        window.addEventListener("kstepLanguageChange", changeLanguage);

        return () => {
            window.removeEventListener("kstepLanguageChange", changeLanguage);
        };
    }, []);

    function getPageText(key) {
        const ko = {
            idRequired: "아이디를 입력해주세요.",
            passwordFirst: "비밀번호를 먼저 입력해주세요.",
            passwordRule: "비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요.",
            passwordMatch: "비밀번호가 일치합니다.",
            passwordNotMatch: "비밀번호가 일치하지 않습니다.",
            idCheckError: "아이디 중복체크 중 오류가 발생했습니다.",
            nicknameRequired: "닉네임을 입력해주세요.",
            nicknameCheckError: "닉네임 중복체크 중 오류가 발생했습니다.",
            passwordRequired: "비밀번호를 입력해주세요.",
            passwordConfirmRequired: "비밀번호 확인을 입력해주세요.",
            idCheckRequired: "아이디 중복체크를 해주세요.",
            passwordRecheck: "비밀번호를 다시 확인해주세요.",
            nicknameCheckRequired: "닉네임 중복체크를 해주세요.",
            bioLimit: "자기소개는 500자 이하로 입력해주세요.",
            joinSuccess: "회원가입이 완료되었습니다.",
            serverError: "서버 연결 중 오류가 발생했습니다.",

            logoAlt: "K-STEP 로고",
            pageLabel: "회원가입",
            mainCopy1: "한국의 예쁜 순간을",
            mainCopy2: "나만의 루트로 담아봐요",
            subCopy1: "골목길, 시장, 카페, 바다, 한옥까지",
            subCopy2: "사진과 동선으로 공유하는 로컬 여행 공간",

            userId: "아이디",
            userIdPlaceholder: "아이디를 입력하세요",
            done: "완료",
            duplicateCheck: "중복확인",

            password: "비밀번호",
            passwordPlaceholder: "영문+숫자 포함 8~20자",
            hidePassword: "비밀번호 숨기기",
            showPassword: "비밀번호 보기",

            passwordConfirm: "비밀번호 확인",
            passwordConfirmPlaceholder: "비밀번호를 다시 입력하세요",
            hidePasswordConfirm: "비밀번호 확인 숨기기",
            showPasswordConfirm: "비밀번호 확인 보기",

            nickname: "닉네임",
            nicknamePlaceholder: "여행 피드에 보여질 닉네임",

            userType: "사용자 유형",
            traveler: "Traveler 여행자",
            local: "Local 로컬",
            guide: "Guide 가이드",
            business: "Business 사업자",

            email: "이메일",
            emailPlaceholder: "이메일을 입력하세요",

            bio: "간단 소개",
            bioPlaceholder: "예: 한옥 골목과 작은 찻집을 좋아해요.",

            joinButton: "나의 K-STEP 시작하기",
            hasAccount: "이미 계정이 있나요?",
            login: "로그인"
        };

        const en = {
            idRequired: "Please enter your ID.",
            passwordFirst: "Please enter your password first.",
            passwordRule: "Password must be 8-20 characters and include letters and numbers.",
            passwordMatch: "Passwords match.",
            passwordNotMatch: "Passwords do not match.",
            idCheckError: "An error occurred while checking ID duplication.",
            nicknameRequired: "Please enter your nickname.",
            nicknameCheckError: "An error occurred while checking nickname duplication.",
            passwordRequired: "Please enter your password.",
            passwordConfirmRequired: "Please confirm your password.",
            idCheckRequired: "Please check ID duplication.",
            passwordRecheck: "Please check your password again.",
            nicknameCheckRequired: "Please check nickname duplication.",
            bioLimit: "Bio can be up to 500 characters.",
            joinSuccess: "Sign up has been completed.",
            serverError: "An error occurred while connecting to the server.",

            logoAlt: "K-STEP logo",
            pageLabel: "Sign up",
            mainCopy1: "Capture beautiful Korea moments",
            mainCopy2: "as your own travel route",
            subCopy1: "From alleys, markets, cafes, seas, to hanok",
            subCopy2: "share local trips with photos and routes",

            userId: "ID",
            userIdPlaceholder: "Enter your ID",
            done: "Done",
            duplicateCheck: "Check",

            password: "Password",
            passwordPlaceholder: "8-20 characters with letters and numbers",
            hidePassword: "Hide password",
            showPassword: "Show password",

            passwordConfirm: "Confirm Password",
            passwordConfirmPlaceholder: "Enter your password again",
            hidePasswordConfirm: "Hide password confirmation",
            showPasswordConfirm: "Show password confirmation",

            nickname: "Nickname",
            nicknamePlaceholder: "Nickname shown on your travel feed",

            userType: "User Type",
            traveler: "Traveler",
            local: "Local",
            guide: "Guide",
            business: "Business",

            email: "Email",
            emailPlaceholder: "Enter your email",

            bio: "Short Bio",
            bioPlaceholder: "Example: I love hanok alleys and small tea houses.",

            joinButton: "Start My K-STEP",
            hasAccount: "Already have an account?",
            login: "Log in"
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

    function EyeIcon({ slash }) {
        return (
            <svg
                viewBox="0 0 24 24"
                className="join-eye-icon"
                fill="none"
            >
                <path d="M2.5 12C4.2 8.5 7.7 6 12 6C16.3 6 19.8 8.5 21.5 12C19.8 15.5 16.3 18 12 18C7.7 18 4.2 15.5 2.5 12Z" />
                <circle cx="12" cy="12" r="3" />

                {slash && (
                    <path d="M4 4L20 20" />
                )}
            </svg>
        );
    }

    function checkPasswordAuto(nextPassword, nextPasswordConfirm) {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (nextPasswordConfirm === "") {
            setPasswordCheck(false);
            setPasswordCheckMessage("");
            return;
        }

        if (nextPassword === "") {
            setPasswordCheck(false);
            setPasswordCheckMessage(getPageText("passwordFirst"));
            return;
        }

        if (!passwordRegex.test(nextPassword)) {
            setPasswordCheck(false);
            setPasswordCheckMessage(getPageText("passwordRule"));
            return;
        }

        if (nextPassword === nextPasswordConfirm) {
            setPasswordCheck(true);
            setPasswordCheckMessage(getPageText("passwordMatch"));
        } else {
            setPasswordCheck(false);
            setPasswordCheckMessage(getPageText("passwordNotMatch"));
        }
    }

    function checkUserId() {
        if (userId === "") {
            alert(getPageText("idRequired"));
            return;
        }

        fetch("http://localhost:3010/user/check-id", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId
            })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                setIdCheckMessage(data.message);

                if (data.result === "success") {
                    setIdCheck(true);
                } else {
                    setIdCheck(false);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("idCheckError"));
            });
    }

    function checkNickname() {
        if (nickname === "") {
            alert(getPageText("nicknameRequired"));
            return;
        }

        fetch("http://localhost:3010/user/check-nickname", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nickname: nickname
            })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                setNicknameCheckMessage(data.message);

                if (data.result === "success") {
                    setNicknameCheck(true);
                } else {
                    setNicknameCheck(false);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("nicknameCheckError"));
            });
    }

    function join() {
        if (userId === "") {
            alert(getPageText("idRequired"));
            return;
        }

        if (password === "") {
            alert(getPageText("passwordRequired"));
            return;
        }

        if (passwordConfirm === "") {
            alert(getPageText("passwordConfirmRequired"));
            return;
        }

        if (nickname === "") {
            alert(getPageText("nicknameRequired"));
            return;
        }

        if (!idCheck) {
            alert(getPageText("idCheckRequired"));
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (!passwordRegex.test(password)) {
            alert(getPageText("passwordRule"));
            return;
        }

        if (password !== passwordConfirm) {
            alert(getPageText("passwordNotMatch"));
            return;
        }

        if (!passwordCheck) {
            alert(getPageText("passwordRecheck"));
            return;
        }

        if (!nicknameCheck) {
            alert(getPageText("nicknameCheckRequired"));
            return;
        }

        if (bio.length > 500) {
            alert(getPageText("bioLimit"));
            return;
        }

        fetch("http://localhost:3010/user/join", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                password: password,
                nickname: nickname,
                userType: userType,
                email: email,
                bio: bio
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.result === "success") {
                    alert(getPageText("joinSuccess"));
                    navigate("/");
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("serverError"));
            });
    }

    return (
        <div className="join-page" data-lang={language}>
            <div className="soft-cloud cloud-one"></div>
            <div className="soft-cloud cloud-two"></div>

            <div className="traditional-motif motif-left"></div>
            <div className="traditional-motif motif-right"></div>

            <div className="bojagi-shape bojagi-one"></div>
            <div className="bojagi-shape bojagi-two"></div>
            <div className="bojagi-shape bojagi-three"></div>

            <div className="flower-mark flower-one">✿</div>
            <div className="flower-mark flower-two">❀</div>
            <div className="flower-mark flower-three">✽</div>

            <div className="join-card">
                <div className="card-soft-glow"></div>

                <div className="norigae">
                    <div className="norigae-string"></div>
                    <div className="norigae-knot"></div>
                    <div className="norigae-ribbon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>

                <div className="traditional-band">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <div className="join-header">
                    <div className="join-logo-wrap">
                        <img
                            className="join-logo-img"
                            src="/images/kstep_logo1.png"
                            alt={getPageText("logoAlt")}
                        />
                    </div>

                    <p className="join-page-label">{getPageText("pageLabel")}</p>

                    <p className="join-main-copy">
                        {getPageText("mainCopy1")}<br />
                        {getPageText("mainCopy2")}
                    </p>

                    <p className="join-sub-copy">
                        {getPageText("subCopy1")}<br />
                        {getPageText("subCopy2")}
                    </p>
                </div>

                <div className="join-form">
                    <div className="join-input-box">
                        <label>{getPageText("userId")}</label>

                        <div className="join-check-row">
                            <input
                                value={userId}
                                onChange={(e) => {
                                    setUserId(e.target.value);
                                    setIdCheck(false);
                                    setIdCheckMessage("");
                                }}
                                placeholder={getPageText("userIdPlaceholder")}
                            />

                            <button
                                type="button"
                                className={idCheck ? "join-check-btn checked" : "join-check-btn"}
                                onClick={checkUserId}
                            >
                                {idCheck ? getPageText("done") : getPageText("duplicateCheck")}
                            </button>
                        </div>

                        {idCheckMessage !== "" && (
                            <p className={idCheck ? "join-check-message success" : "join-check-message fail"}>
                                {idCheckMessage}
                            </p>
                        )}
                    </div>

                    <div className="join-input-box">
                        <label>{getPageText("password")}</label>

                        <div className="join-password-wrap">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    const nextPassword = e.target.value;

                                    setPassword(nextPassword);
                                    checkPasswordAuto(nextPassword, passwordConfirm);
                                }}
                                placeholder={getPageText("passwordPlaceholder")}
                            />

                            <button
                                type="button"
                                className="join-password-eye"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                }}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? getPageText("hidePassword") : getPageText("showPassword")}
                            >
                                <EyeIcon slash={!showPassword} />
                            </button>
                        </div>
                    </div>

                    <div className="join-input-box">
                        <label>{getPageText("passwordConfirm")}</label>

                        <div className="join-password-wrap">
                            <input
                                type={showPasswordConfirm ? "text" : "password"}
                                value={passwordConfirm}
                                onChange={(e) => {
                                    const nextPasswordConfirm = e.target.value;

                                    setPasswordConfirm(nextPasswordConfirm);
                                    checkPasswordAuto(password, nextPasswordConfirm);
                                }}
                                placeholder={getPageText("passwordConfirmPlaceholder")}
                            />

                            <button
                                type="button"
                                className="join-password-eye"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                }}
                                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                aria-label={showPasswordConfirm ? getPageText("hidePasswordConfirm") : getPageText("showPasswordConfirm")}
                            >
                                <EyeIcon slash={!showPasswordConfirm} />
                            </button>
                        </div>

                        {passwordCheckMessage !== "" && (
                            <p className={passwordCheck ? "join-check-message success" : "join-check-message fail"}>
                                {passwordCheckMessage}
                            </p>
                        )}
                    </div>

                    <div className="join-input-box">
                        <label>{getPageText("nickname")}</label>

                        <div className="join-check-row">
                            <input
                                value={nickname}
                                onChange={(e) => {
                                    setNickname(e.target.value);
                                    setNicknameCheck(false);
                                    setNicknameCheckMessage("");
                                }}
                                placeholder={getPageText("nicknamePlaceholder")}
                            />

                            <button
                                type="button"
                                className={nicknameCheck ? "join-check-btn checked" : "join-check-btn"}
                                onClick={checkNickname}
                            >
                                {nicknameCheck ? getPageText("done") : getPageText("duplicateCheck")}
                            </button>
                        </div>

                        {nicknameCheckMessage !== "" && (
                            <p className={nicknameCheck ? "join-check-message success" : "join-check-message fail"}>
                                {nicknameCheckMessage}
                            </p>
                        )}
                    </div>

                    <div className="join-input-box">
                        <label>{getPageText("userType")}</label>

                        <select
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                        >
                            <option value="TRAVELER">{getPageText("traveler")}</option>
                            <option value="LOCAL">{getPageText("local")}</option>
                            <option value="GUIDE">{getPageText("guide")}</option>
                            <option value="BUSINESS">{getPageText("business")}</option>
                        </select>
                    </div>

                    <div className="join-input-box">
                        <label>{getPageText("email")}</label>

                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={getPageText("emailPlaceholder")}
                        />
                    </div>

                    <div className="join-input-box">
                        <label>{getPageText("bio")}</label>

                        <div className="join-textarea-wrap">
                            <textarea
                                value={bio}
                                maxLength={500}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder={getPageText("bioPlaceholder")}
                            />

                            <span className="join-text-count">
                                {bio.length}/500
                            </span>
                        </div>
                    </div>

                    <button type="button" className="join-button" onClick={join}>
                        {getPageText("joinButton")}
                    </button>
                </div>

                <div className="join-bottom">
                    <span>{getPageText("hasAccount")}</span>
                    <button type="button" onClick={() => navigate("/")}>
                        {getPageText("login")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Join;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLang } from "../utils/language";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [language, setLanguage] = useState(getLang());

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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
            passwordRequired: "비밀번호를 입력해주세요.",
            loginSuccess: "로그인되었습니다.",
            serverError: "서버 연결 중 오류가 발생했습니다.",

            logoAlt: "K-STEP 로고",
            pageLabel: "로그인",
            mainCopy1: "오늘의 한국 여행을",
            mainCopy2: "다시 이어가볼까요?",
            subCopy1: "저장한 루트와 로컬 피드를 확인하고",
            subCopy2: "새로운 여행 이야기를 만나보세요.",

            userId: "아이디",
            userIdPlaceholder: "아이디를 입력하세요",
            password: "비밀번호",
            passwordPlaceholder: "비밀번호를 입력하세요",
            hidePassword: "비밀번호 숨기기",
            showPassword: "비밀번호 보기",

            loginButton: "K-STEP 로그인",
            findId: "아이디 찾기",
            findPassword: "비밀번호 찾기",
            noAccount: "아직 계정이 없나요?",
            join: "회원가입"
        };

        const en = {
            idRequired: "Please enter your ID.",
            passwordRequired: "Please enter your password.",
            loginSuccess: "You have logged in.",
            serverError: "An error occurred while connecting to the server.",

            logoAlt: "K-STEP logo",
            pageLabel: "Log in",
            mainCopy1: "Ready to continue",
            mainCopy2: "your Korea trip today?",
            subCopy1: "Check your saved routes and local feeds",
            subCopy2: "and discover new travel stories.",

            userId: "ID",
            userIdPlaceholder: "Enter your ID",
            password: "Password",
            passwordPlaceholder: "Enter your password",
            hidePassword: "Hide password",
            showPassword: "Show password",

            loginButton: "Log in to K-STEP",
            findId: "Find ID",
            findPassword: "Find Password",
            noAccount: "Don’t have an account yet?",
            join: "Sign up"
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

    function login() {
        if (userId === "") {
            alert(getPageText("idRequired"));
            return;
        }

        if (password === "") {
            alert(getPageText("passwordRequired"));
            return;
        }

        fetch("http://localhost:3010/user/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                password: password
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);

                if (data.result === "success") {
                    alert(getPageText("loginSuccess"));

                    localStorage.setItem("token", data.token);
                    localStorage.setItem("userNo", data.user.USER_NO);
                    localStorage.setItem("userId", data.user.USER_ID);
                    localStorage.setItem("nickname", data.user.NICKNAME);
                    localStorage.setItem("userType", data.user.USER_TYPE);

                    navigate("/home");
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("serverError"));
            });
    }

    function moveFindId() {
        navigate("/find-account?tab=id");
    }

    function moveFindPassword() {
        navigate("/find-account?tab=password");
    }

    return (
        <div className="login-page" data-lang={language}>
            <div className="soft-cloud login-cloud-one"></div>
            <div className="soft-cloud login-cloud-two"></div>

            <div className="traditional-motif login-motif-left"></div>
            <div className="traditional-motif login-motif-right"></div>

            <div className="bojagi-shape login-bojagi-one"></div>
            <div className="bojagi-shape login-bojagi-two"></div>

            <div className="flower-mark login-flower-one">✿</div>
            <div className="flower-mark login-flower-two">❀</div>

            <div className="login-card">
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

                <div className="login-header">
                    <div className="login-logo-wrap">
                        <img
                            className="login-logo-img"
                            src="/images/kstep_logo1.png"
                            alt={getPageText("logoAlt")}
                        />
                    </div>

                    <p className="login-page-label">{getPageText("pageLabel")}</p>

                    <p className="login-main-copy">
                        {getPageText("mainCopy1")}<br />
                        {getPageText("mainCopy2")}
                    </p>

                    <p className="login-sub-copy">
                        {getPageText("subCopy1")}<br />
                        {getPageText("subCopy2")}
                    </p>
                </div>

                <div className="login-form">
                    <div className="login-input-box">
                        <label>{getPageText("userId")}</label>
                        <input
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder={getPageText("userIdPlaceholder")}
                        />
                    </div>

                    <div className="login-input-box">
                        <label>{getPageText("password")}</label>

                        <div className="login-password-wrap">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={getPageText("passwordPlaceholder")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        login();
                                    }
                                }}
                            />

                            <button
                                type="button"
                                className="login-password-eye"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                }}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? getPageText("hidePassword") : getPageText("showPassword")}
                            >
                                {showPassword ? (
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="login-eye-icon"
                                        fill="none"
                                    >
                                        <path d="M2.5 12C4.2 8.5 7.7 6 12 6C16.3 6 19.8 8.5 21.5 12C19.8 15.5 16.3 18 12 18C7.7 18 4.2 15.5 2.5 12Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                ) : (
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="login-eye-icon"
                                        fill="none"
                                    >
                                        <path d="M2.5 12C4.2 8.5 7.7 6 12 6C16.3 6 19.8 8.5 21.5 12C19.8 15.5 16.3 18 12 18C7.7 18 4.2 15.5 2.5 12Z" />
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M4 4L20 20" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button className="login-button" onClick={login}>
                        {getPageText("loginButton")}
                    </button>

                    <div className="login-find-row">
                        <button type="button" onClick={moveFindId}>
                            {getPageText("findId")}
                        </button>

                        <span>|</span>

                        <button type="button" onClick={moveFindPassword}>
                            {getPageText("findPassword")}
                        </button>
                    </div>
                </div>

                <div className="login-bottom">
                    <span>{getPageText("noAccount")}</span>
                    <button onClick={() => navigate("/join")}>{getPageText("join")}</button>
                </div>
            </div>
        </div>
    );
}

export default Login;
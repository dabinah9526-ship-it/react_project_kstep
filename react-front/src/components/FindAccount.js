import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getLang } from "../utils/language";
import "./FindAccount.css";

function FindAccount() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [language, setLanguage] = useState(getLang());

    const [activeTab, setActiveTab] = useState("id");
    const [loading, setLoading] = useState(false);

    const [findIdEmail, setFindIdEmail] = useState("");
    const [findIdNickname, setFindIdNickname] = useState("");
    const [foundUserId, setFoundUserId] = useState("");

    const [resetUserId, setResetUserId] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);

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
        const tab = searchParams.get("tab");

        if (tab === "password") {
            setActiveTab("password");
            return;
        }

        setActiveTab("id");
    }, [searchParams]);

    function getPageText(key) {
        const ko = {
            emailRequired: "가입 이메일을 입력해주세요.",
            nicknameRequired: "닉네임을 입력해주세요.",
            noAccount: "일치하는 계정을 찾을 수 없습니다.",
            findIdError: "아이디 찾기 중 오류가 발생했습니다.",

            userIdRequired: "아이디를 입력해주세요.",
            newPasswordRequired: "새 비밀번호를 입력해주세요.",
            newPasswordConfirmRequired: "새 비밀번호 확인을 입력해주세요.",
            passwordNotMatch: "새 비밀번호가 서로 다릅니다.",
            passwordRule: "비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요.",
            resetSuccess: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.",
            resetFail: "비밀번호 변경에 실패했습니다.",
            resetError: "비밀번호 찾기 중 오류가 발생했습니다.",

            logoAlt: "K-STEP 로고",
            findId: "아이디 찾기",
            findPassword: "비밀번호 찾기",
            headerSub1: "가입할 때 입력한 정보가 맞으면",
            headerSub2: "아이디 확인 또는 비밀번호 변경을 할 수 있어요.",

            idGuideTitle: "아이디가 기억나지 않나요?",
            idGuideText: "가입 이메일과 닉네임을 확인해 아이디를 찾아드릴게요.",
            joinEmail: "가입 이메일",
            joinEmailPlaceholder: "가입할 때 사용한 이메일",
            nickname: "닉네임",
            nicknamePlaceholder: "가입할 때 사용한 닉네임",
            checking: "확인 중...",
            foundIdLabel: "가입된 아이디",
            loginNow: "로그인하기",

            passwordGuideTitle: "기존 비밀번호는 확인할 수 없어요.",
            passwordGuideText: "아이디와 가입 이메일 확인 후 새 비밀번호로 변경합니다.",
            userId: "아이디",
            userIdPlaceholder: "아이디를 입력하세요",
            newPassword: "새 비밀번호",
            newPasswordPlaceholder: "영문+숫자 포함 8~20자",
            newPasswordConfirm: "새 비밀번호 확인",
            newPasswordConfirmPlaceholder: "새 비밀번호를 한 번 더 입력",
            changing: "변경 중...",
            resetPasswordButton: "비밀번호 변경하기",

            hidePassword: "비밀번호 숨기기",
            showPassword: "비밀번호 보기",

            login: "로그인",
            join: "회원가입"
        };

        const en = {
            emailRequired: "Please enter the email you used to sign up.",
            nicknameRequired: "Please enter your nickname.",
            noAccount: "No matching account was found.",
            findIdError: "An error occurred while finding your ID.",

            userIdRequired: "Please enter your ID.",
            newPasswordRequired: "Please enter a new password.",
            newPasswordConfirmRequired: "Please confirm your new password.",
            passwordNotMatch: "The new passwords do not match.",
            passwordRule: "Password must be 8-20 characters and include letters and numbers.",
            resetSuccess: "Your password has been changed. Please log in with your new password.",
            resetFail: "Failed to change password.",
            resetError: "An error occurred while resetting password.",

            logoAlt: "K-STEP logo",
            findId: "Find ID",
            findPassword: "Find Password",
            headerSub1: "If your sign-up information matches,",
            headerSub2: "you can find your ID or reset your password.",

            idGuideTitle: "Forgot your ID?",
            idGuideText: "We will find your ID using your sign-up email and nickname.",
            joinEmail: "Sign-up Email",
            joinEmailPlaceholder: "Email used when signing up",
            nickname: "Nickname",
            nicknamePlaceholder: "Nickname used when signing up",
            checking: "Checking...",
            foundIdLabel: "Your ID",
            loginNow: "Log in",

            passwordGuideTitle: "Your old password cannot be shown.",
            passwordGuideText: "After checking your ID and sign-up email, you can set a new password.",
            userId: "ID",
            userIdPlaceholder: "Enter your ID",
            newPassword: "New Password",
            newPasswordPlaceholder: "8-20 characters with letters and numbers",
            newPasswordConfirm: "Confirm New Password",
            newPasswordConfirmPlaceholder: "Enter your new password again",
            changing: "Changing...",
            resetPasswordButton: "Change Password",

            hidePassword: "Hide password",
            showPassword: "Show password",

            login: "Log in",
            join: "Sign up"
        };

        if (language === "en") {
            return en[key] || ko[key] || key;
        }

        return ko[key] || key;
    }

    function changeTab(tabName) {
        setActiveTab(tabName);
        setFoundUserId("");

        if (tabName === "id") {
            navigate("/find-account?tab=id");
        } else {
            navigate("/find-account?tab=password");
        }
    }

    function findId() {
        if (findIdEmail.trim() === "") {
            alert(getPageText("emailRequired"));
            return;
        }

        if (findIdNickname.trim() === "") {
            alert(getPageText("nicknameRequired"));
            return;
        }

        setLoading(true);
        setFoundUserId("");

        fetch("http://localhost:3010/user/find-id", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: findIdEmail,
                nickname: findIdNickname
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("아이디 찾기 결과", data);

                if (data.result === "success") {
                    setFoundUserId(data.userId);
                } else {
                    alert(data.message || getPageText("noAccount"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("findIdError"));
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function resetPassword() {
        if (resetUserId.trim() === "") {
            alert(getPageText("userIdRequired"));
            return;
        }

        if (resetEmail.trim() === "") {
            alert(getPageText("emailRequired"));
            return;
        }

        if (newPassword.trim() === "") {
            alert(getPageText("newPasswordRequired"));
            return;
        }

        if (newPasswordConfirm.trim() === "") {
            alert(getPageText("newPasswordConfirmRequired"));
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            alert(getPageText("passwordNotMatch"));
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (!passwordRegex.test(newPassword)) {
            alert(getPageText("passwordRule"));
            return;
        }

        setLoading(true);

        fetch("http://localhost:3010/user/password/reset", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: resetUserId,
                email: resetEmail,
                newPassword: newPassword,
                newPasswordConfirm: newPasswordConfirm
            })
        })
            .then(res => res.json())
            .then(data => {
                console.log("비밀번호 찾기 결과", data);

                if (data.result === "success") {
                    alert(data.message || getPageText("resetSuccess"));

                    setResetUserId("");
                    setResetEmail("");
                    setNewPassword("");
                    setNewPasswordConfirm("");

                    navigate("/");
                } else {
                    alert(data.message || getPageText("resetFail"));
                }
            })
            .catch(err => {
                console.error(err);
                alert(getPageText("resetError"));
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function renderEyeIcon(show) {
        if (show) {
            return (
                <svg viewBox="0 0 24 24" className="find-account-eye-icon" fill="none">
                    <path d="M2.5 12C4.2 8.5 7.7 6 12 6C16.3 6 19.8 8.5 21.5 12C19.8 15.5 16.3 18 12 18C7.7 18 4.2 15.5 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            );
        }

        return (
            <svg viewBox="0 0 24 24" className="find-account-eye-icon" fill="none">
                <path d="M2.5 12C4.2 8.5 7.7 6 12 6C16.3 6 19.8 8.5 21.5 12C19.8 15.5 16.3 18 12 18C7.7 18 4.2 15.5 2.5 12Z" />
                <circle cx="12" cy="12" r="3" />
                <path d="M4 4L20 20" />
            </svg>
        );
    }

    return (
        <div className="find-account-page" data-lang={language}>
            <div className="find-soft-cloud find-cloud-one"></div>
            <div className="find-soft-cloud find-cloud-two"></div>

            <div className="find-traditional-motif find-motif-left"></div>
            <div className="find-traditional-motif find-motif-right"></div>

            <div className="find-bojagi-shape find-bojagi-one"></div>
            <div className="find-bojagi-shape find-bojagi-two"></div>

            <div className="find-flower-mark find-flower-one">✿</div>
            <div className="find-flower-mark find-flower-two">❀</div>

            <div className="find-account-card">
                <div className="find-card-soft-glow"></div>

                <div className="find-norigae">
                    <div className="find-norigae-string"></div>
                    <div className="find-norigae-knot"></div>
                    <div className="find-norigae-ribbon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>

                <div className="find-traditional-band">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <div className="find-account-header">
                    <div className="find-account-logo-wrap">
                        <img
                            className="find-account-logo-img"
                            src="/images/kstep_logo1.png"
                            alt={getPageText("logoAlt")}
                        />
                    </div>

                    <p className="find-account-page-label">
                        {activeTab === "id" ? getPageText("findId") : getPageText("findPassword")}
                    </p>

                    <p className="find-account-sub-copy">
                        {getPageText("headerSub1")}<br />
                        {getPageText("headerSub2")}
                    </p>
                </div>

                <div className="find-account-tab-row">
                    <button
                        type="button"
                        className={activeTab === "id" ? "active" : ""}
                        onClick={() => changeTab("id")}
                    >
                        {getPageText("findId")}
                    </button>

                    <button
                        type="button"
                        className={activeTab === "password" ? "active" : ""}
                        onClick={() => changeTab("password")}
                    >
                        {getPageText("findPassword")}
                    </button>
                </div>

                {activeTab === "id" && (
                    <div className="find-account-form">
                        <div className="find-account-guide-box">
                            <strong>{getPageText("idGuideTitle")}</strong>
                            <span>{getPageText("idGuideText")}</span>
                        </div>

                        <div className="find-account-input-box">
                            <label>{getPageText("joinEmail")}</label>
                            <input
                                value={findIdEmail}
                                onChange={(e) => setFindIdEmail(e.target.value)}
                                placeholder={getPageText("joinEmailPlaceholder")}
                            />
                        </div>

                        <div className="find-account-input-box">
                            <label>{getPageText("nickname")}</label>
                            <input
                                value={findIdNickname}
                                onChange={(e) => setFindIdNickname(e.target.value)}
                                placeholder={getPageText("nicknamePlaceholder")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        findId();
                                    }
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            className="find-account-main-btn"
                            onClick={findId}
                            disabled={loading}
                        >
                            {loading ? getPageText("checking") : getPageText("findId")}
                        </button>

                        {foundUserId !== "" && (
                            <div className="find-account-result-box">
                                <span>{getPageText("foundIdLabel")}</span>
                                <strong>{foundUserId}</strong>

                                <div className="find-account-result-action-row">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/")}
                                    >
                                        {getPageText("loginNow")}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setResetUserId(foundUserId);
                                            changeTab("password");
                                        }}
                                    >
                                        {getPageText("findPassword")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "password" && (
                    <div className="find-account-form">
                        <div className="find-account-guide-box">
                            <strong>{getPageText("passwordGuideTitle")}</strong>
                            <span>{getPageText("passwordGuideText")}</span>
                        </div>

                        <div className="find-account-input-box">
                            <label>{getPageText("userId")}</label>
                            <input
                                value={resetUserId}
                                onChange={(e) => setResetUserId(e.target.value)}
                                placeholder={getPageText("userIdPlaceholder")}
                            />
                        </div>

                        <div className="find-account-input-box">
                            <label>{getPageText("joinEmail")}</label>
                            <input
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder={getPageText("joinEmailPlaceholder")}
                            />
                        </div>

                        <div className="find-account-input-box">
                            <label>{getPageText("newPassword")}</label>

                            <div className="find-account-password-wrap">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder={getPageText("newPasswordPlaceholder")}
                                />

                                <button
                                    type="button"
                                    className="find-account-password-eye"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label={showNewPassword ? getPageText("hidePassword") : getPageText("showPassword")}
                                >
                                    {renderEyeIcon(showNewPassword)}
                                </button>
                            </div>
                        </div>

                        <div className="find-account-input-box">
                            <label>{getPageText("newPasswordConfirm")}</label>

                            <div className="find-account-password-wrap">
                                <input
                                    type={showNewPasswordConfirm ? "text" : "password"}
                                    value={newPasswordConfirm}
                                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                    placeholder={getPageText("newPasswordConfirmPlaceholder")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            resetPassword();
                                        }
                                    }}
                                />

                                <button
                                    type="button"
                                    className="find-account-password-eye"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                                    aria-label={showNewPasswordConfirm ? getPageText("hidePassword") : getPageText("showPassword")}
                                >
                                    {renderEyeIcon(showNewPasswordConfirm)}
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="find-account-main-btn"
                            onClick={resetPassword}
                            disabled={loading}
                        >
                            {loading ? getPageText("changing") : getPageText("resetPasswordButton")}
                        </button>
                    </div>
                )}

                <div className="find-account-bottom">
                    <button type="button" onClick={() => navigate("/")}>
                        {getPageText("login")}
                    </button>

                    <span>|</span>

                    <button type="button" onClick={() => navigate("/join")}>
                        {getPageText("join")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FindAccount;
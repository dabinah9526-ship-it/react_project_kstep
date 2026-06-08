import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./FindAccount.css";

function FindAccount() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

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
        const tab = searchParams.get("tab");

        if (tab === "password") {
            setActiveTab("password");
            return;
        }

        setActiveTab("id");
    }, [searchParams]);

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
            alert("가입 이메일을 입력해주세요.");
            return;
        }

        if (findIdNickname.trim() === "") {
            alert("닉네임을 입력해주세요.");
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
                    alert(data.message || "일치하는 계정을 찾을 수 없습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("아이디 찾기 중 오류가 발생했습니다.");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function resetPassword() {
        if (resetUserId.trim() === "") {
            alert("아이디를 입력해주세요.");
            return;
        }

        if (resetEmail.trim() === "") {
            alert("가입 이메일을 입력해주세요.");
            return;
        }

        if (newPassword.trim() === "") {
            alert("새 비밀번호를 입력해주세요.");
            return;
        }

        if (newPasswordConfirm.trim() === "") {
            alert("새 비밀번호 확인을 입력해주세요.");
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            alert("새 비밀번호가 서로 다릅니다.");
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (!passwordRegex.test(newPassword)) {
            alert("비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요.");
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
                    alert(data.message || "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");

                    setResetUserId("");
                    setResetEmail("");
                    setNewPassword("");
                    setNewPasswordConfirm("");

                    navigate("/");
                } else {
                    alert(data.message || "비밀번호 변경에 실패했습니다.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("비밀번호 찾기 중 오류가 발생했습니다.");
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
        <div className="find-account-page">
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
                            alt="K-STEP 로고"
                        />
                    </div>

                    <p className="find-account-page-label">
                        {activeTab === "id" ? "아이디 찾기" : "비밀번호 찾기"}
                    </p>

                    <p className="find-account-sub-copy">
                        가입할 때 입력한 정보가 맞으면<br />
                        아이디 확인 또는 비밀번호 변경을 할 수 있어요.
                    </p>
                </div>

                <div className="find-account-tab-row">
                    <button
                        type="button"
                        className={activeTab === "id" ? "active" : ""}
                        onClick={() => changeTab("id")}
                    >
                        아이디 찾기
                    </button>

                    <button
                        type="button"
                        className={activeTab === "password" ? "active" : ""}
                        onClick={() => changeTab("password")}
                    >
                        비밀번호 찾기
                    </button>
                </div>

                {activeTab === "id" && (
                    <div className="find-account-form">
                        <div className="find-account-guide-box">
                            <strong>아이디가 기억나지 않나요?</strong>
                            <span>가입 이메일과 닉네임을 확인해 아이디를 찾아드릴게요.</span>
                        </div>

                        <div className="find-account-input-box">
                            <label>가입 이메일</label>
                            <input
                                value={findIdEmail}
                                onChange={(e) => setFindIdEmail(e.target.value)}
                                placeholder="가입할 때 사용한 이메일"
                            />
                        </div>

                        <div className="find-account-input-box">
                            <label>닉네임</label>
                            <input
                                value={findIdNickname}
                                onChange={(e) => setFindIdNickname(e.target.value)}
                                placeholder="가입할 때 사용한 닉네임"
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
                            {loading ? "확인 중..." : "아이디 찾기"}
                        </button>

                        {foundUserId !== "" && (
                            <div className="find-account-result-box">
                                <span>가입된 아이디</span>
                                <strong>{foundUserId}</strong>

                                <div className="find-account-result-action-row">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/")}
                                    >
                                        로그인하기
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setResetUserId(foundUserId);
                                            changeTab("password");
                                        }}
                                    >
                                        비밀번호 찾기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "password" && (
                    <div className="find-account-form">
                        <div className="find-account-guide-box">
                            <strong>기존 비밀번호는 확인할 수 없어요.</strong>
                            <span>아이디와 가입 이메일 확인 후 새 비밀번호로 변경합니다.</span>
                        </div>

                        <div className="find-account-input-box">
                            <label>아이디</label>
                            <input
                                value={resetUserId}
                                onChange={(e) => setResetUserId(e.target.value)}
                                placeholder="아이디를 입력하세요"
                            />
                        </div>

                        <div className="find-account-input-box">
                            <label>가입 이메일</label>
                            <input
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="가입할 때 사용한 이메일"
                            />
                        </div>

                        <div className="find-account-input-box">
                            <label>새 비밀번호</label>

                            <div className="find-account-password-wrap">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="영문+숫자 포함 8~20자"
                                />

                                <button
                                    type="button"
                                    className="find-account-password-eye"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label={showNewPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                                >
                                    {renderEyeIcon(showNewPassword)}
                                </button>
                            </div>
                        </div>

                        <div className="find-account-input-box">
                            <label>새 비밀번호 확인</label>

                            <div className="find-account-password-wrap">
                                <input
                                    type={showNewPasswordConfirm ? "text" : "password"}
                                    value={newPasswordConfirm}
                                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                    placeholder="새 비밀번호를 한 번 더 입력"
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
                                    aria-label={showNewPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
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
                            {loading ? "변경 중..." : "비밀번호 변경하기"}
                        </button>
                    </div>
                )}

                <div className="find-account-bottom">
                    <button type="button" onClick={() => navigate("/")}>
                        로그인
                    </button>

                    <span>|</span>

                    <button type="button" onClick={() => navigate("/join")}>
                        회원가입
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FindAccount;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");

    // 비밀번호 보이기 / 숨기기
    const [showPassword, setShowPassword] = useState(false);

    function login() {
        if (userId === "") {
            alert("아이디를 입력해주세요.");
            return;
        }

        if (password === "") {
            alert("비밀번호를 입력해주세요.");
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
                    alert("로그인되었습니다.");

                    // 로그인 정보 저장
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
                alert("서버 연결 중 오류가 발생했습니다.");
            });
    }

    return (
        <div className="login-page">
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
                            alt="K-STEP 로고"
                        />
                    </div>

                    <p className="login-page-label">로그인</p>

                    <p className="login-main-copy">
                        오늘의 한국 여행을<br />
                        다시 이어가볼까요?
                    </p>

                    <p className="login-sub-copy">
                        저장한 루트와 로컬 피드를 확인하고<br />
                        새로운 여행 이야기를 만나보세요.
                    </p>
                </div>

                <div className="login-form">
                    <div className="login-input-box">
                        <label>아이디</label>
                        <input
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="아이디를 입력하세요"
                        />
                    </div>

                    <div className="login-input-box">
                        <label>비밀번호</label>

                        <div className="login-password-wrap">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호를 입력하세요"
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
                                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
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
                        K-STEP 로그인
                    </button>
                </div>

                <div className="login-bottom">
                    <span>아직 계정이 없나요?</span>
                    <button onClick={() => navigate("/join")}>회원가입</button>
                </div>
            </div>
        </div>
    );
}

export default Login;
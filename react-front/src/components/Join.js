import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Join.css";

function Join() {
    const navigate = useNavigate();

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

    function checkUserId() {
        if (userId === "") {
            alert("아이디를 입력해주세요.");
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
                alert("아이디 중복체크 중 오류가 발생했습니다.");
            });
    }

    function checkPasswordMatch() {
        if (password === "") {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        if (passwordConfirm === "") {
            alert("비밀번호 확인을 입력해주세요.");
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (!passwordRegex.test(password)) {
            setPasswordCheck(false);
            setPasswordCheckMessage("비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요.");
            alert("비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요.");
            return;
        }

        if (password === passwordConfirm) {
            setPasswordCheck(true);
            setPasswordCheckMessage("비밀번호가 일치합니다.");
            alert("비밀번호가 일치합니다.");
        } else {
            setPasswordCheck(false);
            setPasswordCheckMessage("비밀번호가 일치하지 않습니다.");
            alert("비밀번호가 일치하지 않습니다.");
        }
    }

    function checkNickname() {
        if (nickname === "") {
            alert("닉네임을 입력해주세요.");
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
                alert("닉네임 중복체크 중 오류가 발생했습니다.");
            });
    }

    function join() {
        if (userId === "") {
            alert("아이디를 입력해주세요.");
            return;
        }

        if (password === "") {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        if (passwordConfirm === "") {
            alert("비밀번호 확인을 입력해주세요.");
            return;
        }

        if (nickname === "") {
            alert("닉네임을 입력해주세요.");
            return;
        }

        if (!idCheck) {
            alert("아이디 중복체크를 해주세요.");
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

        if (!passwordRegex.test(password)) {
            alert("비밀번호는 영문과 숫자를 포함해서 8~20자로 입력해주세요.");
            return;
        }

        if (!passwordCheck) {
            alert("비밀번호 확인을 해주세요.");
            return;
        }

        if (password !== passwordConfirm) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        if (!nicknameCheck) {
            alert("닉네임 중복체크를 해주세요.");
            return;
        }

        if (bio.length > 500) {
            alert("자기소개는 500자 이하로 입력해주세요.");
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
                    alert("회원가입이 완료되었습니다.");
                    navigate("/");
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
        <div className="join-page">
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
                            alt="K-STEP 로고"
                        />
                    </div>

                    <p className="join-page-label">회원가입</p>

                    <p className="join-main-copy">
                        한국의 예쁜 순간을<br />
                        나만의 루트로 담아봐요
                    </p>

                    <p className="join-sub-copy">
                        골목길, 시장, 카페, 바다, 한옥까지<br />
                        사진과 동선으로 공유하는 로컬 여행 공간
                    </p>
                </div>

                <div className="join-form">
                    <div className="join-input-box">
                        <label>아이디</label>

                        <div className="join-check-row">
                            <input
                                value={userId}
                                onChange={(e) => {
                                    setUserId(e.target.value);
                                    setIdCheck(false);
                                    setIdCheckMessage("");
                                }}
                                placeholder="아이디를 입력하세요"
                            />

                            <button
                                type="button"
                                className={idCheck ? "join-check-btn checked" : "join-check-btn"}
                                onClick={checkUserId}
                            >
                                {idCheck ? "완료" : "중복확인"}
                            </button>
                        </div>

                        {idCheckMessage !== "" && (
                            <p className={idCheck ? "join-check-message success" : "join-check-message fail"}>
                                {idCheckMessage}
                            </p>
                        )}
                    </div>

                    <div className="join-input-box">
                        <label>비밀번호</label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setPasswordCheck(false);
                                setPasswordCheckMessage("");
                            }}
                            placeholder="영문+숫자 포함 8~20자"
                        />
                    </div>

                    <div className="join-input-box">
                        <label>비밀번호 확인</label>

                        <div className="join-check-row">
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => {
                                    setPasswordConfirm(e.target.value);
                                    setPasswordCheck(false);
                                    setPasswordCheckMessage("");
                                }}
                                placeholder="비밀번호를 다시 입력하세요"
                            />

                            <button
                                type="button"
                                className={passwordCheck ? "join-check-btn checked" : "join-check-btn"}
                                onClick={checkPasswordMatch}
                            >
                                {passwordCheck ? "완료" : "확인"}
                            </button>
                        </div>

                        {passwordCheckMessage !== "" && (
                            <p className={passwordCheck ? "join-check-message success" : "join-check-message fail"}>
                                {passwordCheckMessage}
                            </p>
                        )}
                    </div>

                    <div className="join-input-box">
                        <label>닉네임</label>

                        <div className="join-check-row">
                            <input
                                value={nickname}
                                onChange={(e) => {
                                    setNickname(e.target.value);
                                    setNicknameCheck(false);
                                    setNicknameCheckMessage("");
                                }}
                                placeholder="여행 피드에 보여질 닉네임"
                            />

                            <button
                                type="button"
                                className={nicknameCheck ? "join-check-btn checked" : "join-check-btn"}
                                onClick={checkNickname}
                            >
                                {nicknameCheck ? "완료" : "중복확인"}
                            </button>
                        </div>

                        {nicknameCheckMessage !== "" && (
                            <p className={nicknameCheck ? "join-check-message success" : "join-check-message fail"}>
                                {nicknameCheckMessage}
                            </p>
                        )}
                    </div>

                    <div className="join-input-box">
                        <label>사용자 유형</label>

                        <select
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                        >
                            <option value="TRAVELER">Traveler 여행자</option>
                            <option value="LOCAL">Local 로컬</option>
                            <option value="GUIDE">Guide 가이드</option>
                            <option value="BUSINESS">Business 사업자</option>
                        </select>
                    </div>

                    <div className="join-input-box">
                        <label>이메일</label>

                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="이메일을 입력하세요"
                        />
                    </div>

                    <div className="join-input-box">
                        <label>간단 소개</label>

                        <div className="join-textarea-wrap">
                            <textarea
                                value={bio}
                                maxLength={500}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="예: 한옥 골목과 작은 찻집을 좋아해요."
                            />

                            <span className="join-text-count">
                                {bio.length}/500
                            </span>
                        </div>
                    </div>

                    <button className="join-button" onClick={join}>
                        나의 K-STEP 시작하기
                    </button>
                </div>

                <div className="join-bottom">
                    <span>이미 계정이 있나요?</span>
                    <button onClick={() => navigate("/")}>로그인</button>
                </div>
            </div>
        </div>
    );
}

export default Join;
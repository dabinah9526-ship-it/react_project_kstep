# K-STEP

<div align="center">

<img src="./readme/k_step_logo1.png" width="500" alt="K-STEP 대표 이미지"/>

<br><br>

## K-STEP

### 한국 여행 루트를 공유하는 SNS 플랫폼

</div>

<br>

---

## 1. 프로젝트 소개

**K-STEP**은 한국 여행을 주제로 한 SNS 웹 서비스입니다.

사용자는 여행 피드를 작성하고, 여러 장의 사진과 여행 루트를 함께 공유할 수 있습니다.
또한 좋아요, 저장, 댓글, 팔로우, 스토리, 채팅, 알림 기능을 통해 다른 여행자들과 소통할 수 있습니다.

기존 SNS처럼 사진만 올리는 것이 아니라, **여행 장소와 루트 정보를 함께 기록**할 수 있도록 구성한 것이 특징입니다.

<br>

---

## 2. 개발 기간

**2026.05 ~ 2026.06**

| 기간  | 작업 내용                       |
| --- | --------------------------- |
| 1단계 | 프로젝트 주제 선정 및 기획             |
| 2단계 | Oracle DB 테이블 설계            |
| 3단계 | Node.js + Express API 구현    |
| 4단계 | React 화면 및 라우팅 구현           |
| 5단계 | 피드, 댓글, 좋아요, 저장 기능 구현       |
| 6단계 | 팔로우, 스토리, 채팅, 알림, 광고 기능 구현  |
| 7단계 | UI 디자인 통일 및 오류 수정           |
| 8단계 | DB 백업, README, PPT, 시연영상 정리 |

<br>

---

## 3. 팀원 구성

| 구분      | 인원 | 담당                                 |
| ------- | -: | ---------------------------------- |
| 개인 프로젝트 | 1명 | 기획, DB 설계, 프론트엔드, 백엔드, UI 디자인, 테스트 |

<br>

---

## 4. 사용 스킬

### Front-End

<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white"/>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
<img src="https://img.shields.io/badge/CSS-663399?style=for-the-badge&logo=css&logoColor=white"/>

| 기술           | 사용 내용                 |
| ------------ | --------------------- |
| React        | 컴포넌트 기반 화면 구현         |
| React Router | 페이지 이동 및 라우팅 처리       |
| JavaScript   | 이벤트 처리 및 API 연동       |
| CSS          | 전체 UI 디자인 및 화면 스타일 구현 |

<br>

### Back-End

<img src="https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white"/>
<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
<img src="https://img.shields.io/badge/bcrypt-004088?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Multer-FFB13B?style=for-the-badge"/>

| 기술       | 사용 내용                 |
| -------- | --------------------- |
| Node.js  | 서버 실행 환경 구성           |
| Express  | REST API 구현           |
| JWT      | 로그인 인증 및 사용자 검증       |
| bcrypt   | 비밀번호 암호화              |
| multer   | 이미지 업로드 처리            |
| oracledb | Node.js와 Oracle DB 연동 |

<br>

### Database

<img src="https://img.shields.io/badge/Oracle-F80000?style=for-the-badge&logo=oracle&logoColor=white"/>

| 기술            | 사용 내용                          |
| ------------- | ------------------------------ |
| Oracle DB     | 회원, 피드, 댓글, 스토리, 채팅, 광고 데이터 저장 |
| SQL Developer | 테이블 관리, 데이터 확인, DB 백업          |

<br>

### API / Tool

<img src="https://img.shields.io/badge/Pexels-05A081?style=for-the-badge&logo=pexels&logoColor=white"/>
<img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white"/>
<img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/>
<img src="https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white"/>

| 기술           | 사용 내용               |
| ------------ | ------------------- |
| Pexels API   | 여행 이미지 활용           |
| 지도 iframe    | 여행 장소 위치 표시         |
| Git / GitHub | 프로젝트 형상 관리 및 산출물 공유 |
| VS Code      | 개발 환경               |

<br>

---

## 5. 프로젝트 구조

```bash
ReactProject_2026
├─ express-back
│  ├─ routes
│  │  ├─ business.js
│  │  ├─ chat.js
│  │  ├─ feed.js
│  │  ├─ notification.js
│  │  ├─ sample.js
│  │  ├─ story.js
│  │  └─ user.js
│  ├─ uploads
│  ├─ app.js
│  ├─ db.js
│  └─ package.json
│
├─ react-front
│  ├─ public
│  └─ src
│     ├─ components
│     ├─ utils
│     ├─ App.js
│     └─ index.js
│
├─ readme
│  └─ k_step_logo1.png
│
└─ README.md
```

<br>

---

## 6. 프로젝트 주요 기능

### 회원 기능

* 회원가입
* 로그인 / 로그아웃
* JWT 인증
* 비밀번호 암호화
* 아이디 / 닉네임 중복 체크
* 아이디 찾기 / 비밀번호 찾기
* 프로필 조회 및 수정
* 비공개 계정 설정

<br>

### 피드 기능

* 여행 피드 작성
* 다중 이미지 업로드
* 피드 목록 조회
* 피드 상세 조회
* 지역 / 카테고리 / 해시태그 표시
* 여행 루트 및 장소 정보 표시

<br>

### 댓글 / 좋아요 / 저장 기능

* 댓글 작성 및 삭제
* 좋아요 등록 / 취소
* 저장 등록 / 취소
* 좋아요 수, 저장 수, 댓글 수 반영

<br>

### 팔로우 기능

* 팔로우 / 팔로우 취소
* 팔로워 목록
* 팔로잉 목록
* 추천 여행자 표시

<br>

### 스토리 기능

* 스토리 목록 조회
* 스토리 보기
* 스토리 진행바
* 본 스토리 / 안 본 스토리 구분
* 스토리 본 사람 목록
* 스토리 관리
* 스토리 꾸미기
* 스토리 삭제

<br>

### 채팅 / 알림 기능

* 채팅방 목록
* 메시지 조회
* 메시지 전송
* 알림 목록 조회
* 댓글 / 좋아요 / 팔로우 알림

<br>

### 광고 기능

* 스폰서 광고 목록
* 광고 슬라이드
* 광고 저장
* 광고 숨김
* 광고 상세 이동

<br>

---

## 7. DB 설계

| 테이블명              | 설명        |
| ----------------- | --------- |
| USERS             | 회원 정보     |
| FEED              | 피드 게시글    |
| FEED_IMAGE        | 피드 이미지    |
| ROUTE_SPOT        | 여행 루트 장소  |
| FEED_COMMENT      | 댓글        |
| FEED_LIKE         | 피드 좋아요    |
| FEED_BOOKMARK     | 피드 저장     |
| USER_FOLLOW       | 팔로우       |
| STORY             | 스토리       |
| STORY_TEXT        | 스토리 텍스트   |
| STORY_VIEW        | 스토리 조회 기록 |
| CHAT_ROOM         | 채팅방       |
| CHAT_ROOM_MEMBER  | 채팅방 참여자   |
| CHAT_MESSAGE      | 채팅 메시지    |
| NOTIFICATION      | 알림        |
| SPONSORED_AD      | 스폰서 광고    |
| SPONSORED_AD_SAVE | 광고 저장     |
| AD_REQUEST        | 광고 신청     |
| USER_BLOCK        | 사용자 차단    |

<br>

---

## 8. 실행 방법

### Back-End 실행

```bash
cd express-back
npm install
node app.js
```

<br>

### Front-End 실행

```bash
cd react-front
npm install
npm start
```

<br>

### 환경 변수 설정

`express-back/.env` 파일에 아래 내용을 설정합니다.

```env
DB_USER=KSTEP
DB_PASSWORD=비밀번호
DB_CONNECT_STRING=localhost:1521/XE
JWT_SECRET=JWT_SECRET_KEY
PEXELS_API_KEY=PEXELS_API_KEY
```

`.env` 파일은 보안상 GitHub에 업로드하지 않습니다.

<br>

---

## 9. 발표 PPT 및 시연 영상 링크

| 구분           | 링크     |
| ------------ | ------ |
| 발표 PPT       | 업로드 예정 |
| 시연 영상        | 업로드 예정 |
| DB 설계서       | 업로드 예정 |
| 체크리스트 및 자체평가 | 업로드 예정 |

<br>

---

## 10. 기타 산출물

| 산출물          | 설명                  |
| ------------ | ------------------- |
| DB 설계서       | 테이블 구조 및 컬럼 정의 정리   |
| DB 백업 SQL    | 테이블 생성 및 데이터 백업 SQL |
| 발표 PPT       | 프로젝트 발표 자료          |
| 시연 영상        | 핵심 기능 시연 영상         |
| 체크리스트 및 자체평가 | 프로젝트 검수 및 자체평가 문서   |

<br>

---

## 11. 프로젝트 특징

* 한국 여행을 주제로 한 SNS 서비스
* 사진 중심 SNS에 여행 루트 기능 결합
* 피드, 스토리, 댓글, 좋아요, 저장, 팔로우 기능 구현
* 스토리 본 사람 목록 및 스토리 관리 기능 구현
* React, Node.js, Oracle DB를 연동한 풀스택 개인 프로젝트
* 한국적인 감성의 UI 디자인 적용

<br>

---

## 12. 개선 예정 사항

* 이메일 인증 기반 비밀번호 찾기
* 실시간 채팅 기능 강화
* 지도 API를 활용한 루트 시각화
* 모바일 반응형 최적화
* 관리자 페이지 추가
* 신고 / 차단 기능 고도화

<br>

---

## 13. 느낀 점

이번 프로젝트를 통해 React 화면 구현, Node.js API 설계, Oracle DB 연동, JWT 인증, 이미지 업로드, SNS 기능 구현 흐름을 경험했습니다.

특히 피드, 스토리, 댓글, 좋아요, 저장, 팔로우처럼 서로 연결된 기능을 구현하면서
프론트엔드, 백엔드, DB 설계가 함께 맞아야 서비스가 정상적으로 동작한다는 점을 배웠습니다.

<br>

---

## 14. 참고

본 프로젝트는 개인 학습 및 포트폴리오 목적으로 제작되었습니다.
실제 서비스 적용 시 이메일 인증, 보안 강화, 실시간 통신 기능 등을 추가로 보완할 예정입니다.

# K-STEP

<div align="center">

<img src="./readme/k_step_logo1.png" width="300" alt="K-STEP 대표 이미지"/>

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

또한 국내 사용자뿐만 아니라 한국 여행을 준비하는 외국인 관광객도 사용할 수 있도록
**한국어 버전과 영어 버전**을 함께 지원합니다.

<br>

---

## 2. 개발 기간

**2026.05.27 ~ 2026.06.09**

| 기간                      | 작업 내용                       |
| ----------------------- | --------------------------- |
| 1단계 (26.05.27)          | 프로젝트 주제 선정 및 기획             |
| 2단계 (26.05.28)          | Oracle DB 테이블 설계            |
| 3단계 (26.05.29)          | Node.js + Express API 구현    |
| 4단계 (26.06.01)          | React 화면 및 라우팅 구현           |
| 5단계 (26.06.02~26.06.03) | 피드, 댓글, 좋아요, 저장 기능 구현       |
| 6단계 (26.06.04~26.06.05) | 팔로우, 스토리, 채팅, 알림, 광고 기능 구현  |
| 7단계 (26.06.08)          | UI 디자인 통일 및 오류 수정           |
| 8단계 (26.06.09)          | DB 백업, README, PPT, 시연영상 정리 |

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
├─ docs
│  ├─ K-STEP_Presentation.pptx
│  ├─ K-STEP_Demo.mp4
│  ├─ K-STEP_DB_Design.xlsx
│  └─ K-STEP_Checklist.xlsx
│
├─ db
│  └─ K-STEP_DB_Backup.sql
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

### 댓글 / 좋아요 / 즐겨찾기 기능

* 댓글 작성 및 삭제
* 좋아요 등록 / 취소
* 즐겨찾기 등록 / 취소
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
* 광고(가게) 저장
* 광고 상세 이동

<br>

### 다국어 지원 기능

* 한국어 / 영어 버전 지원
* 외국인 관광객이 한국 여행 정보를 쉽게 확인할 수 있도록 구성
* 여행 피드, 장소 정보, 주요 화면을 영어로도 이용 가능

<br>

---

## 7. 프로젝트 차별점

* 한국 여행을 주제로 한 SNS 플랫폼
* 사진뿐만 아니라 여행 루트와 장소 정보를 함께 기록 가능
* 여러 장의 이미지와 여행 코스를 함께 공유 가능
* 스토리, 팔로우, 좋아요, 저장, 댓글, 채팅, 알림 기능 제공
* 한국어와 영어 버전을 지원하여 국내 사용자와 외국인 관광객 모두 이용 가능
* 한국적인 분위기를 살린 부드럽고 감성적인 UI 디자인 적용
* 스폰서 광고 기능을 통해 여행 관련 가게와 사용자를 연결할 수 있도록 구성

<br>

---

## 8. DB 설계

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

## 9. 발표 PPT 및 시연 영상 링크

| 구분           | 링크                                               |
| ------------ | ------------------------------------------------ |
| 발표 PPT       | [K-STEP 발표 PPT](./docs/K-STEP_Presentation.pptx) |
| 시연 영상        | [K-STEP 시연 영상](./docs/K-STEP_Demo.mp4)           |
| DB 설계서       | [K-STEP DB 설계서](./docs/K-STEP_DB_Design.xlsx)    |
| DB 백업 SQL    | [DB 백업 SQL](./db/K-STEP_DB_Backup.sql)           |

<br>

---


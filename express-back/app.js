const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

// router
const sampleRouter = require("./routes/sample");
const userRouter = require("./routes/user");
const feedRouter = require("./routes/feed");
const notificationRouter = require("./routes/notification");
const chatRouter = require("./routes/chat");
const businessRouter = require("./routes/business");
const storyRouter = require("./routes/story");

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 업로드 이미지 접근 경로
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.'));

app.use("/sample", sampleRouter);
app.use("/user", userRouter);
app.use("/feed", feedRouter);
app.use("/notification", notificationRouter);
app.use("/chat", chatRouter);
app.use("/business", businessRouter);
app.use("/story", storyRouter);

async function startServer() {
    try {
        await db.init();
        console.log('Successfully connected to Oracle database');

        app.listen(3010, () => {
            console.log('Server is running on port 3010');
        });

    } catch (err) {
        console.error('Error connecting to Oracle database. Server not started.', err);
        process.exit(1);
    }
}

startServer();
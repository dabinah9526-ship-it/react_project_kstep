const bcrypt = require("bcrypt");
const db = require("./db");

async function fixPassword() {
    let connection;

    try {
        await db.init();
        connection = await db.getConnection();

        const hashPassword = await bcrypt.hash("1234", 10);

        await connection.execute(
            `
                UPDATE USERS
                SET PASSWORD = :hashPassword
                WHERE PASSWORD = '1234'
            `,
            {
                hashPassword
            }
        );

        await connection.commit();

        console.log("비밀번호 암호화 수정 완료");
        console.log("이제 비밀번호 1234로 로그인하면 됩니다.");

    } catch (err) {
        console.error("비밀번호 수정 중 오류", err);

        if (connection) {
            await connection.rollback();
        }

    } finally {
        if (connection) {
            await connection.close();
        }

        process.exit();
    }
}

fixPassword();
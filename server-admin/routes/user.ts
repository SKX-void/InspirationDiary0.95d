import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import DB from "../../DB/DB";
import Admin from "../config";

const router = express.Router();

// 中间件
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());

// 生成一个 32 字节（256 位）的随机密钥
const _secret = crypto.randomBytes(32).toString('hex');

router.use(session({
    secret: _secret, // 更改为你自己的密钥
    resave: false,
    saveUninitialized: true,
    rolling: true, // 每次请求都重置过期时间
    cookie: { secure: true }, // 设置 session 的有效期为 15 分钟
    // cookie: { } // 如果使用HTTPS，请设置为true
}));

declare module 'express' {
    interface Request {
        session: session.Session & {
            user?: string;
            level?: number;
        };
    }
}
// 处理登录请求
router.post('/user/login', async (req: express.Request<{}, {}, { username: string, password: string }>, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        req.session.user = "none";
        req.session.level = 0;
        res.cookie('user', "none");
        res.redirect('/docIndex');//重定向
        return;
    }

    const user_exist = await userExist(username);
    if (!user_exist) {
        res.json({ msg: '用户名不存在' });
        return;
    }

    const userInfo: false | { user_id: string, level: number } = await checkPassword(username, password);
    if (userInfo) {
        req.session.user = userInfo.user_id;
        req.session.level = userInfo.level;
        res.cookie('user', username, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });
        res.redirect('/docIndex');//重定向
    } else {
        res.json({ msg: '密码错误' });
    }
});

async function userExist(user: string) {
    try {
        const userDB = await DB.getUserDB();
        const res = await userDB.getAsync('SELECT * FROM user_info WHERE name=?', user);
        return !!res;
    } catch (err) {
        console.log("检查用户名失败：" + err);
        return false;
    }
}

async function checkPassword(user: string, password: string): Promise<false | { user_id: string, level: number }> {
    try {
        const userDB = await DB.getUserDB();
        const res: { user_id: string, level: number } = await userDB.getAsync('SELECT * FROM user_info WHERE name=? AND password=?', [user, password]);
        return res;
    } catch (err) {
        console.log("检查密码失败：" + err);
        return false;
    }
}

router.post('/user/register', async (req: express.Request<{}, {}, { username: string, password: string, registrationCode: string }>, res) => {
    const { username, password, registrationCode } = req.body;
    if (await userExist(username)) {
        res.status(400).json({ msg: '用户名已存在' });
        return;
    }
    if (registrationCode !== '0') {
        res.status(400).json({ msg: '注册码错误' });
        return;
    }
    try {
        const userDB = await DB.getUserDB();
        await userDB.runAsync('INSERT INTO user_info (name, password,level) VALUES (?,?,1)', [username, password]);
        res.redirect('/login');//重定向
    } catch (err) {
        console.log("注册失败：" + err);
        res.status(500).json({ msg: '注册失败' + err });
    }
})

// 用户面板
router.get('/dashboard', (req: express.Request, res) => {
    if (req.session.user) {
        res.redirect('/docIndex');//重定向
    } else {
        res.redirect('/login');
    }
});

// 注销
router.get('/logout', (req: express.Request, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.redirect('/login');
        }
        res.clearCookie('user');
        res.redirect('/login');
    });
});

router.get('/login-status', (req: express.Request, res) => {
    if (Admin.config["无登录调试模式"]){
        res.json({ login: true, level: 10 });
        return;
    }
    if (req.session.user && req.session.user != "none") {
        res.json({ login: true, level: req.session.level });
    } else {
        res.json({ login: false, level: 0 });
    }
});
export default router;

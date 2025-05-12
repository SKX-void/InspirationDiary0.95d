import express from 'express';
const router = express.Router();
import cookieParser from 'cookie-parser';
import session from 'express-session';
import bodyParser from 'body-parser';
import crypto from 'crypto';

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

// 模拟用户数据库
interface User {
    [username: string]: string;
}
const users:User = {
    'skx': '0e491c30e1e21a85dd64c63d2513af2c8c474a5a5e38f392ed2b54e21df465a5',
    'test': '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
};

declare module 'express' {
    interface Request {
        session: session.Session & {
            user?: string;
        };
    }
}
// 处理登录请求
router.post('/login', (req:express.Request<{}, {}, { username: string, password: string}>, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    if (!users[username]){
        res.json({msg:'用户名不存在'});
        return;
    }
    if (users[username] === password) {
        req.session.user = username;
        res.cookie('user', username, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true,secure: true });
        res.redirect('/docIndex');//重定向
    } else {
        res.json({msg:'密码错误'});
    }
});

// 用户面板
router.get('/dashboard', (req:express.Request, res) => {
    if (req.session.user) {
        res.redirect('/docIndex');//重定向
    } else {
        res.redirect('/login');
    }
});

// 注销
router.get('/logout', (req:express.Request, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.redirect('/login');
        }
        res.clearCookie('user');
        res.redirect('/login');
    });
});

export default router;

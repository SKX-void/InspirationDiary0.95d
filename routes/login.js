const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');


// 中间件
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());
router.use(session({
    secret: 'your-secret-key', // 更改为你自己的密钥
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // 如果使用HTTPS，请设置为true
}));

// 模拟用户数据库
const users = {
    user1: 'password1',
};

// 登录页面
router.get('/login', (req, res) => {
    res.send(`
        <form action="/login" method="post">
            用户名: <input type="text" name="username"><br>
            密码: <input type="password" name="password"><br>
            <button type="submit">登录</button>
        </form>
    `);
});

// 处理登录请求
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        req.session.user = username;
        res.cookie('user', username, { maxAge: 900000, httpOnly: true });
        res.redirect('/dashboard');//重定向
    } else {
        res.send('用户名或密码错误');
    }
});

// 用户面板
router.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.send(`欢迎, ${req.session.user}!`);
    } else {
        res.redirect('/login');
    }
});

// 注销
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('user');
        res.redirect('/login');
    });
});

// 监听端口
const PORT = process.env.PORT || 3000;
router.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = router;
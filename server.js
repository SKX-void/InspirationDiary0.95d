const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

//加载包
const app = express();//服务器实例

// 使用 body-parser 中间件解析 JSON 请求体
app.use(bodyParser.json());//解析json数据=>req.body
app.use(cors());//允许跨域请求

// 设置静态文件目录（用于提供 index.html）
app.use(express.static(path.join(__dirname, 'public')));//外部访问根目录

app.use(express.json({ limit: '50mb' })); // 设置最大请求体大小为 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const timeout = require('connect-timeout');

const docRoutes = require('./routes/doc');
const titleRoutes = require('./routes/title');
const contentRoutes = require('./routes/page');

app.use('/doc', docRoutes);
app.use('/title', titleRoutes);
app.use('/page', contentRoutes);

//主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/demo', 'index.html'));
});

app.get('/docIndex', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/doc', 'docIndex.html'));
})
app.get('/titleIndex', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/title', 'titleIndex.html'));
})
app.get('/pageIndex', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/page', 'pageIndex.html'));
})
app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/editor', 'editor.html'));
})

const httpPort=3000;
app.listen(httpPort, () => {
    console.log(`Server running on http://localhost:${httpPort}`);
});
// const ip6 ='2001:da8:d806:a001::3eaf';
//https证书

// app.listen(63342, () => {
//     console.log(`Server running on http://localhost:63342`);
// });


const https = require('https');
const fs = require('fs');
const options = {
    key: fs.readFileSync('./ssl/key.pem'), // 私钥文件路径
    cert:fs.readFileSync('./ssl/cert.pem')// 证书文件路径
}
const httpsPort=3001;
https.createServer(options, app).listen(httpsPort,'::', () => {
    console.log(`HTTPS server running on https://[::]:${httpsPort}`);
});
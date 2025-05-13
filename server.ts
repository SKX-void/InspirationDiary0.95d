import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';

const app = express();//服务器实例

app.use(bodyParser.json());//使用 body-parser 中间件解析 JSON 请求体
app.use(cors());//允许跨域请求

app.use(express.json({ limit: '50mb' })); // 设置最大请求体大小为 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));

//login路由
import loginRoutes from './routes/login';
app.use('/', loginRoutes);

//api路由
import docRoutes from './routes/doc';
import titleRoutes from './routes/chapter';
import pageRoutes from './routes/page';
app.use('/doc', docRoutes);
app.use('/chapter', titleRoutes);
app.use('/page', pageRoutes);

const debugHasUser = true;

//主页路由
// 设置静态文件目录（用于提供 index.html）
app.get('/', (req:any, res:any) => {
    if (!req.session.user && debugHasUser) {
        res.redirect('/login');
    } else {
        res.redirect('/docIndex');//重定向
    }
});
//html
app.use('/login',express.static(path.join(__dirname, 'public/login')));//外部访问根目录
app.get('/login', (_, res:any) => {
    res.sendFile(path.join(__dirname, 'public/login', 'login.html'));
});

app.use('/demo',express.static(path.join(__dirname, 'public/demo')));//外部访问根目录
app.get('/demo', (req:any, res:any) => {
    if (!req.session.user && debugHasUser) {
        res.redirect('/login');
        return;
    }
    res.sendFile(path.join(__dirname, 'public/demo', 'index.html'));
});

app.use('/docIndex',express.static(path.join(__dirname, 'public/doc')));//外部访问根目录
app.get('/docIndex', (req:any, res:any) => {
    if (!req.session.user && debugHasUser) {
        res.redirect('/login');
        return;
    }
    res.sendFile(path.join(__dirname, 'public/doc', 'docIndex.html'));
})

app.use('/chapterIndex',express.static(path.join(__dirname, 'public/chapter')));//外部访问根目录
app.get('/chapterIndex', (req:any, res:any) => {
    if (!req.session.user && debugHasUser) {
        res.redirect('/login');
        return;
    }
    res.sendFile(path.join(__dirname, 'public/chapter', 'chapterIndex.html'));
})

app.use('/pageIndex',express.static(path.join(__dirname, 'public/page')));//外部访问根目录
app.get('/pageIndex', (req:any, res:any) => {
    if (!req.session.user && debugHasUser) {
        res.redirect('/login');
        return;
    }
    res.sendFile(path.join(__dirname, 'public/page', 'pageIndex.html'));
})

app.use('/editor',express.static(path.join(__dirname, 'public/editor')));//外部访问根目录
app.get('/editor', (req:any, res:any) => {
    if (!req.session.user && debugHasUser) {
        res.redirect('/login');
        return;
    }
    res.sendFile(path.join(__dirname, 'public/editor', 'editor.html'));
})

const httpPort=65002;
app.listen(httpPort, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${httpPort}`);
});
// const ip6 ='2001:da8:d806:a001::3eaf';
//https证书

import https from 'https';
import fs from 'fs';
const options = {
    key: fs.readFileSync('./ssl/key.pem'), // 私钥文件路径
    cert:fs.readFileSync('./ssl/cert.pem')// 证书文件路径
}
const httpsIpv6Port=65003;
https.createServer(options, app).listen(httpsIpv6Port,'::', () => {
    console.log(`HTTPS server running on https://[::]:${httpsIpv6Port}`);
});
const httpsIpv4Port=65001;
https.createServer(options, app).listen(httpsIpv4Port,'0.0.0.0', () => {
    console.log(`HTTPS server running on https://0.0.0.0:${httpsIpv4Port}`);
});





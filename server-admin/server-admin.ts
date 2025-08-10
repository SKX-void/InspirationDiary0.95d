import express from 'express';
import path from 'path';

import Admin, { serverPrefix } from "./config";

const app = express();//服务器实例

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next)=>{
  console.log(`[所有入站记录]${req.method} ${req.originalUrl}`);
  next();
});


app.get(`${serverPrefix.value}/running`, (_, res) => {
    res.status(200).json({ message: 'running' });
})

//login路由
import loginRoutes from './routes/user';
app.use(`${serverPrefix.value}/`, loginRoutes);

//api路由
import docRoutes from './routes/doc';
import titleRoutes from './routes/chapter';
import pageRoutes from './routes/page';
import historyRoutes from './routes/history';

app.use(`${serverPrefix.value}/api`, (req: any, res: any, next) => {
    if (Admin.config["无登录调试模式"] || (req.session.user && (req.session.level > 0))) {
        return next(); // 已登录，放行所有请求
    }
    return res.status(401).json({ err: "未登录" });
});

app.use(`${serverPrefix.value}/api/doc`, docRoutes);
app.use(`${serverPrefix.value}/api/chapter`, titleRoutes);
app.use(`${serverPrefix.value}/api/page`, pageRoutes);
app.use(`${serverPrefix.value}/api/history`, historyRoutes);

function loginCheck(req: any, res: any, next: any) {
    if (Admin.config["无登录调试模式"] || req.session.user) {
        return next(); // 已登录，放行所有请求
    }
    return res.redirect(`${serverPrefix.value}/login`);
}
app.get(`/`, loginCheck, (_, res) => {
    res.redirect(`${serverPrefix.value}/docIndex`);
})
app.get(`${serverPrefix.value}/`, loginCheck, (_, res) => {
    res.redirect(`${serverPrefix.value}/docIndex`);
})

//#region 静态资源
app.use(`${serverPrefix.value}/login`, express.static(path.join(__dirname, 'public/user')));//外部访问根目录
app.get(`${serverPrefix.value}/login`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/user', 'login.html'));
});
app.use(`${serverPrefix.value}/register`, express.static(path.join(__dirname, 'public/register')));//外部访问根目录
app.get(`${serverPrefix.value}/register`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/user', 'register.html'));
});

app.use(`${serverPrefix.value}/docIndex`, loginCheck, express.static(path.join(__dirname, 'public/doc')));//外部访问根目录
app.get(`${serverPrefix.value}/docIndex`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/doc', 'docIndex.html'));
})

app.use(`${serverPrefix.value}/chapterIndex`, loginCheck, express.static(path.join(__dirname, 'public/chapter')));//外部访问根目录
app.get(`${serverPrefix.value}/chapterIndex`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/chapter', 'chapterIndex.html'));
})

app.use(`${serverPrefix.value}/pageIndex`, loginCheck, express.static(path.join(__dirname, 'public/page')));//外部访问根目录
app.get(`${serverPrefix.value}/pageIndex`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/page', 'pageIndex.html'));
})

app.use(`${serverPrefix.value}/editor`, loginCheck, express.static(path.join(__dirname, 'public/editor')));//外部访问根目录
app.get(`${serverPrefix.value}/editor`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/editor', 'editor.html'));
})

app.use(`${serverPrefix.value}/history`, loginCheck, express.static(path.join(__dirname, 'public/history')));//外部访问根目录
app.get(`${serverPrefix.value}/history`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/history', 'history.html'));
});

app.use(`${serverPrefix.value}/search`, loginCheck, express.static(path.join(__dirname, 'public/search')));//外部访问根目录
app.get(`${serverPrefix.value}/search`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/search', 'search.html'));
});
//#endregion

import https from 'https';
import fs from 'fs';

const options = {//https证书
    key: fs.readFileSync('../ssl/key.pem'), // 私钥文件路径
    cert: fs.readFileSync('../ssl/cert.pem')// 证书文件路径
}
const httpsIpv6Port = 30004;
https.createServer(options, app).listen(httpsIpv6Port, '::', () => {
    console.log(`HTTPS server running on https://[::]:${httpsIpv6Port}`);
});
const httpsIpv4Port = 30003;
https.createServer(options, app).listen(httpsIpv4Port, '0.0.0.0', () => {
    console.log(`HTTPS server running on https://localhost:${httpsIpv4Port}`);
});





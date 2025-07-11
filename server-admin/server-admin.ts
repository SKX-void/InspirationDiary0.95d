import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();//服务器实例

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());//允许跨域请求
//login路由
import loginRoutes from './routes/user';
app.use('/', loginRoutes);

//api路由
import docRoutes from './routes/doc';
import titleRoutes from './routes/chapter';
import pageRoutes from './routes/page';
import historyRoutes from './routes/history';

const config = {
    "无登录调试模式": true, // 是否开启调试模式，需要登录才能访问
}
app.use('/api',(req:any,res:any,next)=>{
    if (config["无登录调试模式"] || (req.session.user && (req.session.level > 0))) {
        return next(); // 已登录，放行所有请求
    }
    return res.status(401).json({err:"未登录"});
});

app.use('/api/doc', docRoutes);
app.use('/api/chapter', titleRoutes);
app.use('/api/page', pageRoutes);
app.use('/api/history', historyRoutes);

//主页路由
// 设置静态文件目录（用于提供 index.html）
// app.get('/', (req:any, res:any) => {
//     if (!(config["无登录调试模式"] || req.session.user)) {
//         res.redirect('/login');
//     } else {
//         res.redirect('/docIndex');//重定向
//     }
// });
function loginCheck(req:any,res:any,next:any){
    if (config["无登录调试模式"] || req.session.user) {
        return next(); // 已登录，放行所有请求
    }
    return res.redirect('/login');
}
//html
app.use('/login',express.static(path.join(__dirname, 'public/user')));//外部访问根目录
app.get('/login', (_, res:any) => {
    res.sendFile(path.join(__dirname, 'public/user', 'login.html'));
});
app.use('/register',express.static(path.join(__dirname, 'public/register')));//外部访问根目录
app.get('/register', (_, res:any) => {
    res.sendFile(path.join(__dirname, 'public/user','register.html'));
});

app.use('/docIndex',loginCheck,express.static(path.join(__dirname, 'public/doc')));//外部访问根目录
app.get('/docIndex', (_, res:any) => {
    res.sendFile(path.join(__dirname, 'public/doc', 'docIndex.html'));
})

app.use('/chapterIndex',loginCheck,express.static(path.join(__dirname, 'public/chapter')));//外部访问根目录
app.get('/chapterIndex', (_, res:any) => {
    res.sendFile(path.join(__dirname, 'public/chapter', 'chapterIndex.html'));
})

app.use('/pageIndex',loginCheck,express.static(path.join(__dirname, 'public/page')));//外部访问根目录
app.get('/pageIndex', (_, res:any) => {
    res.sendFile(path.join(__dirname, 'public/page', 'pageIndex.html'));
})

app.use('/editor',loginCheck,express.static(path.join(__dirname, 'public/editor')));//外部访问根目录
app.get('/editor', (_, res:any) => {
    res.sendFile(path.join(__dirname, 'public/editor', 'editor.html'));
})

app.use('/history',loginCheck,express.static(path.join(__dirname, 'public/history')));//外部访问根目录
app.get('/history', (_, res:any) => {
    res.sendFile(path.join(__dirname, 'public/history', 'history.html'));
});

app.use('/search',loginCheck,express.static(path.join(__dirname, 'public/search')));//外部访问根目录
app.get('/search', (_, res:any) => {
    res.sendFile(path.join(__dirname, 'public/search','search.html'));
});
/* http不兼容cookie会无法登录
* const httpPort=65002;
* app.listen(httpPort, '0.0.0.0', () => {
*     console.log(`HTTP  server running on http://localhost:${httpPort}`);
* });
* const ip6 ='2001:da8:d806:a001::3eaf';
*/

import https from 'https';
import fs from 'fs';
const options = {//https证书
    key: fs.readFileSync('../ssl/key.pem'), // 私钥文件路径
    cert:fs.readFileSync('../ssl/cert.pem')// 证书文件路径
}
const httpsIpv6Port=30005;
https.createServer(options, app).listen(httpsIpv6Port,'::', () => {
    console.log(`HTTPS server running on https://[::]:${httpsIpv6Port}`);
});
const httpsIpv4Port=3003;
https.createServer(options, app).listen(httpsIpv4Port,'0.0.0.0', () => {
    console.log(`HTTPS server running on https://localhost:${httpsIpv4Port}`);
});





import express from 'express';
import path from 'path';


const app = express();//服务器实例

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.get(`${serverPrefix.value}/running`, (_, res) => {
    res.status(200).json({ message: 'running' });
})

//login路由

//api路由
import docRoutes from './routes/doc';
import titleRoutes from './routes/chapter';
import pageRoutes from './routes/page';

app.use('/', (req: any, _, next) => {
    if (req.method === 'GET') {
        return next(); // 放行 GET 请求
    }
});


app.use(`${serverPrefix.value}/api/doc`, docRoutes);
app.use(`${serverPrefix.value}/api/chapter`, titleRoutes);
app.use(`${serverPrefix.value}/api/page`, pageRoutes);


app.get(`/`,  (_, res) => {
    res.redirect(`${serverPrefix.value}/docIndex`);
})
app.get(`${serverPrefix.value}/`,  (_, res) => {
    res.redirect(`${serverPrefix.value}/docIndex`);
})

app.use(`${serverPrefix.value}/docIndex`,  express.static(path.join(__dirname, 'public/doc')));//外部访问根目录
app.get(`${serverPrefix.value}/docIndex`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/doc', 'docIndex.html'));
})

app.use(`${serverPrefix.value}/chapterIndex`,  express.static(path.join(__dirname, 'public/chapter')));//外部访问根目录
app.get(`${serverPrefix.value}/chapterIndex`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/chapter', 'chapterIndex.html'));
})

app.use(`${serverPrefix.value}/pageIndex`,  express.static(path.join(__dirname, 'public/page')));//外部访问根目录
app.get(`${serverPrefix.value}/pageIndex`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/page', 'pageIndex.html'));
})

app.use(`${serverPrefix.value}/editor`,  express.static(path.join(__dirname, 'public/editor')));//外部访问根目录
app.get(`${serverPrefix.value}/editor`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/editor', 'editor.html'));
})

app.use(`${serverPrefix.value}/search`,  express.static(path.join(__dirname, 'public/search')));//外部访问根目录
app.get(`${serverPrefix.value}/search`, (_, res: any) => {
    res.sendFile(path.join(__dirname, 'public/search', 'search.html'));
});
//#endregion

import https from 'https';
import fs from 'fs';
import { serverPrefix } from './config';

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





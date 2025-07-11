import express from 'express';
import fs from 'fs';
import path from "node:path";
// import DB from '../../DB/DB';*
import Customer from '../config';
import {execFile} from "node:child_process";
const router = express.Router();

router.get('/', (_, res) => {
    function scanDirectory(directory: string='../DB/doc/', extension: string='.sqlite'): string[] {
        const filesWithExtension: string[] = [];
        function scan(dir: string) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    scan(fullPath); // 递归进入子目录
                } else if (path.extname(file).toLowerCase() === extension.toLowerCase()) {
                    filesWithExtension.push(fullPath);
                }
            }
        }
        scan(directory);
        return filesWithExtension;
    }
    function removeExtension(files: string[], extension: string): string[] {
        return files.map(file => {
            const fileName = path.basename(file)
            if (fileName.toLowerCase().endsWith(extension.toLowerCase())) {
                return fileName.slice(0, -extension.length);
            }
            return fileName;
        });
    }
    const files = removeExtension(scanDirectory('../DB/doc/', '.sqlite'), '.sqlite');
    const mockRows = files.map((name) => ({
        doc_name: name
    }));
    res.json(mockRows);
});

router.get('/file',(_, res: any,next)=>{
    if (Customer.config["允许下载sqlite"]){
        next();
    }else{
        res.status(403).json({ err: '禁止下载' });
    }
}, 
(req:express.Request<{},{},{},{doc_name:string}>, res: any) => {
    const doc_name = decodeURIComponent(req.query.doc_name);
    if (!fs.existsSync(`../DB/doc/${doc_name}.sqlite`)) {
        return res.status(400).json({ err: '文件不存在' });
    }else {
        res.status(200).download(`../DB/doc/${doc_name}.sqlite`, `${doc_name}.sqlite`);
    }
})

router.get('/file/docx',(_, res: any,next)=>{
    if (Customer.config["允许下载docx"]){
        next();
    }else{
        res.status(403).json({ err: '禁止下载' });
    }
}, 
(req:express.Request<{},{},{},{doc_name:string,index:boolean}>, res: any) => {
    const doc_name = decodeURIComponent(req.query.doc_name);
    if (!fs.existsSync(`../DB/doc/${doc_name}.sqlite`)) {
        return res.status(400).json({ err: '文件不存在' });
    }
    const dbPath = `../DB/doc/${doc_name}.sqlite`;
    const timestamp = Date.now();
    const outputPath = `../DB/output/${doc_name}-${timestamp}.docx`;

    // 如果需要生成目录，则添加 --generate-toc 参数
    const args = ['./py/quill_to_docx.py', dbPath, outputPath];
    if (req.query.index) {
        args.push('--generate-toc');
    }

    execFile('./.venv/Scripts/python', args, (error:any, _, stderr) => {
        if (error) {
            console.error(`执行错误: ${stderr}`);
            return res.status(500).send('生成失败');
        }
        res.status(200).download(outputPath, `${doc_name}-${timestamp}.docx`, () => {
            fs.unlink(outputPath, () => {});
        });
    });
})
export default router;

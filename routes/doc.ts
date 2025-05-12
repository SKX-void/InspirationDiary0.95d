import express from 'express';
const router = express.Router();
import fs from 'fs';
import path from "node:path";
import DB from '../DB/DB';

router.get('/', (_, res) => {
    function scanDirectory(directory: string='./DB/', extension: string='.sqlite'): string[] {
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
    const files = removeExtension(scanDirectory('./DB/', '.sqlite'), '.sqlite');
    const mockRows = files.map((name) => ({
        doc_name: name
    }));
    res.json(mockRows);
});
//增
router.post('/', (req:express.Request<{},{},{doc_name:string}>, res) => {
    const doc_name  = decodeURIComponent(req.body.doc_name);
    DB.createDB(doc_name).then(() => {
        res.status(200).json({ message: '创建成功', doc_name });
    }).catch((err) => {
        res.status(500).json({ message: err.message });
    });
});
//改
router.put('/', (req: express.Request<{},{},{old_doc_name:string,new_doc_name:string}>, res: any) => {
    const oldDocName = decodeURIComponent(req.body.old_doc_name);
    const newDocName = decodeURIComponent(req.body.new_doc_name);
    const baseDir = './DB';
    if(!fs.existsSync(`${baseDir}/${oldDocName}.sqlite`)) {
        res.status(400).json({ message: '旧文件不存在' });
        return;
    }
    if(fs.existsSync(`${baseDir}/${newDocName}.sqlite`)){
        res.status(400).json({ message: '新文件重名' });
        return;
    }
    fs.renameSync(`${baseDir}/${oldDocName}.sqlite`, `${baseDir}/${newDocName}.sqlite`);
    const db = DB.getDB(newDocName);
    if (!db) {
        res.status(400).json({ message: '文件不存在' });
    }else {
        db.run(`UPDATE document_info SET name = ? WHERE doc_id = 1`, [newDocName], function (err) {
            if (err) {
                return res.status(400).json({message: err.message});
            }

            res.json({ message: '修改成功', doc_name: newDocName});
        });
    }
})
router.delete('/', (req:express.Request<{},{},{doc_name:string}>, res: any) => {
    console.log('DELETE doc/');
    const doc_name = decodeURIComponent(req.body.doc_name);
    if (!fs.existsSync(`./DB/${doc_name}.sqlite`)) {
        return res.status(400).json({ message: '文件不存在' });
    }else {
        fs.unlinkSync(`./DB/${doc_name}.sqlite`);
        res.json({ message: '删除成功' });
    }
})

export default router;

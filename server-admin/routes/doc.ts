import express from 'express';
import fs from 'fs';
import path from "node:path";
import DB from '../../DB/DB';
import { execFile } from "node:child_process";
const router = express.Router();

router.get('/', (_, res) => {
    function scanDirectory(directory: string = '../DB/doc/', extension: string = '.sqlite'): string[] {
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
//增
router.post('/', (req: express.Request<{}, {}, { doc_name: string }>, res) => {
    const doc_name = decodeURIComponent(req.body.doc_name);
    DB.createDocDB(doc_name).then(() => {
        res.status(200).json({ msg: `${doc_name}创建成功` });
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ err: err.message });
    });
});
//改
router.put('/', async (req: express.Request<{}, {}, { old_doc_name: string, new_doc_name: string }>, res: any) => {
    const oldDocName = decodeURIComponent(req.body.old_doc_name);
    const newDocName = decodeURIComponent(req.body.new_doc_name);
    const baseDir = './DB/doc';
    if (!fs.existsSync(`${baseDir}/${oldDocName}.sqlite`)) {
        res.status(400).json({ err: '旧文件不存在' });
        return;
    }
    if (fs.existsSync(`${baseDir}/${newDocName}.sqlite`)) {
        res.status(400).json({ err: '新文件重名' });
        return;
    }
    fs.renameSync(`${baseDir}/${oldDocName}.sqlite`, `${baseDir}/${newDocName}.sqlite`);
    try {
        const db = DB.getDocDB(newDocName);
        await db.runAsync(`UPDATE document_info
                           SET name = ?
                           WHERE doc_id = 1`, [newDocName]);
        res.status(200).json({ msg: '修改成功' });
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: '未知错误' });
        }
    }
})
router.delete('/', (req: express.Request<{}, {}, { doc_name: string }>, res: any) => {
    console.log('DELETE doc/');
    const doc_name = decodeURIComponent(req.body.doc_name);
    try {
        if (!fs.existsSync(`../DB/doc/${doc_name}.sqlite`)) {
            return res.status(400).json({ err: '文件不存在' });
        } else {
            fs.unlinkSync(`../DB/doc/${doc_name}.sqlite`);
            res.status(200).json({ msg: '删除成功' });
        }
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: '未知错误' });
        }
    }
});

router.get('/file', (req: express.Request<{}, {}, {}, { doc_name: string }>, res: any) => {
    const doc_name = decodeURIComponent(req.query.doc_name);
    if (!fs.existsSync(`../DB/doc/${doc_name}.sqlite`)) {
        return res.status(400).json({ err: '文件不存在' });
    } else {
        res.status(200).download(`../DB/doc/${doc_name}.sqlite`, `${doc_name}.sqlite`);
    }
})

router.get('/file/docx', (req: express.Request<{}, {}, {}, { doc_name: string, index: boolean }>, res: any) => {
    const doc_name = decodeURIComponent(req.query.doc_name);
    if (!fs.existsSync(`../DB/doc/${doc_name}.sqlite`)) {
        return res.status(400).json({ err: '文件不存在' });
    }
    const dbPath = `../DB/doc/${doc_name}.sqlite`;
    const timestamp = Date.now();
    const outputPath = `../DB/output/${doc_name}-${timestamp}.docx`;

    // 如果需要生成目录，则添加 --generate-toc 参数
    const args = ['../py/quill_to_docx.py', dbPath, outputPath];
    if (req.query.index) {
        args.push('--generate-toc');
    }

    execFile('../.venv/Scripts/python', args, (error: any, _: any, stderr) => {
        if (error) {
            console.error(`执行错误: ${stderr}`);
            return res.status(500).send('生成失败');
        }
        res.status(200).download(outputPath, `${doc_name}-${timestamp}.docx`, () => {
            fs.unlink(outputPath, () => { });
        });
    });
})
export default router;

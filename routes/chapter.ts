import express from 'express';
const router = express.Router();
import DB from '../DB/DB';
router.get('/', (req:express.Request<{},{},{},{doc_name:string}>, res) => {
    const doc_name = decodeURIComponent(req.query.doc_name);
    const db = DB.getDB(doc_name);
    if (!db) {
        res.status(404).json({ message: '文档不存在' });
    }else {
        db.all("SELECT * FROM chapters ORDER BY sort_order", [], (err, rows) => {
            if (err) {
                return res.status(500).json({message: err.message});
            }
            if (!rows) {
                return res.status(200).json({message: '文档为空，无标题'});
            }
            res.json(rows);
        });
    }
});

router.post('/', (req:express.Request<{},{},{doc_name:string,title:string}>, res) => {
    const docName = decodeURIComponent(req.body.doc_name);
    const title = req.body.title;
    const db = DB.getDB(docName);
    if (!db) {
        res.status(404).json({ message: '文档不存在' });
    }else {
        db.get("SELECT MAX(chapter_id) AS max_chapter_id FROM chapters", [], (err, rows: { max_chapter_id: string | null }) => {
            if (err) {
                return res.status(500).json({message: err.message});
            }
            let chapterId;
            if (rows.max_chapter_id == null) chapterId = 1;
            else chapterId = parseInt(rows.max_chapter_id) + 1;
            const sortKey = chapterId * 100;
            db.run("INSERT INTO chapters (title,sort_order) VALUES (?,?)", [title, sortKey], (err) => {
                if (err) {
                    return res.status(500).json({message: err.message});
                }
                db.run("INSERT INTO pages (chapter_id, page_num, format, content, plain_text) VALUES (?,1,'quill',null,'')", [chapterId], (err) => {
                    if (err) {
                        return res.status(500).json({message: err.message});
                    }
                    res.status(200).json({message: '标题添加成功'});
                });
            });
        });
    }
});

router.put('/',(req:express.Request<{},{},{doc_name:string,chapter_id:string,title:string,sort_order:string}>, res:any) => {
    const docName = decodeURIComponent(req.body.doc_name);
    const chapterId = req.body.chapter_id;
    const title = req.body.title;
    const sortOrder = req.body.sort_order;
    const db = DB.getDB(docName);
    if (!db) {
        return res.status(404).json({ message: '文档不存在' });
    }
    db.run("UPDATE chapters SET title = ?, sort_order = ? WHERE chapters.chapter_id = ?", [title, sortOrder, chapterId], (err) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.status(200).json({ message: '标题修改成功' });
    });
})

router.put('/last-page', (req:express.Request<{},{},{doc_name:string,chapter_id:string,last_page:string}>, res:any) => {
    const docName = decodeURIComponent(req.body.doc_name);
    const chapterId = req.body.chapter_id;
    const lastPage = req.body.last_page;
    const db = DB.getDB(docName);
    if (!db) {
        return res.status(404).json({ message: '文档不存在' });
    }
    db.run("UPDATE chapters SET last_page = ? WHERE chapters.chapter_id = ?", [lastPage, chapterId], (err) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.status(200).json({ message: '最后一修改页更新成功' });
    });
});

router.delete('/', (req:express.Request<{},{},{doc_name:string,chapter_id:string}>, res:any) => {
    console.log('DELETE chapters/');
    const docName = decodeURIComponent(req.body.doc_name);
    const chapterId = req.body.chapter_id;
    const db = DB.getDB(docName);
    if (!db) {
        return res.status(404).json({ message: '文档不存在' });
    }
    db.serialize(() => {
        db.run("PRAGMA foreign_keys = ON;");
        db.run("DELETE FROM chapters WHERE chapters.chapter_id = ?", [chapterId], (err) => {
            if (err) {
                return res.status(500).json({message: err.message});
            }
            res.status(200).json({message: '标题删除成功'});
        });
    });
});


export default router;
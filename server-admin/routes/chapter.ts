import express from 'express';
const router = express.Router();
import DB from '../../DB/DB';
router.get('/', async (req: express.Request<{}, {}, {}, { doc_name: string }>, res) => {
    const doc_name = decodeURIComponent(req.query.doc_name);
    try {
        const db = DB.getDocDB(doc_name);
        const chapters = await db.allAsync("SELECT * FROM chapters ORDER BY sort_order", []);
        res.status(200).json(chapters);
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
        }
    }
});

router.post('/', async (req: express.Request<{}, {}, { doc_name: string, title: string }>, res) => {
    const docName = decodeURIComponent(req.body.doc_name);
    const title = req.body.title;
    try {
        const db = DB.getDocDB(docName);
        const chapter = await db.getAsync("SELECT MAX(chapter_id) AS max_chapter_id FROM chapters", []);
        let chapterId;
        if (chapter.max_chapter_id == null) chapterId = 1;
        else chapterId = parseInt(chapter.max_chapter_id) + 1;
        const sortKey = chapterId * 100;
        await db.runAsync("INSERT INTO chapters (title,sort_order) VALUES (?,?)", [title, sortKey]);
        await db.runAsync("INSERT INTO pages (chapter_id, page_num, format, content, plain_text) VALUES (?,1,'quill',null,'')", [chapterId]);
        res.status(200).json({ msg: '章节添加成功' });
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
        }
    }
});

router.put('/', async (req: express.Request<{}, {}, {
    doc_name: string,
    chapter_id: string,
    title: string,
    sort_order: string
}>, res: any) => {
    const docName = decodeURIComponent(req.body.doc_name);
    const chapterId = parseInt(req.body.chapter_id);
    const title = req.body.title;
    const sortOrder = parseFloat(req.body.sort_order);
    try {
        const db = DB.getDocDB(docName);
        await db.runAsync("UPDATE chapters SET title = ?, sort_order = ? WHERE chapters.chapter_id = ?", [title, sortOrder, chapterId]);
        res.status(200).json({ msg: '标题修改成功' });
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
        }
    }
});

router.put('/last-page', async (req: express.Request<{}, {}, {
    doc_name: string,
    chapter_id: string,
    last_page: string
}>, res: any) => {
    const docName = decodeURIComponent(req.body.doc_name);
    const chapterId = parseInt(req.body.chapter_id);
    const lastPage = parseInt(req.body.last_page);
    try {
        const db = DB.getDocDB(docName);
        await db.runAsync("UPDATE chapters SET last_page = ? WHERE chapters.chapter_id = ?", [lastPage, chapterId]);
        res.status(200).json({ msg: '最后一修改页更新成功' });
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
        }
    }
});

router.delete('/', async (req: express.Request<{}, {}, { doc_name: string, chapter_id: string }>, res: any) => {
    const docName = decodeURIComponent(req.body.doc_name);
    const chapterId = parseInt(req.body.chapter_id);
    try {
        const db = DB.getDocDB(docName);
        await db.runAsync("PRAGMA foreign_keys = ON;");
        await db.runAsync("DELETE FROM chapters WHERE chapters.chapter_id = ?", [chapterId]);
        res.status(200).json({ msg: '章节删除成功' });
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
        }
    }
});

router.get('/search', async (req: express.Request<{}, {}, {}, { doc_name: string, keyword: string }>, res: any) => {
    const docName = decodeURIComponent(req.query.doc_name);
    const keyword = req.query.keyword;
    try {
        const db = DB.getDocDB(docName);
        const results = await db.allAsync(`SELECT chapter_id,page_num,snippet(search, 0, '[', ']', '...', 16) AS highlight,bm25(search) AS score 
            FROM search WHERE search MATCH ? ORDER BY score`, [keyword]);
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
        }
    }
});

export default router;
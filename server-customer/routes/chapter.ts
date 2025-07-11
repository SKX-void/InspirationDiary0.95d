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
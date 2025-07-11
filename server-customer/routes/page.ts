import express from 'express';
import DB from '../../DB/DB';

const router = express.Router();

router.get('/', async (req: express.Request<{}, {}, {}, {
    doc_name: string,
    chapter_id: string,
    page_num: string
}>, res:any) => {
    const docName = decodeURIComponent(req.query.doc_name);
    const chapterId = parseInt(req.query.chapter_id);
    const pageNum = parseInt(req.query.page_num);
    try{
        const db = DB.getDocDB(docName);
        const page = await db.getAsync('SELECT * FROM pages WHERE pages.chapter_id =? AND pages.page_num =?', [chapterId, pageNum]);
        if (!page) {
            res.status(404).json({err: "Page not found"});
            return;
        }
        res.status(200).json(page);
    } catch(err){
        console.error(err);
                if (err instanceof Error) {
            res.status(500).json({err: err.message});
        } else {
            res.status(500).json({err: "Unknown error"});
        }
    }
});

router.get('/total', async (req: express.Request<{}, {}, {}, { doc_name: string, chapter_id: string }>, res) => {
    const docName = decodeURIComponent(req.query.doc_name);
    const chapterId = parseInt(req.query.chapter_id);
    try {
        const db = DB.getDocDB(docName);
        const result = await db.getAsync('SELECT MAX(page_num) as total_pages FROM pages WHERE pages.chapter_id =?', [chapterId]);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({err: err.message});
        } else {
            res.status(500).json({err: "Unknown error"});
        }
    }
});

router.get('/search', async (req: express.Request<{}, {}, {}, {
    doc_name: string,
    keyword: string
}>, res) => {
    const docName = req.query.doc_name;
    const keyword = req.query.keyword;
    try {
        const db = DB.getDocDB(docName);

        const result = await db.allAsync(/*sql*/`
        SELECT 
            chapter_id,
            page_num,
            snippet(search, 0, '<span class="preview-highlight">', '</span>', '...', 20) as preview,
            (10 + bm25(search)) as relevance
        FROM search
        WHERE plain_text MATCH ?
        ORDER BY relevance;
    `, [keyword]);
        res.status(200).json(result);
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
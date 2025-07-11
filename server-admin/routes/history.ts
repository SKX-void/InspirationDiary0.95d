import express from 'express';
import DB from '../../DB/DB';
const router = express.Router();

router.get('/total', async (req: express.Request<{}, {}, {}, { doc_name: string }>, res) => {
    try {
        const docName = decodeURIComponent(req.query.doc_name);
        const db = DB.getDocDB(docName);
        const rows = await db.allAsync(`SELECT history_id,chapter_id,page_num,saved_at FROM global_history ORDER BY saved_at DESC`);
        res.json(rows);
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            res.status(500).json({ err: error.message });
        } else {
            res.status(500).json({ err: 'unknown error' });
        }
    }
});

router.get('/page', async (req: express.Request<{}, {}, {}, { doc_name: string, history_id: string }>, res) => {
    try {
        const docName = decodeURIComponent(req.query.doc_name);
        const historyId = parseInt(req.query.history_id);
        const db = DB.getDocDB(docName);
        const row = await db.getAsync(`SELECT content,plain_text FROM global_history WHERE history_id = ?`, [historyId]);
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ err: 'history not found' });
        }
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            res.status(500).json({ err: error.message });
        } else {
            res.status(500).json({ err: 'unknown error' });
        }
    }

});

export default router;
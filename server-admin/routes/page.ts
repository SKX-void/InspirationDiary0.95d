import express from 'express';
import DB from '../../DB/DB';

const router = express.Router();

router.get('/', async (req: express.Request<{}, {}, {}, {
    doc_name: string,
    chapter_id: string,
    page_num: string
}>, res: any) => {
    const docName = decodeURIComponent(req.query.doc_name);
    const chapterId = parseInt(req.query.chapter_id);
    const pageNum = parseInt(req.query.page_num);
    try {
        const db = DB.getDocDB(docName);
        const page = await db.getAsync('SELECT * FROM pages WHERE pages.chapter_id =? AND pages.page_num =?', [chapterId, pageNum]);
        if (!page) {
            res.status(404).json({ err: "Page not found" });
            return;
        }
        res.status(200).json(page);
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
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
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
        }
    }
});

router.post('/', async (req: express.Request<{}, {}, { doc_name: string, chapter_id: string, page_num: string, content: string | null, plain_text: string }>, res) => {
    const docName = decodeURIComponent(req.body.doc_name);
    const chapterId = parseInt(req.body.chapter_id);
    const pageNum = parseInt(req.body.page_num);
    const nextPage = pageNum + 1;
    let content = req.body.content;
    content ??= null;
    let plainText = req.body.plain_text;
    if (!plainText) plainText = "";
    let db = null;
    try {
        db = DB.getDocDB(docName);
        await db.runAsync("BEGIN TRANSACTION");
        const unChanged = await db.allAsync("SELECT page_num FROM pages WHERE chapter_id = ? AND page_num > ? ORDER BY page_num DESC", [chapterId, pageNum]);
        for (const { page_num } of unChanged) {
            await db.runAsync("UPDATE pages SET page_num = page_num + 1 WHERE chapter_id = ? AND page_num = ?", [chapterId, page_num]);
        }
        await db.runAsync("INSERT INTO pages (chapter_id, page_num, content, plain_text, format) VALUES (?, ?, ?, ?, 'quill')", [chapterId, nextPage, content, plainText]);
        await db.runAsync("COMMIT");
        res.status(200).json({ msg: "保存成功", page: nextPage });
    } catch (err) {
        console.error(err);
        if (db) await db.runAsync("ROLLBACK");
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
    page_num: string,
    content: string | null,
    plain_text: string,
    last_local: string,
    current_version: string
}>, res) => {
    const docName = req.body.doc_name;
    const chapterId = parseInt(req.body.chapter_id);
    const pageNum = parseInt(req.body.page_num);
    let content = req.body.content;
    content ??= null;
    const plainText = req.body.plain_text;
    const last_local = parseInt(req.body.last_local);
    const current_version = parseInt(req.body.current_version);
    try {
        const db = DB.getDocDB(docName);
        await db.runAsync("PRAGMA recursive_triggers = ON;");
        const result = await db.runAsync("UPDATE pages SET content=?, plain_text=?, last_local=? WHERE chapter_id =? AND page_num = ? AND current_version=?", [content, plainText, last_local, chapterId, pageNum, current_version]);
        if (result.changes === 0) {
            res.status(409).json({ err: "版本已过时，请重新加载内容或刷新页面后重试。" });
            return;
        }
        res.status(200).json({ msg: "更新成功", page: pageNum });
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
        }
    }
});

router.delete('/', async (req: express.Request<{}, {}, {
    doc_name: string,
    chapter_id: string,
    page_num: string
}>, res) => {
    const docName = req.body.doc_name;
    const chapterId = parseInt(req.body.chapter_id);
    const pageNum = parseInt(req.body.page_num);
    let db = null;
    try {
        db = DB.getDocDB(docName);
        await db.runAsync("BEGIN TRANSACTION");
        await db.runAsync("DELETE FROM pages WHERE chapter_id = ? AND page_num = ?", [chapterId, pageNum]);
        const unChanged = await db.allAsync("SELECT page_num FROM pages WHERE chapter_id = ? AND page_num > ? ORDER BY page_num", [chapterId, pageNum]);
        for (const { page_num } of unChanged) {
            await db.runAsync("UPDATE pages SET page_num = page_num - 1 WHERE chapter_id = ? AND page_num = ?", [chapterId, page_num]);
        }
        await db.runAsync("COMMIT");
        res.status(200).json({ msg: "删除成功", page: pageNum });
    } catch (err) {
        console.error(err);
        if (db) await db.runAsync("ROLLBACK");
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
        }
    }
});

router.get('/version', async (req: express.Request<{}, {}, {}, {
    doc_name: string,
    chapter_id: string,
    page_num: string
}>, res) => {
    const docName = req.query.doc_name;
    const chapterId = parseInt(req.query.chapter_id);
    const pageNum = parseInt(req.query.page_num);
    try {
        const db = DB.getDocDB(docName);
        const result = await db.getAsync('SELECT current_version FROM pages WHERE chapter_id = ? AND page_num = ?', [chapterId, pageNum]);
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

router.post('/append', async (req: express.Request<{}, {}, {}, { doc_name: string, chapter_id: string }>, res) => {
    const docName = req.query.doc_name;
    const chapterId = parseInt(req.query.chapter_id);
    try {
        const db = DB.getDocDB(docName);
        const row = await db.getAsync('SELECT COALESCE(MAX(page_num), 0) as total_pages FROM pages WHERE chapter_id = ?', [chapterId]);
        const nextPage = row.total_pages + 1;
        await db.runAsync("INSERT INTO pages (chapter_id, page_num, content, plain_text, format) VALUES (?, ?, '', '', 'quill')", [chapterId, nextPage]);
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ err: err.message });
        } else {
            res.status(500).json({ err: "Unknown error" });
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

class SearchHealthChecker {
    static async checkHealth(db: DB) {
        try {
            // 检查行数一致性
            const countDiff = await db.getAsync(`
                SELECT 
                    (SELECT COUNT(*) FROM pages) AS pages_count,
                    (SELECT COUNT(*) FROM search) AS search_count,
                    (SELECT COUNT(*) FROM pages p
                     LEFT JOIN search s ON p.chapter_id = s.chapter_id AND p.page_num = s.page_num
                     WHERE s.rowid IS NULL) AS missing_in_search
            `);

            // 检查最后更新时间
            const lastSync = await db.getAsync(`
                SELECT MAX(updated_at) as last_sync FROM (
                    SELECT MAX(saved_at) as updated_at FROM pages
                    UNION
                    SELECT MAX(timestamp) as updated_at FROM search_meta
                )
            `);

            return {
                status: countDiff.missing_in_search === 0 ? 'healthy' : 'needs_repair',
                pages_count: countDiff.pages_count,
                search_count: countDiff.search_count,
                missing_records: countDiff.missing_in_search,
                last_sync: lastSync.last_sync
            };
        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                return { status: 'error', message: err.message };
            } else {
                return { status: 'error', message: 'Unknown error' };
            }
        }
    }

    static async repair(db: DB) {
        await db.runAsync("BEGIN TRANSACTION");

        try {
            // 1. 清空search表
            await db.runAsync("DELETE FROM search");

            // 2. 全量重新同步
            await db.runAsync(`
                INSERT INTO search (plain_text, chapter_id, page_num)
                SELECT plain_text, chapter_id, page_num FROM pages
            `);

            // 3. 更新元数据
            await db.runAsync(`
                INSERT OR REPLACE INTO search_meta (key, value)
                VALUES ('last_sync', datetime('now'))
            `);

            await db.runAsync("COMMIT");
            return true;
        } catch (err) {
            await db.runAsync("ROLLBACK");
            throw err;
        }
    }
}
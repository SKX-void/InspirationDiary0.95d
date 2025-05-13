import express from 'express';
import DB from '../DB/DB';

const router = express.Router();

router.get('/', (req: express.Request<{}, {}, {}, { doc_name: string ,chapter_id: string, page_num: string }>, res) => {
    const docName = decodeURIComponent(req.query.doc_name);
    const chapterId = req.query.chapter_id;
    const pageNum = req.query.page_num;
    const db = DB.getDB(docName);
    if (!db) {
        res.status(500).json({err: "Database not found"});
    }else {
        db.get('SELECT * FROM pages WHERE pages.chapter_id =? AND pages.page_num =?', [chapterId, pageNum], (err: Error | null, row:[]) => {
            if (err) {
                res.status(500).json({err: err.message});
            } else {
                res.status(200).json(row);
            }
        });
    }
});
router.get('/total', (req:express.Request<{},{},{},{doc_name:string, chapter_id:string}>, res) => {
    const docName = decodeURIComponent(req.query.doc_name);
    const chapterId = req.query.chapter_id;
    const db = DB.getDB(docName);
    if (!db) {
        res.status(500).json({err: "Database not found"});
    }else {
        db.get('SELECT MAX(page_num) as total_pages FROM pages WHERE pages.chapter_id =?', [chapterId], (err, row:[]) => {
            if (err) {
                res.status(500).json({err: err.message});
            } else {
                res.status(200).json(row);
            }
        });
    }
});

// router.post('/', (req: express.Request<{}, {}, { doc_name: string, chapter_id: string, page_num: string, content: string | null, plain_text: string }>, res:any) => {
//     const docName = decodeURIComponent(req.body.doc_name);
//     const chapterId = req.body.chapter_id;
//     const pageNum = parseInt(req.body.page_num); // 确保 pageNum 是数字
//     let content = req.body.content || null;
//     let plainText = req.body.plain_text || "";
//     const db = DB.getDB(docName);
//
//     if (!db) {
//         return res.status(500).json({ err: "Database not found" });
//     }
//
//     function rollback(db: any, res: express.Response, err: Error) {
//         db.run("ROLLBACK", (rollbackErr: Error) => {
//             if (rollbackErr) {
//                 console.error("Rollback failed:", rollbackErr.message);
//             }
//             // 清理临时表（可选）
//             db.run("DROP TABLE IF EXISTS temp_page_nums");
//             res.status(500).json({ error: err.message });
//         });
//     }
//
//     db.serialize(() => {
//         db.run("BEGIN TRANSACTION");
//
//         // 1. 创建临时表
//         db.run(`
//             CREATE TEMP TABLE temp_page_nums AS
//             SELECT chapter_id, page_num AS old_page_num, page_num + 1 AS new_page_num
//             FROM pages WHERE chapter_id = ? AND page_num >= ?`,
//             [chapterId, pageNum],
//             (err) => {
//                 if (err) return rollback(db, res, err);
//
//                 // 2. 删除原记录
//                 db.run(`
//                     DELETE FROM pages
//                     WHERE chapter_id = ? AND page_num >= ?`,
//                     [chapterId, pageNum],
//                     (err) => {
//                         if (err) return rollback(db, res, err);
//
//                         // 3. 重新插入数据
//                         db.run(`
//                             INSERT INTO pages (chapter_id, page_num, last_local, format, content, plain_text, current_version)
//                             SELECT
//                                 tp.chapter_id,
//                                 tp.new_page_num,
//                                 p.last_local,
//                                 p.format,
//                                 p.content,
//                                 p.plain_text,
//                                 p.current_version
//                             FROM temp_page_nums tp
//                             JOIN pages p ON
//                                 tp.chapter_id = p.chapter_id
//                                 AND tp.old_page_num = p.page_num`,
//                             (err) => {
//                                 if (err) return rollback(db, res, err);
//
//                                 // 4. 插入新页到目标位置（pageNum）
//                                 db.run(`
//                                     INSERT INTO pages (chapter_id, page_num, format, content, plain_text)
//                                     VALUES (?, ?, 'quill', ?, ?)`,
//                                     [chapterId, pageNum, content, plainText],
//                                     (err) => {
//                                         if (err) return rollback(db, res, err);
//
//                                         // 提交事务并清理临时表
//                                         db.run("COMMIT", (err) => {
//                                             if (err) return rollback(db, res, err);
//                                             db.run("DROP TABLE IF EXISTS temp_page_nums");
//                                             res.status(200).json({ success: true });
//                                         });
//                                     }
//                                 );
//                             }
//                         );
//                     }
//                 );
//             }
//         );
//     });
// });

router.post('/', (req:express.Request<{},{},{doc_name:string, chapter_id:string, page_num:string, content:string|null, plain_text:string}>, res) => {
    const docName = decodeURIComponent(req.body.doc_name);
    const chapterId = req.body.chapter_id;
    const pageNum = req.body.page_num;
    const nextPage = parseInt(pageNum) + 1;
    let content = req.body.content;
    if (!content) content =null;
    let plainText = req.body.plain_text;
    if (!plainText) plainText ="";
    const db = DB.getDB(docName);
    if (!db) {
        res.status(500).json({err: "Database not found"});
    }else {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            db.all("SELECT page_num FROM pages WHERE chapter_id = ? AND page_num > ? ORDER BY page_num DESC",
                [chapterId, pageNum],
                (err, rows: { page_num: number }[]) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({err: err.message});
                    }
                    let error = false;
                    for (const {page_num} of rows) {
                        if (error) break;
                        db.run("UPDATE pages SET page_num = page_num + 1 WHERE chapter_id = ? AND page_num = ?", [chapterId, page_num],
                            (err) => {
                                if (err) {
                                    db.run("ROLLBACK");
                                    error = true;
                                    return res.status(500).json({err: err.message});
                                }
                            }
                        );
                    }
                    db.run("INSERT INTO pages (chapter_id, page_num, content, plain_text, format) VALUES (?, ?, ?, ?, 'quill')",
                        [chapterId, nextPage, content, plainText],
                        function (err) {
                        if(error)return;
                            if (err) {
                                db.run("ROLLBACK");
                                return res.status(500).json({err: err.message});
                            }
                            db.run("COMMIT", () => {
                                res.status(200).json({page: nextPage});
                            });
                        }
                    );
                }
            );
        });


    }
});

router.put('/', (req:express.Request<{},{},{doc_name:string, chapter_id:string, page_num:string, content:string|null, plain_text:string, last_local:string}>, res) => {
    const docName = req.body.doc_name;
    const chapterId = req.body.chapter_id;
    const pageNum = req.body.page_num;
    let content = req.body.content;
    if (!content) content =null;
    const plainText = req.body.plain_text;
    const last_local = req.body.last_local;
    const db = DB.getDB(docName);
    if(db) {
        db.serialize(() => {
            db.run("PRAGMA recursive_triggers = ON;")
            db.run("UPDATE pages SET content=?, plain_text=?, last_local=? WHERE chapter_id =? AND page_num = ?", [content, plainText, last_local, chapterId, pageNum], (err) => {
                if (err) {
                    res.status(500).json({err: err.message});
                } else {
                    res.status(200).json({page_num: pageNum});
                }
            });
        });
    }else{
        res.status(500).json({err: "Database not found"});
    }
});

router.delete('/', (req:express.Request<{},{},{doc_name:string, chapter_id:string, page_num:string}>, res) => {
    const docName = req.body.doc_name;
    const chapterId = req.body.chapter_id;
    const pageNum = parseInt(req.body.page_num);
    const db = DB.getDB(docName);
    if (!db) {
        res.status(500).json({err: "Database not found"});
    }else {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            db.run("DELETE FROM pages WHERE chapter_id = ? AND page_num = ?", [chapterId, pageNum],
                (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({err: err.message});
                    }
                    db.all(
                        "SELECT page_num FROM pages WHERE chapter_id = ? AND page_num > ? ORDER BY page_num",
                        [chapterId, pageNum],
                        (err, rows: { page_num: number }[]) => {
                            if (err) {
                                db.run("ROLLBACK");
                                return res.status(500).json({err: err.message});
                            }
                            let error = false;
                            for (const {page_num} of rows) {
                                if (error) break;
                                db.run("UPDATE pages SET page_num = page_num - 1 WHERE chapter_id = ? AND page_num = ?", [chapterId, page_num],
                                    (err) => {
                                        if (err) {
                                            db.run("ROLLBACK");
                                            error = true;
                                            return res.status(500).json({err: err.message});
                                        }
                                    }
                                );
                            }
                            db.run("COMMIT", () => {
                                if (error) return;
                                return res.status(200).json({page: pageNum});
                            });
                        }
                    );
                }
            )
        });

        // db.serialize(() => {
        //     db.run("BEGIN TRANSACTION");
        //     // 第一步：删除指定页
        //     db.run("DELETE FROM pages WHERE chapter_id = ? AND page_num = ?", [chapterId, pageNum], function (err) {
        //         if (err) {
        //             db.run("ROLLBACK");
        //             return res.status(500).json({err: err.message});
        //         }
        //
        //         // 第二步：获取所有需要更新的页码（按降序）
        //         db.all(
        //             "SELECT page_num FROM pages WHERE chapter_id = ? AND page_num > ? ORDER BY page_num",
        //             [chapterId, pageNum],
        //             async (err, rows: { page_num: number }[]) => {
        //                 if (err) {
        //                     db.run("ROLLBACK");
        //                     return res.status(500).json({err: err.message});
        //                 }
        //                 let error = false
        //                 for (const {page_num} of rows) {
        //                     if (error) {
        //                         return;
        //                     }
        //                     const newPageNum = page_num - 1;
        //
        //                     await DB.__DBSyncRun(db, "UPDATE pages SET page_num = ? WHERE chapter_id = ? AND page_num = ?", [newPageNum, chapterId, page_num],)
        //                         .catch((err) => {
        //                             db.run("ROLLBACK");
        //                             error = true;
        //                             return res.status(500).json({err: err.message});
        //                         });
        //                 }
        //
        //                 db.run("COMMIT", () => {
        //                     res.status(200).json({page: pageNum});
        //                 });
        //             }
        //         );
        //     });
        // });
    }
});

export default router;
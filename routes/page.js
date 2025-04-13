const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./DB/documents.sqlite');

router.get('/', (req, res) => {
    const docId =req.query.doc_id;
    const titleId = req.query.title_id;
    const page = req.query.page;
    db.get('SELECT * FROM contents WHERE doc_id =? AND title_id =? AND page =?', [docId, titleId, page], (err, row) => {
        if (err) {
            res.status(500).json({err: err.message});
        } else {
            res.json(row);
        }
    });
});
router.get('/total', (req, res) => {
    const docId =req.query.doc_id;
    const titleId = req.query.title_id;
    db.get('SELECT MAX(page) as total_pages FROM contents WHERE doc_id =? AND title_id =?', [docId, titleId], (err, row) => {
        if (err) {
            res.status(500).json({err: err.message});
        } else {
            res.status(200).json(row);
        }
    });
});

router.post('/', (req, res) => {
    const docId =req.body.doc_id;
    const titleId = req.body.title_id;
    const page = req.body.page;
    const nextPage = parseInt(req.body.page) + 1;
    let rtf_bytes = req.body.rtf_text;
    if (!rtf_bytes) rtf_bytes =null;
    let text = req.body.text;
    if (!text) text ="";
    db.run("UPDATE contents SET page=page+1 WHERE doc_id =? AND title_id =? AND page > ?", [docId, titleId, page], (err) => {
        if (err) {
            res.status(500).json({err: err.message});
        } else {
            db.run("INSERT INTO contents (doc_id, title_id, page, rtf_bytes, text,last_local) VALUES (?,?,?,?,?, 0)", [docId, titleId, nextPage,rtf_bytes, text], (err) => {
                if (err) {
                    res.status(500).json({err: err.message});
                } else {
                    res.status(200).json({page: nextPage});
                }
            });
        }
    });
});
router.put('/', (req, res) => {
    const docId =req.body.doc_id;
    const titleId = req.body.title_id;
    const page = req.body.page;
    let rtf_bytes = req.body.rtf_text;
    if (!rtf_bytes) rtf_bytes =null;
    const text = req.body.text;
    const last_local = req.body.last_local;
    db.run("UPDATE contents SET rtf_bytes=?, text=?, last_local=? WHERE doc_id =? AND title_id =? AND page = ?", [rtf_bytes, text, last_local, docId, titleId, page], (err) => {
        if (err) {
            res.status(500).json({err: err.message});
        } else {
            res.status(200).json({page: page});
        }
    });
});

router.delete('/', (req, res) => {
    const docId =req.body.doc_id;
    const titleId = req.body.title_id;
    const page = req.body.page;
    db.run("DELETE FROM contents WHERE doc_id =? AND title_id =? AND page = ?", [docId, titleId, page], (err) => {
        if (err) {
            res.status(500).send(err);
        } else {
            db.run("UPDATE contents SET page=page-1 WHERE doc_id =? AND title_id =? AND page > ?", [docId, titleId, page], (err) => {
                if (err) {
                    res.status(500).json({err: err.message});
                } else {
                    res.json({page: page});
                }
            });
        }
    });
});




module.exports = router;
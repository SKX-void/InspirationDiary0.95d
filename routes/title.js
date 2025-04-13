const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./DB/documents.sqlite');

router.get('/', (req, res) => {
    const doc_id = req.query.doc_id;
    db.all("SELECT * FROM titles WHERE doc_id = ?", [doc_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        if (!rows) {
            return res.status(404).json({ message: '文档为空，无标题' });
        }
        res.json(rows);
    });
});

router.post('/', (req, res) => {
    const docId = req.body.doc_id;
    let titleId;
    const newTitleName = req.body.new_title_name;
    let sortKey;
    db.get("SELECT MAX(title_id) AS max_title_id FROM titles WHERE doc_id = ?", [docId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        if(rows.max_title_id == null)titleId=0;
        else titleId = parseInt(rows.max_title_id) + 1;
        sortKey = titleId*100;
        db.run("INSERT INTO titles (doc_id, title_id,title_name,sort_key,last_page) VALUES (?,?,?,?,1)", [docId, titleId, newTitleName, sortKey], (err) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            db.run("INSERT INTO contents (doc_id, title_id, page, rtf_bytes, text, last_local) VALUES (?,?,1,NULL,'',0)", [docId, titleId], (err) => {
                if (err) {
                    return res.status(500).json({message: err.message});
                }
                res.json({message: '标题添加成功'});
            });
        });
    })
});

router.put('/', (req, res) => {
    const docId = req.body.doc_id;
    const titleId = req.body.title_id;
    const titleName = req.body.title_name;
    const sortKey = req.body.sort_key;
    db.run("UPDATE titles SET title_name = ?, sort_key = ? WHERE doc_id = ? AND title_id = ?", [titleName, sortKey, docId, titleId], (err) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json({ message: '标题修改成功' });
    });
})

router.put('/last-page', (req, res) => {
    const docId = req.body.doc_id;
    const titleId = req.body.title_id;
    const lastPage = req.body.last_page;
    db.run("UPDATE titles SET last_page = ? WHERE doc_id = ? AND title_id = ?", [lastPage, docId, titleId], (err) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json({ message: '最后一修改页更新成功' });
    });
});

router.delete('/', (req, res) => {
    const docId = req.body.doc_id;
    const titleId = req.body.title_id;
    db.run("DELETE FROM titles WHERE doc_id = ? AND title_id = ?", [docId, titleId], (err) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json({ message: '标题删除成功' });
    });
});


module.exports = router;
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./DB/documents.sqlite');

//const db = require('../documents.sqlite');

router.get('/', (req, res) => {
    db.all("SELECT doc_id, doc_name FROM documents", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json(rows);
    });
});
//增
router.post('/', (req, res) => {
    const doc_name  = req.body.doc_name;
    db.run(`INSERT INTO documents (doc_name)  VALUES (?)`, [doc_name], function(err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        res.json({ id: this.lastID, doc_name });
    });
});
//改
router.put('/', (req, res) => {
    const oldDocId = req.body.old_doc_id;
    const newDocId = req.body.new_doc_id;
    const docName = req.body.doc_name;
    db.run(`UPDATE documents SET doc_id = ?,doc_name = ? WHERE doc_id = ?`, [newDocId, docName, oldDocId], function(err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        res.json({ id: this.lastID,new_doc_id:newDocId, doc_name:docName });
    });
})
router.delete('/', (req, res) => {
    const doc_id = req.body.doc_id;
    db.run(`DELETE FROM documents WHERE doc_id = ?`, [doc_id], function(err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        res.json({ message: '删除成功' });
    });
})



module.exports = router;
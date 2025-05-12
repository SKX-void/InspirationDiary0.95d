import sqlite3 from 'sqlite3';
import fs from "fs";
export default class DB {
    static async createDB(doc_name:string,path:string='./DB'){
        try {
            const db = new sqlite3.Database(`${path}/${doc_name}.sqlite`);
            const errFunc = (err:Error) => {
                if(err)console.error("创建数据库错误：" + err);
            }
            await DB.__DBSyncRun(db, DB.__strCreateTableDocumentInfo).catch(errFunc);
            await DB.__DBSyncRun(db, DB.__strCreateTableChapters).catch(errFunc);
            await DB.__DBSyncRun(db, DB.__strCreateTablePages).catch(errFunc);
            await DB.__DBSyncRun(db, DB.__strCreateTableGlobalHistory).catch(errFunc);
            await DB.__DBSyncRun(db, DB.__strCreateTriggerPruneGlobalHistory).catch(errFunc);
            await DB.__DBSyncRun(db, DB.__strCreateTriggerSaveGlobalHistory).catch(errFunc);
            await DB.__DBSyncRun(db, DB.__strCreateIndexChapterStructure).catch(errFunc);
            await DB.__DBSyncRun(db, DB.__strCreateVirtualTableSearch).catch(errFunc);
            const initStr = `INSERT INTO document_info (doc_id, name)VALUES (1, '${doc_name}');`;
            await DB.__DBSyncRun(db, initStr).catch(errFunc);
            //console.log("Creating DB for " + `${path}/${doc_name}.sqlite`);
        } catch (error) {
            console.error("创建数据库未知错误：" + error);
        }
    }
    static getDB(doc_name:string,path:string='./DB'):sqlite3.Database|null {
        try {
            if(!fs.existsSync(`${path}/${doc_name}.sqlite`)){
                return null;
            }
            return new sqlite3.Database(`${path}/${doc_name}.sqlite`);
        } catch (error) {
            console.error("打开数据库未知错误：" + error);
            return null;
        }
    }

    static __strCreateTableDocumentInfo=`CREATE TABLE document_info
                (
                    doc_id       INTEGER PRIMARY KEY CHECK (doc_id = 1), -- 强制单文档
                    name         TEXT    NOT NULL,
                    last_chapter INTEGER NOT NULL DEFAULT 1,
                    created_at   DATETIME         DEFAULT CURRENT_TIMESTAMP
                );`;
    static __strCreateTableChapters=`CREATE TABLE chapters
                (
                    chapter_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title      TEXT    NOT NULL,
                    sort_order REAL    NOT NULL UNIQUE,   -- 浮点排序支持拖拽
                    last_page  INTEGER NOT NULL DEFAULT 1 -- 最后编辑页码
                );`;
    static __strCreateTablePages=`CREATE TABLE pages
                (
                    chapter_id      INTEGER NOT NULL REFERENCES chapters(chapter_id) ON DELETE CASCADE,
                    page_num        INTEGER NOT NULL CHECK (page_num > 0),
                    last_local      INTEGER NOT NULL DEFAULT 0, -- 本地最后编辑位置

                    -- 内容存储
                    format          TEXT CHECK (format IN ('rtf', 'quill', 'md')),
                    content         BLOB,
                    plain_text      TEXT    NOT NULL,

                    -- 版本控制
                    current_version INTEGER NOT NULL DEFAULT 1,
                    PRIMARY KEY (chapter_id, page_num)
                );`;
    static __strCreateTableGlobalHistory=`CREATE TABLE global_history
                (
                    history_id INTEGER PRIMARY KEY AUTOINCREMENT, -- 自增序列作为版本标识
                    chapter_id INTEGER NOT NULL,
                    page_num   INTEGER NOT NULL,
                    content    BLOB,
                    plain_text TEXT    NOT NULL,
                    saved_at   DATETIME DEFAULT CURRENT_TIMESTAMP

                    --FOREIGN KEY (chapter_id, page_num) REFERENCES pages
                );`;
    static __strCreateTriggerPruneGlobalHistory=`CREATE TRIGGER prune_global_history
                    AFTER INSERT
                    ON global_history
                BEGIN
                    -- 只保留最新50条记录
                    DELETE
                    FROM global_history
                    WHERE history_id <= (SELECT history_id
                                         FROM (SELECT history_id
                                               FROM global_history
                                               ORDER BY history_id DESC
                                               LIMIT 1 OFFSET 49 -- 找到第50大的ID
                                              )
                                         WHERE history_id IS NOT NULL -- 处理记录不足50条的情况
                    );
                END;`;
    static __strCreateTriggerSaveGlobalHistory=`CREATE TRIGGER save_global_history
                    AFTER UPDATE
                    ON pages
                    FOR EACH ROW
                    WHEN (OLD.content != NEW.content OR OLD.format != NEW.format) -- ✅ 正确位置
                BEGIN
                    INSERT INTO global_history (chapter_id, page_num, content, plain_text)
                    VALUES (OLD.chapter_id,
                            OLD.page_num,
                            OLD.content, -- 保存修改前的内容
                            OLD.plain_text);
                END;`;
    static __strCreateIndexChapterStructure=`CREATE INDEX idx_chapter_structure ON chapters (sort_order);`;
    static __strCreateVirtualTableSearch=`CREATE VIRTUAL TABLE search USING fts5(plain_text );`;

    static __DBSyncRun(db:sqlite3.Database, sql:string, params:any[]|undefined=undefined):Promise<sqlite3.RunResult> {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }
}

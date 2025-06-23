import sqlite3 from 'sqlite3';
import fs from "fs";
export default class DB {
    private readonly db: sqlite3.Database;

    private constructor(db: sqlite3.Database) {
        this.db = db;
    };

    async getAsync(sql: string, params?: any): Promise<any | undefined> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("数据库未连接"));
                return;
            }
            this.db.get(sql, params, (err, row: any | undefined) => {
                if (err) {
                    console.error(`SQL Error: ${err.message}`, {sql, params});
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async runAsync(sql: string, params?: any): Promise<sqlite3.RunResult> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("数据库未连接"));
                return;
            }
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error(`SQL Error: ${err.message}`, {sql, params});
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    async allAsync(sql: string, params?: any): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("数据库未连接"));
                return;
            }
            this.db.all(sql, params, (err, rows: any[]) => {
                if (err) {
                    console.error(`SQL Error: ${err.message}`, {sql, params});
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }


    static async createDocDB(doc_name:string, path:string='./DB/doc'){
        try {
            const sqlite3DB = new sqlite3.Database(`${path}/${doc_name}.sqlite`);
            const db = new DB(sqlite3DB);
            await db.runAsync(DB.__strCreateTableDocumentInfo);
            await db.runAsync(DB.__strCreateTableChapters);
            await db.runAsync(DB.__strCreateTablePages);
            await db.runAsync(DB.__strCreateTableGlobalHistory);
            await db.runAsync(DB.__strCreateTriggerPruneGlobalHistory);
            await db.runAsync(DB.__strCreateIndexChapterStructure);
            await db.runAsync(DB.__strCreateTriggerSaveGlobalHistory);
            await db.runAsync(DB.__strCreateVirtualTableSearch);
            const initStr = `INSERT INTO document_info (doc_id, name)VALUES (1, '${doc_name}');`;
            await db.runAsync(initStr);
        } catch (error) {
            console.error("创建数据库未知错误：" + error);
        }
    }
    static getDocDB(doc_name:string, path:string='./DB/doc'):DB {
        if(!fs.existsSync(`${path}/${doc_name}.sqlite`)){
            throw new Error("数据库不存在");
        }
        try {

            const db = new sqlite3.Database(`${path}/${doc_name}.sqlite`);
            return new DB(db);
        } catch (error) {
            throw new Error("打开数据库失败"+ error)
        }
    }
    static async createUserDB(path: string = './DB/user/user_info.sqlite') {
        try {
            const sqlite3DB = new sqlite3.Database(path);
            const db = new DB(sqlite3DB);
            const errFunc = (err: Error) => {
                if (err) console.error("创建用户数据库错误：" + err);
            }
            const initStr = `
                CREATE TABLE user_info
                (
                    user_id  INTEGER PRIMARY KEY,
                    name     TEXT    NOT NULL,
                    password TEXT    NOT NULL,
                    level    INTEGER NOT NULL DEFAULT 0
                );
            `;
            await db.runAsync(initStr);

        } catch (error) {
            console.error("创建用户数据库未知错误：" + error);
        }
    }
    static async getUserDB(path: string = './DB/user/user_info.sqlite') {
        try {
            if (!fs.existsSync(path)) {
                await this.createUserDB(path);
            }
            const db = new sqlite3.Database(path);
            return new DB(db);
        } catch (error) {
            throw new Error("打开用户数据库未知错误：" + error);
        }
    }

    private static __strCreateTableDocumentInfo=`CREATE TABLE document_info
                (
                    doc_id       INTEGER PRIMARY KEY CHECK (doc_id = 1), -- 强制单文档
                    name         TEXT    NOT NULL,
                    last_chapter INTEGER NOT NULL DEFAULT 1,
                    created_at   DATETIME         DEFAULT CURRENT_TIMESTAMP,
                    CHECK (typeof(last_chapter) = 'integer')
                );`;
    private static __strCreateTableChapters=`CREATE TABLE chapters
                (
                    chapter_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title      TEXT    NOT NULL,
                    sort_order REAL    NOT NULL UNIQUE,   -- 浮点排序支持拖拽
                    last_page  INTEGER NOT NULL DEFAULT 1, -- 最后编辑页码
                    CHECK (typeof(chapter_id) = 'integer'),
                    CHECK (typeof(last_page) = 'integer'),
                    CHECK (typeof(sort_order) = 'real')
                );`;
    private static __strCreateTablePages=`CREATE TABLE pages
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
    private static __strCreateTableGlobalHistory=`CREATE TABLE global_history
                (
                    history_id INTEGER PRIMARY KEY AUTOINCREMENT, -- 自增序列作为版本标识
                    chapter_id INTEGER NOT NULL,
                    page_num   INTEGER NOT NULL,
                    content    BLOB,
                    plain_text TEXT    NOT NULL,
                    saved_at   DATETIME DEFAULT CURRENT_TIMESTAMP
                    CHECK (typeof(chapter_id) = 'integer'),
                    CHECK (typeof(page_num) = 'integer')
                    --FOREIGN KEY (chapter_id, page_num) REFERENCES pages
                );`;
    private static __strCreateTriggerPruneGlobalHistory=`CREATE TRIGGER prune_global_history
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
    private static __strCreateTriggerSaveGlobalHistory=`CREATE TRIGGER save_global_history
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
                    UPDATE pages SET current_version = current_version + 1 WHERE chapter_id = OLD.chapter_id AND page_num = OLD.page_num;
                END;`;
    private static __strCreateIndexChapterStructure=`CREATE INDEX idx_chapter_structure ON chapters (sort_order);`;
    private static __strCreateVirtualTableSearch=`CREATE VIRTUAL TABLE search USING fts5(plain_text );`;

}

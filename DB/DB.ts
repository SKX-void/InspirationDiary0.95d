import sqlite3 from 'sqlite3';
import fs from "fs";
export default class DB {
    private static readonly docPath: string = "../DB/doc";
    private static readonly userDBPath: string = '../DB/user/user_info.sqlite';

    private readonly db: sqlite3.Database;

    private constructor(db: sqlite3.Database) {
        this.db = db;
    };

    async getAsync(sql: string, params?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("数据库未连接"));
                return;
            }
            this.db.get(sql, params, (err, row: Record<any, any>) => {
                if (err) {
                    console.error(`SQL Error: ${err.message}`, { sql, params });
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
                    console.error(`SQL Error: ${err.message}`, { sql, params });
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
                    console.error(`SQL Error: ${err.message}`, { sql, params });
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    static async createDocDB(doc_name: string, path: string = this.docPath) {
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
            await db.runAsync(DB.__strCreateTriggerToUpdateSearchTable);
            const initStr = `INSERT INTO document_info (doc_id, name)VALUES (1, '${doc_name}');`;
            await db.runAsync(initStr);
        } catch (error) {
            console.error("创建数据库未知错误：" + error);
        }
    }

    static getDocDB(doc_name: string, path: string = this.docPath): DB {
        if (!fs.existsSync(`${path}/${doc_name}.sqlite`)) {
            throw new Error("数据库不存在");
        }
        try {

            const db = new sqlite3.Database(`${path}/${doc_name}.sqlite`);
            return new DB(db);
        } catch (error) {
            throw new Error("打开数据库失败" + error)
        }
    }

    static async createUserDB(path: string = this.userDBPath) {
        try {
            const sqlite3DB = new sqlite3.Database(path);
            const db = new DB(sqlite3DB);
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

    static async getUserDB(path: string = this.userDBPath) {
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

    private static readonly __strCreateTableDocumentInfo = /*sql*/`
        CREATE TABLE document_info
            (
                doc_id       INTEGER PRIMARY KEY CHECK (doc_id = 1), -- 强制单文档
                name         TEXT    NOT NULL,
                last_chapter INTEGER NOT NULL DEFAULT 1,
                created_at   DATETIME         DEFAULT CURRENT_TIMESTAMP,
                CHECK (typeof(last_chapter) = 'integer')
            );`;
    private static readonly __strCreateTableChapters = /*sql*/`
        CREATE TABLE chapters
            (
                chapter_id INTEGER PRIMARY KEY AUTOINCREMENT,
                title      TEXT    NOT NULL,
                sort_order REAL    NOT NULL UNIQUE,   -- 浮点排序支持拖拽
                last_page  INTEGER NOT NULL DEFAULT 1, -- 最后编辑页码
                CHECK (typeof(chapter_id) = 'integer'),
                CHECK (typeof(last_page) = 'integer'),
                CHECK (typeof(sort_order) = 'real')
            );`;
    private static readonly __strCreateTablePages = /* sql */`
        CREATE TABLE pages
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
    private static readonly __strCreateTableGlobalHistory = /* sql */`
        CREATE TABLE global_history
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
    private static readonly __strCreateTriggerPruneGlobalHistory = /* sql */`
        CREATE TRIGGER prune_global_history AFTER INSERT ON global_history
        BEGIN
            -- 只保留最新50条记录
            DELETE FROM global_history
            WHERE history_id <= (
                SELECT history_id FROM (
                    SELECT history_id FROM global_history ORDER BY history_id DESC LIMIT 1 OFFSET 49 -- 找到第50大的ID
                )
                WHERE history_id IS NOT NULL -- 处理记录不足50条的情况
            );
        END;`;
    private static readonly __strCreateTriggerSaveGlobalHistory = /* sql */`
        CREATE TRIGGER save_global_history AFTER UPDATE ON pages FOR EACH ROW
        WHEN (OLD.content != NEW.content OR OLD.format != NEW.format) -- ✅ 正确位置
        BEGIN
            INSERT INTO global_history (chapter_id, page_num, content, plain_text)
            VALUES (OLD.chapter_id, OLD.page_num, OLD.content, OLD.plain_text); -- 保存修改前的内容
            UPDATE pages SET current_version = current_version + 1 WHERE chapter_id = OLD.chapter_id AND page_num = OLD.page_num;
        END;

        CREATE TRIGGER save_global_history_del AFTER DELETE ON pages FOR EACH ROW
        BEGIN
            INSERT INTO global_history (chapter_id, page_num, content, plain_text)
            VALUES (OLD.chapter_id, OLD.page_num, OLD.content, OLD.plain_text); -- 保存修改前的内容
        END;`;
    private static readonly __strCreateIndexChapterStructure = /* sql */`
        CREATE INDEX idx_chapter_structure ON chapters (sort_order);
    `;
    private static readonly __strCreateVirtualTableSearch = /* sql */`
        CREATE VIRTUAL TABLE search USING fts5(
            plain_text,
            chapter_id UNINDEXED,  -- 存储但不参与分词
            page_num UNINDEXED,     -- 存储但不参与分词
            tokenize = 'trigram'   -- 支持更好的中文分词
        );`;
    private static readonly __strCreateTriggerToUpdateSearchTable = /* sql */`
        -- 统一更新触发器：处理所有变更情况
        CREATE TRIGGER sync_search_full AFTER UPDATE ON pages FOR EACH ROW
        BEGIN
            -- 删除旧位置记录（如果有）
            DELETE FROM search WHERE chapter_id = OLD.chapter_id AND page_num = OLD.page_num;
            -- 插入新位置记录
            INSERT INTO search(plain_text, chapter_id, page_num)
            VALUES (NEW.plain_text, NEW.chapter_id, NEW.page_num);
        END;

        -- 插入触发器保持不变
        CREATE TRIGGER sync_search_insert AFTER INSERT ON pages FOR EACH ROW
        BEGIN
            INSERT INTO search(plain_text, chapter_id, page_num)
            VALUES (NEW.plain_text, NEW.chapter_id, NEW.page_num);
        END;

        -- 删除触发器保持不变
        CREATE TRIGGER sync_search_delete AFTER DELETE ON pages FOR EACH ROW
        BEGIN
        DELETE FROM search WHERE chapter_id = OLD.chapter_id AND page_num = OLD.page_num;
        END;`;
}

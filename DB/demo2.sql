drop table IF EXISTS contents;
drop table IF EXISTS titles;
drop table IF EXISTS documents;

CREATE TABLE document_info (
                               doc_id INTEGER PRIMARY KEY CHECK (doc_id = 1), -- 强制单文档
                               name TEXT NOT NULL,
                               last_chapter INTEGER NOT NULL DEFAULT 1,
                               created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 章节表（扁平化设计）
CREATE TABLE chapters (
                          chapter_id INTEGER PRIMARY KEY AUTOINCREMENT,
                          title TEXT NOT NULL,
                          sort_order REAL NOT NULL UNIQUE, -- 浮点排序支持拖拽
                          last_page INTEGER NOT NULL DEFAULT 1 -- 最后编辑页码
);

-- 内容表（整合历史管理）
CREATE TABLE pages (
                       chapter_id INTEGER NOT NULL REFERENCES chapters,
                       page_num INTEGER NOT NULL CHECK(page_num > 0),
                       last_local INTEGER NOT NULL DEFAULT 0, -- 本地最后编辑位置

    -- 内容存储
                       format TEXT CHECK(format IN ('rtf','quill','md')),
                       content BLOB,
                       plain_text TEXT NOT NULL,

                       PRIMARY KEY (chapter_id, page_num)
);

-- 新建全局历史表
CREATE TABLE global_history (
                                history_id INTEGER PRIMARY KEY AUTOINCREMENT, -- 自增序列作为版本标识
                                chapter_id INTEGER NOT NULL,
                                page_num INTEGER NOT NULL,
                                content BLOB,
                                plain_text TEXT NOT NULL,
                                saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                                FOREIGN KEY (chapter_id, page_num) REFERENCES pages
);

-- 创建高效清理触发器
CREATE TRIGGER prune_global_history AFTER INSERT ON global_history
BEGIN
    -- 只保留最新50条记录
    DELETE FROM global_history
    WHERE history_id <= (
        SELECT history_id
        FROM (
                 SELECT history_id
                 FROM global_history
                 ORDER BY history_id DESC
                 LIMIT 1 OFFSET 49  -- 找到第50大的ID
             )
        WHERE history_id IS NOT NULL  -- 处理记录不足50条的情况
    );
END;

-- 创建自动保存历史记录的触发器
CREATE TRIGGER save_global_history
    AFTER UPDATE ON pages
    FOR EACH ROW
    WHEN (OLD.content != NEW.content OR OLD.format != NEW.format) -- ✅ 正确位置
BEGIN
    INSERT INTO global_history (chapter_id, page_num, content,plain_text)
    VALUES (
               OLD.chapter_id,
               OLD.page_num,
               OLD.content,  -- 保存修改前的内容
               OLD.plain_text
           );
END;

-- 快速定位章节页
CREATE INDEX idx_chapter_structure ON chapters(sort_order);

-- 支持跨章节搜索
CREATE VIRTUAL TABLE search USING fts5(plain_text);

-- -- FTS5查询（高效）
-- SELECT * FROM pages
-- WHERE rowid IN (
--     SELECT rowid FROM search
--     WHERE plain_text MATCH '数据库设计'
-- );
--
-- -- LIKE查询（低效）
-- SELECT * FROM pages
-- WHERE plain_text LIKE '%数据库设计%';


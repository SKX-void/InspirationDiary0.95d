drop table contents;
drop table titles;
drop table documents;
CREATE TABLE IF NOT EXISTS documents
(
    doc_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS titles
(
    doc_id     INTEGER,
    title_id   INTEGER,
    title_name TEXT    NOT NULL,
    sort_key   INTEGER NOT NULL,
    last_page  INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (doc_id) REFERENCES documents (doc_id) ON DELETE CASCADE,
    PRIMARY KEY (doc_id, title_id)
);

CREATE INDEX idx_titles_sort ON titles (
                                        sort_key
    );

CREATE TABLE IF NOT EXISTS contents
(
    doc_id     INTEGER,
    title_id   INTEGER,-- 外键关联titles.id
    page       INTEGER NOT NULL,
    rtf_bytes  BLOB,
    text       TEXT    NOT NULL,
    last_local INTEGER NOT NULL
        DEFAULT 0,
    FOREIGN KEY (doc_id,title_id) REFERENCES titles (doc_id,title_id) ON DELETE CASCADE,
    PRIMARY KEY (doc_id, title_id, page)
);

CREATE INDEX IF NOT EXISTS idx_contents_id_page ON contents (doc_id, title_id, page);


insert into documents (doc_id, doc_name)
values (1, '');
INSERT INTO titles (doc_id, title_id, sort_key, title_name)
VALUES (1, 0, 0, '0');

INSERT INTO contents (doc_id, title_id, page, rtf_bytes, text)
VALUES (1, 0, 1, NULL, '');

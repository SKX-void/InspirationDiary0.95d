/**
 * 错误处理函数
 * @param {string} info 错误信息前缀
 * @param {Error} error 错误对象
 * @param {string|undefined} message 自定义错误信息
 */
function handleError(info, error, message) {
    let errMsg="no err mag";
    if(error)errMsg=error.message;
    let msg="no msg";
    if(message)msg=message;
    alert(`handleErrorMSG:\nprefix:${info}+\nerr:${errMsg}\nmsg:${msg}`);
}

/**
 * @param {string} docName
 * @param {string} title
 */
async function insertChapter(docName, title) {
    try {
        const response = await fetch(`/api/chapter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_name: docName, title: title })
        });
        const data = await response.json();
        if (!response.ok) {
            handleError('服务器插入章节失败:', new Error(`${response.status}:${data.err}`));
        }
    } catch (error) {
        handleError('插入章节未知错误:', error);
    }
}

/**
 * @param {string} docName
 * @param {string|number} chapterId
 * @param {string} title
 * @param {number|string} sortOrder
 */
async function updateChapter(docName, chapterId, title,sortOrder) {
    try {
        const response = await fetch(`/api/chapter`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_name: docName, chapter_id: chapterId, title: title, sort_order: sortOrder })
        });
        const data = await response.json();
        if (!response.ok) {
            handleError('服务器更新章节失败:', new Error(`${response.status}:${data.err}`));
        }
    } catch (error) {
        handleError('更新章节未知错误:', error);
    }
}

/**
 * @param {string} docName
 * @param {string|number} chapterId
 */
async function deleteChapter(docName, chapterId) {
    try {
        const response = await fetch(`/api/chapter`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_name: docName, chapter_id: chapterId })
        });
        const data = await response.json();
        if (!response.ok) {
            handleError('服务器删除章节失败:', new Error(`${response.status}:${data.err}`));
        }
    } catch (error) {
        handleError('Error deleting Chapter:', error);
    }
}

/**
 * @param {string} docName
 */
async function getChapterList(docName) {
    try {
        const response = await fetch(`/api/chapter?doc_name=${encodeURIComponent(docName)}`);
        const data = await response.json();
        if (!response.ok) {
            handleError('服务器获取章节列表失败:', new Error(`${response.status}:${data.err}`));
            return;
        }
        renderChapterList(data, docName);
    } catch (error) {
        handleError('请求失败:', error);
        document.getElementById('chapterList').innerHTML = '<li>加载标题列表失败，请稍后重试。</li>';
    }
}

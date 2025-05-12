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

// 获取文档列表的函数
async function fetchDocumentList() {
    try {
        const response = await fetch('/doc');
        const docs = await response.json();
        if (!response.ok) {
            handleError("服务器获取文档列表错误：", new Error(`${response.status}: ${docs.err}`));
            const docList = document.getElementById('docList');
            if(docList)docList.innerHTML = '<li>加载文档列表失败，请稍后重试。</li>';
            return;
        }
        renderDocumentList(docs);
    } catch (error) {
        handleError("获取文档列表未知错误：", error);
        const docList = document.getElementById('docList');
        if(docList)docList.innerHTML = '<li>加载文档列表失败，请稍后重试。</li>';
    }
}

/**
 * 修改文档
 * @param {string} oldDocName - 旧文档名称
 * @param {string} newDocName - 新文档名称
 */
async function updateDocument(oldDocName, newDocName) {
    try {
        const response = await fetch('/doc', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_doc_name: oldDocName, new_doc_name: newDocName })
        });
        const data = await response.json();
        if (!response.ok) {
            handleError("服务器修改文档失败", new Error(`${response.status}: ${data.err}`));
        }
    } catch (error) {
        handleError('修改文档未知错误：', error);
    }
}

/**
 * 删除文档
 * @param {string} docName - 文档名称
 */
async function deleteDocument(docName) {
    try {
        const response = await fetch('/doc', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_name: docName })
        });
        const data = await response.json();
        if (!response.ok){
            handleError("服务器删除文档失败：", new Error(`${response.status}: ${data.err}`));
        }
    } catch (error) {
        handleError('删除文档未知错误:', error);
    }
}

/**
 * 插入文档
 * @param {string} docName
 */
async function insertDocument(docName) {
    try {
        const response = await fetch('/doc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_name: docName })
        });
        const data = await response.json();
        if (!response.ok) {
            handleError("服务器插入文档失败：", new Error(`${response.status}: ${data.err}`));
        }
    } catch (error) {
        handleError('插入文档未知错误:', error);
    }
}
// 获取文档列表的函数
async function fetchDocumentList() {
    try {
        const response = await fetch('/doc');
        if (!response.ok) handleError("服务器返回错误：", new Error('无法获取文档列表'));
        const data = await response.json(); // 假设返回的是包含 doc_id 和 doc_name 的数组

        renderDocumentList(data);
    } catch (error) {
        console.error('请求失败:', error);
        document.getElementById('docList').innerHTML = '<li>加载文档列表失败，请稍后重试。</li>';
    }
}

// 修改文档
async function updateDocument(docId, docName) {
    try {
        const response = await fetch('/doc', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_id: docId, doc_name: docName })
        });
        if (!response.ok) handleError("服务器返回错误：", new Error('修改文档失败'));
        return await response.json();
    } catch (error) {
        console.error('Error updating document:', error);
    }
}

// 删除文档
async function deleteDocument(docId) {
    try {
        const response = await fetch('/doc', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_id: docId })
        });
        if (!response.ok) handleError("服务器返回错误：", new Error('删除文档失败'));
        return await response.json();
    } catch (error) {
        console.error('Error deleting document:', error);
    }
}

// 插入新文档
async function insertDocument(docName) {
    try {
        const response = await fetch('/doc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_name: docName })
        });
        if (!response.ok) handleError("服务器返回错误：", new Error('插入文档失败'));
        return await response.json();
    } catch (error) {
        console.error('Error inserting document:', error);
    }
}
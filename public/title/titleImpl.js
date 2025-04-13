
async function insertTitle(docId, titleName) {
    try {
        const response = await fetch(`/title`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_id: docId, new_title_name: titleName })
        });
        if (!response.ok) handleError('服务器回应错误:', new Error('插入标题失败'));
        return await response.json();
    } catch (error) {
        handleError('Error inserting title:', error);
    }
}

async function updateTitle(docId, titleId, titleName) {
    try {
        const response = await fetch(`/title`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_id: docId, title_id: titleId, title_name: titleName })
        });
        if (!response.ok) handleError('服务器回应错误:', new Error('修改标题失败'));
        return await response.json();
    } catch (error) {
        handleError('Error updating title:', error);
    }
}

async function deleteTitle(docId, titleId) {
    try {
        const response = await fetch(`/title`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_id: docId, title_id: titleId })
        });
        if (!response.ok) handleError('服务器回应错误:', new Error('删除标题失败'));
        return await response.json();
    } catch (error) {
        handleError('Error deleting title:', error);
    }
}

async function fetchTitleList(docId) {
    try {
        const response = await fetch(`/title?doc_id=${encodeURIComponent(docId)}`);
        if (!response.ok) handleError('服务器回应错误:', new Error('无法获取标题列表'));
        const data = await response.json();
        renderTitleList(data, docId);
    } catch (error) {
        console.error('请求失败:', error);
        document.getElementById('titleList').innerHTML = '<li>加载标题列表失败，请稍后重试。</li>';
    }
}

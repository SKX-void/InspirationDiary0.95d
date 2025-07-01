window.addEventListener('DOMContentLoaded', async () => {
    //#region Impl 
    function handleError(info: string, error?: Error, message?: string) {
        let errMsg = "no err mag";
        if (error) errMsg = error.message;
        let msg = "no msg";
        if (message) msg = message;
        alert(`handleErrorMSG:\nprefix:${info}+\nerr:${errMsg}\nmsg:${msg}`);
    }
    // 获取文档列表的函数
    async function getDocumentList() {
        try {
            const response = await fetch('/api/doc');
            const docs = await response.json();
            if (!response.ok) {
                handleError("服务器获取文档列表错误：", new Error(`${response.status}: ${docs.err}`));
                const docList = document.getElementById('docList');
                if (docList) docList.innerHTML = '<li>加载文档列表失败，请稍后重试。</li>';
                return;
            }
            renderDocumentList(docs);
        } catch (error) {
            if (error instanceof Error) {
                handleError('获取文档列表错误：', error);
            } else {
                handleError('获取文档列表未知错误, 非法错误信息.');
            }
            const docList = document.getElementById('docList');
            if (docList) docList.innerHTML = '<li>加载文档列表失败，请稍后重试。</li>';
        }
    }

    async function updateDocument(oldDocName: string, newDocName: string) {
        try {
            const response = await fetch('/api/doc', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ old_doc_name: oldDocName, new_doc_name: newDocName })
            });
            const data = await response.json();
            if (!response.ok) {
                handleError("服务器修改文档失败", new Error(`${response.status}: ${data.err}`));
            }
        } catch (error) {
            if (error instanceof Error) {
                handleError('修改文档错误：', error);
            } else {
                handleError('修改文档未知错误, 非法错误信息.');
            }
        }
    }

    async function deleteDocument(docName: string) {
        try {
            const response = await fetch('/api/doc', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doc_name: docName })
            });
            const data = await response.json();
            if (!response.ok) {
                handleError("服务器删除文档失败：", new Error(`${response.status}: ${data.err}`));
            }
        } catch (error) {
            if (error instanceof Error) {
                handleError('删除文档错误：', error);
            } else {
                handleError('删除文档未知错误, 非法错误信息.');
            }
        }
    }

    async function insertDocument(docName: string) {
        try {
            const response = await fetch('/api/doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doc_name: docName })
            });
            const data = await response.json();
            if (!response.ok) {
                handleError("服务器插入文档失败：", new Error(`${response.status}: ${data.err}`));
            }
        } catch (error) {
            if (error instanceof Error) {
                handleError('插入文档错误：', error);
            } else {
                handleError('插入文档未知错误, 非法错误信息.');
            }
        }
    }
    //#endregion

    //#region html
    function renderDocumentList(documents: { doc_name: string }[]) {
        const docListElement = document.getElementById('docList');
        if (!(docListElement instanceof HTMLElement)) {
            console.warn('文档列表元素不存在，无法渲染文档列表。');
            return
        };
        docListElement.innerHTML = ''; // 清空现有内容
        if (documents.length === 0) {
            docListElement.innerHTML = '<li>暂无文档</li>';
            return;
        }
        documents.forEach(doc => {
            const listItem = document.createElement('li');
            listItem.className = 'doc-item';
            listItem.textContent = doc.doc_name;
            listItem.addEventListener('click', () => {
                window.location.href = `/chapterIndex?doc_name=${encodeURIComponent(doc.doc_name)}`;
            });
            listItem.dataset.docName = doc.doc_name;
            docListElement.appendChild(listItem);
        });
    }
    // 页面加载时获取文档列表

    getDocumentList();
    const addDocButton = document.getElementById('addDocButton');
    const addDocModal = document.getElementById('addDocModal');
    const confirmAddDoc = document.getElementById('confirmAddDoc');
    const cancelAddDoc = document.getElementById('cancelAddDoc');
    const newDocInput = document.getElementById('newDocInput');
    if (!(addDocButton instanceof HTMLElement
        && addDocModal instanceof HTMLElement
        && confirmAddDoc instanceof HTMLElement
        && cancelAddDoc instanceof HTMLElement
        && newDocInput instanceof HTMLInputElement)) {
        console.warn('文档列表元素不存在，无法渲染文档列表。');
        return
    };

    addDocButton.addEventListener('click', () => {
        addDocModal.style.display = 'block';
    });
    cancelAddDoc.addEventListener('click', () => {
        addDocModal.style.display = 'none';
        newDocInput.value = '';
    });

    const loginBtn = document.getElementById('login');
    if (!(loginBtn instanceof HTMLElement)) {
        console.warn('登录按钮元素不存在，无法绑定事件。');
        return;
    };
    loginBtn.addEventListener('click', () => {
        window.location.href = '/login';
    });

    confirmAddDoc.addEventListener('click', async () => {
        const docName = newDocInput.value.trim();
        if (!docName) {
            alert('文档名不能为空！');
            return;
        }
        try {
            await insertDocument(docName);
            await getDocumentList();
            addDocModal.style.display = 'none';
            newDocInput.value = '';
        } catch (error) {
            console.error('添加文档失败:', error);
            alert('添加文档失败，请稍后重试。');
        }
    });
    // 右键菜单相关逻辑
    const contextMenu = document.getElementById('contextMenu');
    const editDocOption = document.getElementById('editDocOption');
    const deleteDocOption = document.getElementById('deleteDocOption');
    const downloadDocOption = document.getElementById('downloadDocOption');
    const downloadSqliteOption = document.getElementById('downloadSqliteOption');

    let currentDocName: string = "";
    document.addEventListener('contextmenu', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement
            && contextMenu instanceof HTMLElement)) {
            console.warn('右键菜单元素不存在，无法绑定事件。');
            return
        };
        if (target.classList.contains('doc-item')) {
            event.preventDefault();
            currentDocName = target.dataset.docName ?? "";
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${event.pageX}px`;
            contextMenu.style.top = `${event.pageY}px`;
        } else {
            contextMenu.style.display = 'none';
        }
    });
    document.addEventListener('click', () => {
        if (!(contextMenu instanceof HTMLElement)) {
            console.warn('右键菜单元素不存在，无法绑定事件。');
            return
        };
        contextMenu.style.display = 'none';
    });
    // 修改文档模态框
    const editDocModal = document.getElementById('editDocModal');
    const editDocName = document.getElementById('editDocName');
    const confirmEditDoc = document.getElementById('confirmEditDoc');
    const cancelEditDoc = document.getElementById('cancelEditDoc');
    if (!(editDocOption instanceof HTMLElement
        && contextMenu instanceof HTMLElement
        && editDocModal instanceof HTMLElement
        && editDocName instanceof HTMLInputElement
        && confirmEditDoc instanceof HTMLElement
        && cancelEditDoc instanceof HTMLElement)) {
        console.warn('编辑文档元素不存在，无法绑定事件。');
        return
    };
    editDocOption.addEventListener('click', () => {
        editDocName.value = currentDocName;
        editDocModal.style.display = 'block';
        contextMenu.style.display = 'none';
    });
    cancelEditDoc.addEventListener('click', () => {
        editDocModal.style.display = 'none';
        editDocName.value = '';
    });
    confirmEditDoc.addEventListener('click', async () => {
        const newDocName = editDocName.value.trim();
        if (!newDocName) {
            alert('文档名不能为空！');
            return;
        }
        try {
            await updateDocument(currentDocName, newDocName);
            await getDocumentList();
            editDocModal.style.display = 'none';
        } catch (error) {
            console.error('修改文档失败:', error);
            alert('修改文档失败，请稍后重试。');
        }
    });
    // 删除文档模态框
    const deleteDocModal = document.getElementById('deleteDocModal');
    const confirmDeleteDoc = document.getElementById('confirmDeleteDoc');
    const cancelDeleteDoc = document.getElementById('cancelDeleteDoc');
    if (!(deleteDocOption instanceof HTMLElement
        && contextMenu instanceof HTMLElement
        && deleteDocModal instanceof HTMLElement
        && confirmDeleteDoc instanceof HTMLElement
        && cancelDeleteDoc instanceof HTMLElement)) {
        console.warn('删除文档元素不存在，无法绑定事件。');
        return
    };
    deleteDocOption.addEventListener('click', () => {
        const deleteDocMessage = document.getElementById('deleteDocMessage');
        if (!(deleteDocMessage instanceof HTMLElement)) {
            console.warn('删除文档提示元素不存在，无法渲染提示信息。');
            return
        };
        deleteDocMessage.textContent = `确定要删除文档 "${currentDocName}" 吗？`;
        deleteDocModal.style.display = 'block';
        contextMenu.style.display = 'none';
    });
    cancelDeleteDoc.addEventListener('click', () => {
        deleteDocModal.style.display = 'none';
    });
    confirmDeleteDoc.addEventListener('click', async () => {
        try {
            await deleteDocument(currentDocName);
            await getDocumentList();
            deleteDocModal.style.display = 'none';
        } catch (error) {
            console.error('删除文档失败:', error);
            alert('删除文档失败，请稍后重试。');
        }
    });
    // 下载docx文档
    async function downloadBlob(response: Response, filename: string) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
    }
    function checkFileName(response: Response): string {
        const disposition = response.headers.get('Content-Disposition');
        if (disposition?.includes('filename=')) {
            const fileNameMatch = /filename="?([^"]+)"?/.exec(disposition);
            if (fileNameMatch?.[1]) {
                if (fileNameMatch[1].startsWith("UTF-8''")) {
                    return decodeURIComponent(fileNameMatch[1].replace("UTF-8''", ""));
                }
            }
        }
        return "";
    }
    if (!(downloadDocOption instanceof HTMLElement)) {
        console.warn('下载文档元素不存在，无法绑定事件。');
        return
    };
    downloadDocOption.addEventListener('click', async () => {
        try {
            const url = `/api/doc/file/docx?doc_name=${encodeURIComponent(currentDocName)}`;
            const response = await fetch(url);
            if (!response.ok) {
                // 网络错误或 4xx/5xx 错误
                const json = await response.json();
                throw new Error(json.err);
            }
            // 检查 Content-Type 或 X-File-Download 判断是否是文件流
            const contentType = response.headers.get('Content-Type');
            if (contentType !== 'application/json') {
                // 处理文件下载
                let filename = checkFileName(response);
                if (!filename) filename = `${currentDocName}.sqlite`;
                await downloadBlob(response, filename);
            } else {
                // 如果后端返回了 JSON，说明可能有错误（虽然 status 是 200）
                const json = await response.json();
                throw new Error(json.err);
            }
        } catch (error) {
            if (error instanceof Error) {
                handleError('下载文档失败。', error);
            } else {
                handleError('下载文档未知错误。');
            }
        }
    });
    // 下载原始文件
    if (!(downloadSqliteOption instanceof HTMLElement)) {
        console.warn('下载原始文件元素不存在，无法绑定事件。');
        return
    };
    downloadSqliteOption.addEventListener('click', async () => {
        try {
            const url = `/api/doc/file?doc_name=${encodeURIComponent(currentDocName)}`;
            const response = await fetch(url);
            if (!response.ok) {
                const json = await response.json();
                throw new Error(json.err);
            }
            // 检查 Content-Type 或 X-File-Download 判断是否是文件流
            const contentType = response.headers.get('Content-Type');
            const isFileDownload = contentType !== 'application/json';

            if (isFileDownload) {
                // 处理文件下载
                let filename = checkFileName(response);
                if (!filename) filename = `${currentDocName}.sqlite`;
                await downloadBlob(response, filename);
            } else {
                // 如果后端返回了 JSON，说明可能有错误（虽然 status 是 200）
                const json = await response.json();
                throw new Error(json.err);
            }

        } catch (error) {
            if (error instanceof Error) {
                handleError('下载文档失败。', error);
            } else {
                handleError('下载文档未知错误。');
            }
        }
    });
});
//#endregion
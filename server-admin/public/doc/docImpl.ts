import { serverPrefix } from "../../config";
class DocApi {
    static handleError(info: string, error?: Error, message?: string) {
        let errMsg = "no err mag";
        if (error) errMsg = error.message;
        let msg = "no msg";
        if (message) msg = message;
        alert(`handleErrorMSG:\nprefix:${info}+\nerr:${errMsg}\nmsg:${msg}`);
    }

    static async getDocumentList() {
        try {
            const response = await fetch(`${serverPrefix.value}/api/doc`);
            const docs = await response.json();
            if (!response.ok) {
                DocApi.handleError("服务器获取文档列表错误：", new Error(`${response.status}: ${docs.err}`));
                const docList = document.getElementById('docList');
                if (docList) docList.innerHTML = '<li>加载文档列表失败，请稍后重试。</li>';
                return;
            }
            DocApi.renderDocumentList(docs);
        } catch (error) {
            if (error instanceof Error) {
                DocApi.handleError('获取文档列表错误：', error);
            } else {
                DocApi.handleError('获取文档列表未知错误, 非法错误信息.');
            }
            const docList = document.getElementById('docList');
            if (docList) docList.innerHTML = '<li>加载文档列表失败，请稍后重试。</li>';
        }
    }

    static async updateDocument(oldDocName: string, newDocName: string) {
        try {
            const response = await fetch(`${serverPrefix.value}/api/doc`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ old_doc_name: oldDocName, new_doc_name: newDocName })
            });
            const data = await response.json();
            if (!response.ok) {
                DocApi.handleError("服务器修改文档失败", new Error(`${response.status}: ${data.err}`));
            }
        } catch (error) {
            if (error instanceof Error) {
                DocApi.handleError('修改文档错误：', error);
            } else {
                DocApi.handleError('修改文档未知错误, 非法错误信息.');
            }
        }
    }

    static async deleteDocument(docName: string) {
        try {
            const response = await fetch(`${serverPrefix.value}/api/doc`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doc_name: docName })
            });
            const data = await response.json();
            if (!response.ok) {
                DocApi.handleError("服务器删除文档失败：", new Error(`${response.status}: ${data.err}`));
            }
        } catch (error) {
            console.error('删除文档失败:', error);
            if (error instanceof Error) {
                DocApi.handleError('删除文档错误：', error);
            } else {
                DocApi.handleError('删除文档未知错误, 非法错误信息.');
            }
        }
    }

    static async insertDocument(docName: string) {
        try {
            const response = await fetch(`${serverPrefix.value}/api/doc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doc_name: docName })
            });
            const data = await response.json();
            if (!response.ok) {
                DocApi.handleError("服务器插入文档失败：", new Error(`${response.status}: ${data.err}`));
            }
        } catch (error) {
            if (error instanceof Error) {
                DocApi.handleError('插入文档错误：', error);
            } else {
                DocApi.handleError('插入文档未知错误, 非法错误信息.');
            }
        }
    }

    private static renderDocumentList(documents: { doc_name: string }[]) {
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
                window.location.href = `${serverPrefix.value}/chapterIndex?doc_name=${encodeURIComponent(doc.doc_name)}`;
            });
            listItem.dataset.docName = doc.doc_name;
            docListElement.appendChild(listItem);
        });
    }
}

class DOMUtils {

    static async downloadBlob(response: Response, filename: string) {
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

    static checkFileName(response: Response): string {
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
}
class DocDomBinder {
    static addDocDiv() {
        const addDocButton = document.getElementById('addDocButton');
        const addDocModal = document.getElementById('addDocModal');
        if (!(addDocButton instanceof HTMLElement
            && addDocModal instanceof HTMLElement)) {
            console.warn('添加文档按钮元素不存在，无法绑定事件。');
            return;
        };
        addDocButton.addEventListener('click', () => {
            addDocModal.style.display = 'block';
        });

        const cancelAddDoc = document.getElementById('cancelAddDoc');
        const newDocInput = document.getElementById('newDocInput');
        if (!(cancelAddDoc instanceof HTMLElement
            && newDocInput instanceof HTMLInputElement)) {
            console.warn('取消添加文档按钮元素不存在，无法绑定事件。');
            return;
        };
        cancelAddDoc.addEventListener('click', () => {
            addDocModal.style.display = 'none';
            newDocInput.value = '';
        });

        const confirmAddDoc = document.getElementById('confirmAddDoc');
        if (!(confirmAddDoc instanceof HTMLElement)) {
            console.warn('文档列表元素不存在，无法渲染文档列表。');
            return
        };
        confirmAddDoc.addEventListener('click', async () => {
            const docName = newDocInput.value.trim();
            if (!docName) {
                alert('文档名不能为空！');
                return;
            }
            try {
                await DocApi.insertDocument(docName);
                await DocApi.getDocumentList();
                addDocModal.style.display = 'none';
                newDocInput.value = '';
            } catch (error) {
                console.error('添加文档失败:', error);
                alert('添加文档失败，请稍后重试。');
            }
        });
    }

    static contextMenu() {
        // 右键菜单相关逻辑
        let currentDocName: string = "";
        const contextMenu = document.getElementById('contextMenu') as HTMLElement;
        document.addEventListener('contextmenu', (event) => {
            const target = event.target as HTMLElement;
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
            contextMenu.style.display = 'none';
        });

        const editDocOption = document.getElementById('editDocOption') as HTMLElement;
        const editDocName = document.getElementById('editDocName') as HTMLInputElement;
        const editDocModal = document.getElementById('editDocModal') as HTMLElement;
        editDocOption.addEventListener('click', () => {
            editDocName.value = currentDocName;
            editDocModal.style.display = 'block';
            contextMenu.style.display = 'none';
        });

        const cancelEditDoc = document.getElementById('cancelEditDoc') as HTMLElement;
        cancelEditDoc.addEventListener('click', () => {
            editDocModal.style.display = 'none';
            editDocName.value = '';
        });

        const confirmEditDoc = document.getElementById('confirmEditDoc') as HTMLElement;
        confirmEditDoc.addEventListener('click', async () => {
            const newDocName = editDocName.value.trim();
            if (!newDocName) {
                alert('文档名不能为空！');
                return;
            }
            try {
                await DocApi.updateDocument(currentDocName, newDocName);
                await DocApi.getDocumentList();
                editDocModal.style.display = 'none';
            } catch (error) {
                console.error('修改文档失败:', error);
                alert('修改文档失败，请稍后重试。');
            }
        });

        const deleteDocOption = document.getElementById('deleteDocOption') as HTMLElement;
        const deleteDocModal = document.getElementById('deleteDocModal') as HTMLElement;
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

        const cancelDeleteDoc = document.getElementById('cancelDeleteDoc') as HTMLElement;
        const confirmDeleteDoc = document.getElementById('confirmDeleteDoc') as HTMLElement;
        cancelDeleteDoc.addEventListener('click', () => {
            deleteDocModal.style.display = 'none';
        });
        confirmDeleteDoc.addEventListener('click', async () => {
            try {
                await DocApi.deleteDocument(currentDocName);
                await DocApi.getDocumentList();
                deleteDocModal.style.display = 'none';
            } catch (error) {
                console.error('删除文档失败:', error);
                alert('删除文档失败，请稍后重试。');
            }
        });

        const downloadDocOption = document.getElementById('downloadDocOption') as HTMLElement;
        downloadDocOption.addEventListener('click', async () => {
            try {
                const url = `${serverPrefix.value}/api/doc/file/docx?doc_name=${encodeURIComponent(currentDocName)}`;
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
                    let filename = DOMUtils.checkFileName(response);
                    if (!filename) filename = `${currentDocName}.sqlite`;
                    await DOMUtils.downloadBlob(response, filename);
                } else {
                    // 如果后端返回了 JSON，说明可能有错误（虽然 status 是 200）
                    const json = await response.json();
                    throw new Error(json.err);
                }
            } catch (error) {
                if (error instanceof Error) {
                    DocApi.handleError('下载文档失败。', error);
                } else {
                    DocApi.handleError('下载文档未知错误。');
                }
            }
        });

        const downloadSqliteOption = document.getElementById('downloadSqliteOption') as HTMLElement;
        downloadSqliteOption.addEventListener('click', async () => {
            try {
                const url = `${serverPrefix.value}/api/doc/file?doc_name=${encodeURIComponent(currentDocName)}`;
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
                    let filename = DOMUtils.checkFileName(response);
                    if (!filename) filename = `${currentDocName}.sqlite`;
                    await DOMUtils.downloadBlob(response, filename);
                } else {
                    // 如果后端返回了 JSON，说明可能有错误（虽然 status 是 200）
                    const json = await response.json();
                    throw new Error(json.err);
                }
            } catch (error) {
                if (error instanceof Error) {
                    DocApi.handleError('下载文档失败。', error);
                } else {
                    DocApi.handleError('下载文档未知错误。');
                }
            }
        });
    }

    static loginDiv() {
        const loginBtn = document.getElementById('login') as HTMLElement;
        loginBtn.addEventListener('click', () => {
            window.location.href = `${serverPrefix.value}/login`;
        });
    }
}
//#region html
window.addEventListener('DOMContentLoaded', async () => {
    
    await DocApi.getDocumentList();
    DocDomBinder.addDocDiv();
    DocDomBinder.contextMenu();
    DocDomBinder.loginDiv();
});
//#endregion
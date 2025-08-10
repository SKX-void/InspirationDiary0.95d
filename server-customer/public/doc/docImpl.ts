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

}
//#region html
window.addEventListener('DOMContentLoaded', async () => {
    
    await DocApi.getDocumentList();
    DocDomBinder.contextMenu();
});
//#endregion
interface Window {
    getQueryParameter: (name: string) => string;
    quill: Quill;
}
class PageImpl {

    static handleError(info: string, error?: Error, message?: string) {
        let errMsg = "no err mag";
        if (error) errMsg = error.message;
        let msg = "no msg";
        if (message) msg = message;
        alert(`handleErrorMSG:\nprefix:${info}+\nerr:${errMsg}\nmsg:${msg}`);
    }


    static async loadPage(docName: string, chapterId: number, pageNum: number) {
        try {
            let checkedPageNum = pageNum;
            const prevPageBtn = document.getElementById('prev-page-btn');
            if (!(prevPageBtn instanceof HTMLButtonElement)) {
                console.error("缺少元素 prev-page-btn");
                return;
            };

            await this.getTotalPages(docName, chapterId);

            const totalPages = parseInt(document.getElementById('total-pages')?.dataset.value ?? "0");
            const nextPageBtn = document.getElementById('next-page-btn');
            if (!(nextPageBtn instanceof HTMLButtonElement)) {
                console.error("缺少元素 next-page-btn");
                return
            };
            if (checkedPageNum >= totalPages) {
                checkedPageNum = totalPages;
                nextPageBtn.disabled = true;
            } else {
                nextPageBtn.disabled = false;
            }
            const pageInput = document.getElementById('page-input');
            if (!(pageInput instanceof HTMLInputElement)) {
                console.error("缺少元素 page-input");
                return
            };

            pageInput.textContent = checkedPageNum.toString();
            pageInput.value = `${checkedPageNum}`;
            const response = await fetch(`/api/page?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}&page_num=${checkedPageNum}`);
            const data = await response.json();
            if (!response.ok) {
                window.quill.setText("加载页面失败！" + data.err);
                window.quill.disable();
                return;
            }
            window.current_version = data.current_version;
            const quillBytes = data.content;
            if (quillBytes) window.quill.setContents(JSON.parse(quillBytes));
            else window.quill.setText(data.plain_text);
            const last_local = data.last_local;
            if (last_local) window.quill.setSelection(last_local, 0);
            window.quill.enable();
            window.quillTextChange = false;
            const textChangeElement = document.getElementById('textChange');
            if (!(textChangeElement instanceof HTMLElement)) {
                console.error("缺少元素 textChange");
                return
            };
            textChangeElement.textContent = '💾：✅';
            await this.updateChapterLastPage(docName, chapterId, checkedPageNum);
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                this.handleError('Error loading page:', error, `From loadPage(${docName},${chapterId},${pageNum})`);
            } else {
                this.handleError('Error loading page:', new Error("unknown error"), `From loadPage(${docName},${chapterId},${pageNum})`);
            }
        }
    }

    static async insertPageAtEndOf() {
        const docName = window.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = parseInt(window.getQueryParameter('chapter_id')); // 从 URL 中获取 chapterId
        const currentPage = window.getQueryParameter('page_num'); // 从 URL 中获取 lastPage
        if (!docName || !chapterId || !currentPage) {
            console.error("缺少必要参数 doc_name, chapter_id, page_num");
            return;
        }
        const response = await fetch(`/api/page`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doc_name: docName,
                chapter_id: chapterId,
                page_num: currentPage
            })
        });
        const data = await response.json();
        if (!response.ok) {
            console.error(response);
            this.handleError("服务器插入页面操作失败：", new Error(`${response.status}:${data.err}`), `:FROM insertPageAtEndOf()${currentPage}`);
            return;
        }
        const nextPage = parseInt(currentPage) + 1;
        await this.goToPage(docName, chapterId, nextPage, window.quillTextChange);
    }

    static async deletePageAt() {
        const docName = window.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = parseInt(window.getQueryParameter('chapter_id')); // 从 URL 中获取 chapterId
        const currentPage = window.getQueryParameter('page_num'); // 从 URL 中获取 lastPage
        if (parseInt(currentPage) === 1 && parseInt(document.getElementById('total-pages')?.dataset.value ?? "0") === 1) {
            window.quill.root.innerHTML = '';
            if(window.quill.isEnabled())await this.updatePage();
            return;
        }
        try {
            const response = await fetch(`/api/page`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ doc_name: docName, chapter_id: chapterId, page_num: currentPage })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error(response);
                this.handleError("服务器删除页面操作失败：", new Error(`${data.status}:${data.err}`), `FROM deletePageAt()${currentPage}`);
                return;
            }
            let toPage;
            if (parseInt(currentPage) > 1) {
                toPage = (parseInt(currentPage) - 1);
            } else {
                toPage = 1;
            }
            await this.goToPage(docName, chapterId, toPage, false);
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                this.handleError('Error deleting pageNum:', error);
            } else {
                this.handleError('Error deleting pageNum:', new Error("unknown error"));
            }
        }
    }

    static async goToPageOffset(offset: number) {
        const docName = window.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = parseInt(window.getQueryParameter('chapter_id')); // 从 URL 中获取 chapterId
        const page = parseInt(window.getQueryParameter('page_num')) + offset; // 从 URL 中获取 lastPage
        await this.goToPage(docName, chapterId, page, window.quillTextChange);
    }

    static async updatePage() {
        SaveCartoon.onSaving()
        const docName = window.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = window.getQueryParameter('chapter_id'); // 从 URL 中获取 chapterId
        const pageNum = window.getQueryParameter('page_num'); // 从 URL 中获取 lastPage
        if (!docName || !chapterId || !pageNum) {
            console.error("缺少必要参数 doc_name, chapter_id, page_num");
            return false;
        }
        try {
            const quillText = window.quill.getContents();
            const text = window.quill.getText();
            const selection = window.quill.getSelection();
            const last_local = selection ? selection.index : 0;
            const response = await fetch(`/api/page`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    doc_name: docName,
                    chapter_id: chapterId,
                    page_num: pageNum,
                    content: JSON.stringify(quillText),
                    plain_text: text,
                    last_local: last_local,
                    current_version: window.current_version
                })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error(response);
                this.handleError("服务端保存操作失败！", new Error(`${response.status}:${data.err}`), data.message);
                SaveCartoon.onSaveFailed();
                return false;
            }
            window.quillTextChange = false;
            const textChangeElement = document.getElementById('textChange');
            if (!(textChangeElement instanceof HTMLElement)) {
                console.error("缺少元素 textChange");
                return
            };
            textChangeElement.textContent = '💾：✅';
            SaveCartoon.onSaveSuccess();
            const newVersion = await fetch(`/api/page/version?doc_name=${encodeURIComponent(docName)}&chapter_id=${encodeURIComponent(chapterId)}&page_num=${encodeURIComponent(pageNum)}}`);
            if (newVersion.ok) {
                const json = await newVersion.json();
                window.current_version = json.current_version;
            } else {
                console.error(newVersion);
                const json = await newVersion.json();
                this.handleError('获取版本号失败', new Error(json.err));
            }
            return true;
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                this.handleError('Error updating page:', error, "FROM updatePage()");
            } else {
                this.handleError('Error updating page:', new Error("unknown error"), "FROM updatePage()");
            }
            SaveCartoon.onSaveFailed();
            return false;
        }
    }

    static async autoCutPage() {
        const cutInput = document.getElementById("auto-cut-input");
        if (!(cutInput instanceof HTMLInputElement)) {
            console.error("缺少元素 auto-cut-input");
            return
        };
        const maxPageNumber = parseInt(cutInput.value); // 每页最大字符数
        const cutStringList = ["\n", ".", "。", "!", "！", "?", "？"]; // 分割字符串列表
        // 获取Quill编辑器的纯文本内容和Delta内容
        let totalText = window.quill.getText();
        let totalDelta = window.quill.getContents();

        // 获取文本分割位置的函数
        function getTextCutIndex(text: string, maxLength: number, cutList: string[]) {
            for (let cutString of cutList) {
                let index = text.lastIndexOf(cutString, maxLength);
                if (index !== -1) return index + cutString.length;
            }
            return maxLength;
        }

        // 根据纯文本的截断位置，分割Delta内容
        function getDeltaContentUpToIndex(delta: any, textIndex: number) {
            let currentLength = 0;
            let resultDelta = [];
            for (let op of delta.ops) {
                if (currentLength >= textIndex) break;
                if (typeof op.insert === 'string') {
                    let remainingLength = textIndex - currentLength;
                    let insertText = op.insert.slice(0, remainingLength);
                    resultDelta.push({ insert: insertText, attributes: op.attributes });
                    currentLength += insertText.length;
                } else {
                    resultDelta.push(op);
                }
            }
            return { ops: resultDelta };
        }

        // 获取剩余的Delta内容
        function getRemainingDelta(delta: any, textIndex: number) {
            let currentLength = 0;
            let resultDelta = [];
            for (let op of delta.ops) {
                if (currentLength >= textIndex) {
                    resultDelta.push(op);
                } else if (typeof op.insert === 'string') {
                    let remainingLength = textIndex - currentLength;
                    if (remainingLength < op.insert.length) {
                        resultDelta.push({ insert: op.insert.slice(remainingLength), attributes: op.attributes });
                    }
                    currentLength += op.insert.length;
                }
            }
            return { ops: resultDelta };
        }

        // 分页逻辑
        let contentList = [];
        const virtualContainer = document.createElement('div');
        const tempQuill = new Quill(virtualContainer, {
            theme: 'snow', // 主题可以设置为 'snow' 或 'bubble'
            modules: {
                toolbar: false // 不显示工具栏
            }
        });
        if (totalText.length < maxPageNumber) {
            contentList.push(totalDelta);
        }
        while (totalText.length > maxPageNumber) {

            let cutIndex = getTextCutIndex(totalText, maxPageNumber, cutStringList);
            let leftDelta = getDeltaContentUpToIndex(totalDelta, cutIndex);
            let rightDelta = getRemainingDelta(totalDelta, cutIndex);
            contentList.push(leftDelta);
            tempQuill.setContents(rightDelta);
            totalText = tempQuill.getText();
            totalDelta = tempQuill.getContents();
        }

        async function insertPageAtEndOf(docName: string, chapterId: number, currentPage: number, rtfBytes: { ops: any[]; }, text: string, lastLocal: number) {
            if (!docName || !chapterId || !currentPage) {
                console.error("缺少必要参数 doc_name, chapter_id, page_num");
                return false;
            }
            const response = await fetch(`/api/page`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    doc_name: docName,
                    chapter_id: chapterId,
                    page_num: currentPage,
                    content: JSON.stringify(rtfBytes),
                    plain_text: text,
                    last_local: lastLocal
                })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error(response);
                PageImpl.handleError("服务端插入页面操作失败：", new Error(`${response.status}:${data.err}`), data.message);
                return false;
            }
            return true;
        }

        const docName = window.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = parseInt(window.getQueryParameter('chapter_id')); // 从 URL 中获取 chapterId
        let page = parseInt(window.getQueryParameter('page_num')); // 从 URL 中获取 lastPage

        window.quill.setContents(contentList[0]);
        if(window.quill.isEnabled())await this.updatePage();
        contentList.shift();
        for (const item of contentList) {
            tempQuill.setContents(item);
            if (!await insertPageAtEndOf(docName, chapterId, page, item, tempQuill.getText(), 0)) break;
            page++;
        }
        await this.goToPage(docName, chapterId, page, true);
    }

    static async goToPage(docName: string, chapterId: number, page_num: number, update = true) {
        if (update && window.quill.isEnabled()) {
            const updateResult = await this.updatePage();
            if (!updateResult) {
                return;
            }
        }
        const url = `/editor?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}&page_num=${page_num}`;
        history.pushState({}, '', url);
        await this.loadPage(docName, chapterId, page_num);
    }

    static async getTotalPages(docName: string, chapterId: number) {
        const totalPagesElement = document.getElementById('total-pages');
        if (!(totalPagesElement instanceof HTMLElement)) {
            console.error("缺少元素 total-pages");
            return
        };
        try {
            const response = await fetch(`/api/page/total?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}`);
            const data = await response.json();

            if (!response.ok) {
                console.error(response);
                this.handleError("服务端获取总页数失败", new Error(`${response.status}:${data.err}`), data.message);
                totalPagesElement.textContent = "/获取总页数失败！";
                return;
            }
            data.total_pages ??= -1;
            totalPagesElement.textContent = "/ " + data.total_pages;
            totalPagesElement.dataset.value = data.total_pages;
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                this.handleError('获取总页数发生错误:', error);
            } else {
                this.handleError('获取总页数发生错误:unknown error');
            }
            totalPagesElement.textContent = "/获取总页数失败！";
        }
    }

    static async updateChapterLastPage(docName: string, chapterId: number, lastPage: number) {
        if (!docName || !chapterId || !lastPage) {
            console.error("缺少必要参数 doc_name, chapter_id, last_page");
            return
        };
        try {
            const response = await fetch(`/api/chapter/last-page`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ doc_name: docName, chapter_id: chapterId, last_page: lastPage })
            });
            const title = await response.json();
            if (response.status === 401) {
                console.log("未登录，无法更新最后一页")
                return
            };
            if (!response.ok) {
                console.error(response);
                this.handleError('服务端记录最后一页发生错误：', new Error(`${response.status}:${title.err}`));}
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                this.handleError('记录最后一页发生错误:', error);
            } else {
                this.handleError('记录最后一页发生错误:unknown error');
            }
        }
    }
}
window.getQueryParameter = function getQueryParameter(paramName: string) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(paramName) ?? "";
}


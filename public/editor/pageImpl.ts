class QuillInit {
    static readonly Font = Quill.import('formats/font');
    static {
        QuillInit.Font.whitelist = [
            'sans-serif',
            'serif',
            'monospace',
            'simsun',
            'simhei',
            'kaiti',
            'fangsong',
            'yahei'
        ];
        Quill.register(QuillInit.Font, true);
    }
    static readonly fullToolbarOptions = {
        container: [
            [{ 'font': QuillInit.Font.whitelist }, { 'size': ['small', false, 'large', 'huge'] }],  // 字体及大小
            ['bold', 'italic', 'underline', 'strike'],                         // 文本样式
            [{ 'color': [] }, { 'background': [] }],                           // 颜色选择
            [{ 'script': 'sub' }, { 'script': 'super' }],                       // 上标/下标
            [{ 'header': [2, 3, 4, 5, 6, false] }],                            // 标题
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],                      // 列表
            [{ 'align': [] }],                                                 // 对齐方式
            [{ 'indent': '-1' }, { 'indent': '+1' }],                             // 缩进
            ['link', 'image', 'video'],                                        // 插入链接、图片、视频
            ['clean']
        ],
        handlers: {}
    };
}

class QuillObj {
    static readonly quill: Quill = new Quill('#editor-container', {
        modules: {
            toolbar: QuillInit.fullToolbarOptions
        },
        theme: 'snow'
    });
    static readonly quillTextChange = { value: false };
    static readonly quillTextVersion = { value: 0 };
    static {
        QuillObj.quill.disable();
        //#region 注册字体功能
        const customFonts = {
            'sans-serif': '无衬线',
            'serif': '衬线',
            'monospace': '等宽',
            'simsun': '宋体',
            'simhei': '黑体',
            'kaiti': '楷体',
            'fangsong': '仿宋',
            'yahei': '微软雅黑'
        };
        function updateFontDisplay(element: Element) {
            const value = element.getAttribute('data-value') as keyof typeof customFonts;
            if (customFonts[value]) {
                element.innerHTML = '';
                const span = document.createElement('span');
                span.textContent = customFonts[value];
                element.appendChild(span);
            }
        }
        document.querySelectorAll('.ql-font .ql-picker-item').forEach(updateFontDisplay);
        const defaultOption = document.querySelector('.ql-font .ql-picker-label .ql-selected');
        if (defaultOption) {
            const closestPickerItem = defaultOption.closest('.ql-picker-item');
            if (closestPickerItem) { // 检查 closest 是否返回了 Element
                updateFontDisplay(closestPickerItem);
            }
        }
        //#endregion
    }
}

class PageApi {
    static getQueryParameter(paramName: string) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(paramName) ?? "";
    }

    static handleError(info: string, error?: Error, message?: string) {
        let errMsg = "无错误信息";
        if (error) errMsg = error.message;
        let msg = "无消息";
        if (message) msg = message;
        alert(`发生错误:\n错误描述:${info}+\n错误:${errMsg}\n消息:${msg}`);
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
            nextPageBtn.disabled = (checkedPageNum >= totalPages);
            prevPageBtn.disabled = (checkedPageNum <= 1);
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
                QuillObj.quill.setText("加载页面失败！" + data.err);
                QuillObj.quill.disable();
                return;
            }
            QuillObj.quillTextVersion.value = data.current_version;
            const quillBytes = data.content;
            if (quillBytes) QuillObj.quill.setContents(JSON.parse(quillBytes));
            else QuillObj.quill.setText(data.plain_text);
            const last_local = data.last_local;
            if (last_local) QuillObj.quill.setSelection(last_local, 0);
            QuillObj.quill.enable();
            QuillObj.quillTextChange.value = false;
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
        const docName = PageApi.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = parseInt(PageApi.getQueryParameter('chapter_id')); // 从 URL 中获取 chapterId
        const currentPage = PageApi.getQueryParameter('page_num'); // 从 URL 中获取 lastPage
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
        await this.goToPage(docName, chapterId, nextPage, QuillObj.quillTextChange.value);
    }

    static async deletePageAt() {
        const docName = PageApi.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = parseInt(PageApi.getQueryParameter('chapter_id')); // 从 URL 中获取 chapterId
        const currentPage = parseInt(PageApi.getQueryParameter('page_num')); // 从 URL 中获取 lastPage
        if (currentPage === 1 && parseInt(document.getElementById('total-pages')?.dataset.value ?? "0") === 1) {
            QuillObj.quill.root.innerHTML = '';
            if (QuillObj.quill.isEnabled()) await this.updatePage();
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
            if (currentPage > 1) {
                toPage = (currentPage - 1);
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
        const docName = PageApi.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = parseInt(PageApi.getQueryParameter('chapter_id')); // 从 URL 中获取 chapterId
        const page = parseInt(PageApi.getQueryParameter('page_num')) + offset; // 从 URL 中获取 lastPage
        await this.goToPage(docName, chapterId, page, QuillObj.quillTextChange.value);
    }

    static async updatePage() {
        SaveCartoon.onSaving()
        const docName = PageApi.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = PageApi.getQueryParameter('chapter_id'); // 从 URL 中获取 chapterId
        const pageNum = PageApi.getQueryParameter('page_num'); // 从 URL 中获取 lastPage
        if (!docName || !chapterId || !pageNum) {
            console.error("缺少必要参数 doc_name, chapter_id, page_num");
            return false;
        }
        try {
            const quillText = QuillObj.quill.getContents();
            const text = QuillObj.quill.getText();
            const selection = QuillObj.quill.getSelection();
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
                    current_version: QuillObj.quillTextVersion
                })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error(response);
                this.handleError("服务端保存操作失败！", new Error(`${response.status}:${data.err}`), data.message);
                SaveCartoon.onSaveFailed();
                return false;
            }
            QuillObj.quillTextChange.value = false;
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
                QuillObj.quillTextVersion.value = json.current_version;
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

    static async goToPage(docName: string, chapterId: number, page_num: number, update = true) {
        if (update && QuillObj.quill.isEnabled()) {
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
                console.warn("未登录，无法更新最后一页")
                return
            };
            if (!response.ok) {
                console.error(response);
                this.handleError('服务端记录最后一页发生错误：', new Error(`${response.status}:${title.err}`));
            }
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                this.handleError('记录最后一页发生错误:', error);
            } else {
                this.handleError('记录最后一页发生错误:unknown error');
            }
        }
    }

    //#region auto-cut-tool
    // 获取文本分割位置的函数
    private static getTextCutIndex(text: string, maxLength: number, cutList: string[]) {
        for (let cutString of cutList) {
            let index = text.lastIndexOf(cutString, maxLength);
            if (index !== -1) return index + cutString.length;
        }
        return maxLength;
    }
    // 根据纯文本的截断位置，分割Delta内容
    private static getDeltaContentUpToIndex(delta: any, textIndex: number) {
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
    private static getRemainingDelta(delta: any, textIndex: number) {
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
    private static async insertFullPageAtEndOf(docName: string, chapterId: number, currentPage: number, rtfBytes: { ops: any[]; }, text: string, lastLocal: number) {
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
            PageApi.handleError("服务端插入页面操作失败：", new Error(`${response.status}:${data.err}`), data.message);
            return false;
        }
        return true;
    }
    private static showSaveCount(pageNumber: number) {
        // 创建 div 元素
        const alertDiv = document.createElement('div');
        alertDiv.textContent = `第${pageNumber}页已完成`;

        // 设置内联样式
        Object.assign(alertDiv.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            fontSize: '18px',
            zIndex: '9999',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            opacity: '1',
            transition: 'opacity 0.5s ease-out'
        });

        // 添加到 body
        document.body.appendChild(alertDiv);

        // 延迟淡出并移除
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 500); // 等待动画结束再删除元素
        }, 2000); // 2秒后开始消失
    }
    //#endregion
    static async autoCutPage() {
        const cutInput = document.getElementById("auto-cut-input");
        if (!(cutInput instanceof HTMLInputElement)) {
            console.error("缺少元素 auto-cut-input");
            return;
        };
        const maxPageNumber = parseInt(cutInput.value); // 每页最大字符数
        const cutStringList = ["\n", ".", "。", "!", "！", "?", "？"]; // 分割字符串列表
        // 获取Quill编辑器的纯文本内容和Delta内容
        let totalText = QuillObj.quill.getText();
        let totalDelta = QuillObj.quill.getContents();
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

            let cutIndex = PageApi.getTextCutIndex(totalText, maxPageNumber, cutStringList);
            let leftDelta = PageApi.getDeltaContentUpToIndex(totalDelta, cutIndex);
            let rightDelta = PageApi.getRemainingDelta(totalDelta, cutIndex);
            contentList.push(leftDelta);
            tempQuill.setContents(rightDelta);
            totalText = tempQuill.getText();
            totalDelta = tempQuill.getContents();
        }
        contentList.push(totalDelta);
        const docName = PageApi.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = parseInt(PageApi.getQueryParameter('chapter_id')); // 从 URL 中获取 chapterId
        const currentPage = parseInt(PageApi.getQueryParameter('page_num')); // 从 URL 中获取 lastPage
        let insertPage = currentPage;
        for (const item of contentList) {
            tempQuill.setContents(item);
            const result = await PageApi.insertFullPageAtEndOf(docName, chapterId, insertPage, item, tempQuill.getText(), 0);
            if (!result) {
                console.error("插入页面失败");
                break;
            }
            insertPage++;
            PageApi.showSaveCount(insertPage);
        }
        await PageApi.getTotalPages(docName, chapterId);
        await PageApi.deletePageAt();
        await this.goToPage(docName, chapterId, insertPage - 1);
    }
}


class SaveCartoon {
    private static overlay: HTMLElement | null = null;
    private static box: HTMLElement | null = null;
    static readonly svgIconString = `
<svg width="100" height="100" viewBox="0 0 100 100">
    <defs>
        <linearGradient id="grad">
            <stop offset="0%" stop-color="#4a90e2">
                <animate attributeName="stop-color" values="#4a90e2;#8ed1fc;#4a90e2" dur="1.5s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stop-color="#8ed1fc">
                <animate attributeName="stop-color" values="#8ed1fc;#4a90e2;#8ed1fc" dur="1.5s" repeatCount="indefinite"/>
            </stop>
        </linearGradient>
    </defs>

    <g transform="translate(50,50)">
        <rect transform="rotate(0)"   x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0s"/>
        </rect>
        <rect transform="rotate(45)"  x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.15s"/>
        </rect>
        <rect transform="rotate(90)"  x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
        </rect>
        <rect transform="rotate(135)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.45s"/>
        </rect>
        <rect transform="rotate(180)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
        </rect>
        <rect transform="rotate(225)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.75s"/>
        </rect>
        <rect transform="rotate(270)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.9s"/>
        </rect>
        <rect transform="rotate(315)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="1.05s"/>
        </rect>
    </g>
</svg>
`
    private static saveResult = false;

    static onSaving() {
        this.saveResult = true;
        this._clear(); // 清除旧内容


        this._mask();

        // 添加文字
        const text = document.createElement('div');
        text.textContent = '保存中...';
        if (!(this.overlay && this.box)) return;
        this.box.appendChild(text);
        this.overlay.appendChild(this.box);
        document.body.appendChild(this.overlay);
    }

    static onSaveSuccess() {

        if (!this.overlay || !this.box) return;
        // 设置成功样式
        Object.assign(this.box.style, {
            backgroundColor: '#e6f7ee',
            borderColor: '#b2eec7',
            borderWidth: '1px',
            borderStyle: 'solid'
        });

        // 替换内容为成功图标
        this.box.innerHTML = `
      <svg viewBox="0 0 100 100" style="width:40px;height:40px;margin:0 auto 15px;">
        <circle cx="50" cy="50" r="45" fill="#4caf50"></circle>
        <path d="M30 50l15 15 20-20" stroke="white" stroke-width="5" fill="none"/>
      </svg>
      <div>保存成功</div>
    `;

        setTimeout(() => {
            this.saveResult = false;
            this._clear()
        }, 1500);
    }

    static onSaveFailed() {
        this.saveResult = false;
        if (!this.overlay || !this.box) return;

        // 设置失败样式
        Object.assign(this.box.style, {
            backgroundColor: '#fff0f0',
            borderColor: '#fcd0d0',
            borderWidth: '1px',
            borderStyle: 'solid'
        });

        // 替换内容为失败图标
        this.box.innerHTML = `
      <div style="margin 20 auto">❌</div>
      <div>保存失败</div>
    `;
        //<svg viewBox="0 0 100 100" style="width:40px;height:40px;margin:0 auto 15px;">
        //        <circle cx="50" cy="50" r="45" fill="#ff4d4f"></circle>
        //        <path d="M30 50l20 20 20-20" stroke="white" stroke-width="5" fill="none"/>
        //      </svg>
        setTimeout(() => {
            this.saveResult = false;
            this._clear()
        }, 1500);
    }

    static _clear() {
        if (this.overlay?.parentNode) {
            this.overlay.remove();
        }
        this.overlay = null;
        this.box = null;
    }

    static onLoading() {
        if (!this.saveResult) this._clear();
        this._mask();
        if (!this.overlay || !this.box) return;
        this.overlay.appendChild(this.box);
        document.body.appendChild(this.overlay);
    }

    static onLoaded() {
        if (!this.overlay || !this.box || this.saveResult) return;
        this._clear();
    }

    static _mask() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '100'
        });
        // 创建内容框
        this.box = document.createElement('div');
        Object.assign(this.box.style, {
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            fontSize: '16px',
            minWidth: '200px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        });
        // 添加加载动画
        const spinner = document.createElement('div');
        spinner.innerHTML = this.svgIconString;
        this.box.appendChild(spinner);
    }
}

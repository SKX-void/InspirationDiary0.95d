import { serverPrefix } from "../../config";
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
            const prevPageBtn = document.getElementById('prev-page-btn') as HTMLButtonElement;
            await this.getTotalPages(docName, chapterId);

            const totalPages = parseInt(document.getElementById('total-pages')?.dataset.value ?? "0");
            const nextPageBtn = document.getElementById('next-page-btn') as HTMLButtonElement;
            nextPageBtn.disabled = (checkedPageNum >= totalPages);
            prevPageBtn.disabled = (checkedPageNum <= 1);
            const pageInput = document.getElementById('page-input') as HTMLInputElement;

            pageInput.textContent = checkedPageNum.toString();
            pageInput.value = `${checkedPageNum}`;
            const response = await fetch(`${serverPrefix.value}/api/page?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}&page_num=${checkedPageNum}`);
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
            const textChangeElement = document.getElementById('textChange') as HTMLElement;
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
        const response = await fetch(`${serverPrefix.value}/api/page`, {
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
            const response = await fetch(`${serverPrefix.value}/api/page`, {
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
            const response = await fetch(`${serverPrefix.value}/api/page`, {
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
                    current_version: QuillObj.quillTextVersion.value
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
            const newVersion = await fetch(`${serverPrefix.value}/api/page/version?doc_name=${encodeURIComponent(docName)}&chapter_id=${encodeURIComponent(chapterId)}&page_num=${encodeURIComponent(pageNum)}}`);
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
        const url = `${serverPrefix.value}/editor?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}&page_num=${page_num}`;
        history.pushState({}, '', url);
        await this.loadPage(docName, chapterId, page_num);
    }

    static async getTotalPages(docName: string, chapterId: number) {
        const totalPagesElement = document.getElementById('total-pages') as HTMLElement;
        try {
            const response = await fetch(`${serverPrefix.value}/api/page/total?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}`);
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
            const response = await fetch(`${serverPrefix.value}/api/chapter/last-page`, {
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
        const response = await fetch(`${serverPrefix.value}/api/page`, {
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
        const cutStringList = ["\n",  "。", "!", "！", "?", "？"]; // 分割字符串列表
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

class EditorDomBinder {
    static async loginBtnInit() {
        const loginBtn = document.getElementById('login') as HTMLElement;
        loginBtn.addEventListener('click', () => {
            window.location.href = `${serverPrefix.value}/login`;
        });
        const loginStatus = await fetch(`${serverPrefix.value}/login-status`);
        if (!loginStatus.ok) {
            console.warn('登录状态检查失败，请检查服务器。');
            return;

        }
        const loginStatusJson = await loginStatus.json();
        if (loginStatusJson.login || loginStatusJson.level > 0) {
            loginBtn.style.display = 'none';
        }
    }

    static quillEventInit() {
        QuillObj.quillTextChange.value = false;
        QuillObj.quillTextVersion.value = -1;
        const textChangeElement = document.getElementById('textChange') as HTMLElement;
        const textCountElement = document.getElementById('textCount') as HTMLElement;
        QuillObj.quill.on('text-change', function () {
            QuillObj.quillTextChange.value = true;
            textChangeElement.textContent = '💾：❌';
            const textCount = QuillObj.quill.getText().length;
            textCountElement.textContent = '🖊️：' + textCount + " 字符";
        });
        (function () {
            textChangeElement.textContent = '💾：❌';
            const textCount = QuillObj.quill.getText().length;
            textCountElement.textContent = '🖊️：' + textCount + " 字符";
        })();
        const quillUndoBtn = document.getElementById('quill-undo-btn') as HTMLElement;
        quillUndoBtn.addEventListener('click', function () {
            QuillObj.quill.history.undo();
        });
        const quillRedoBtn = document.getElementById('quill-redo-btn') as HTMLElement;
        quillRedoBtn.addEventListener('click', function () {
            QuillObj.quill.history.redo();
        });
    }

    static jumpToPageInit() {
        const pageInputElement = document.getElementById('page-input') as HTMLInputElement;
        pageInputElement.addEventListener('keydown', async function (e) {
            if (e.key === 'Enter') {
                SaveCartoon.onLoading();
                const docName = PageApi.getQueryParameter('doc_name');
                const chapterId = parseInt(PageApi.getQueryParameter('chapter_id'));
                const pageNum = parseInt(pageInputElement.value);
                await PageApi.goToPage(docName, chapterId, pageNum, QuillObj.quillTextChange.value);
                SaveCartoon.onLoaded();
            }
        });
        const nextBtn = document.getElementById('next-page-btn') as HTMLElement;
        nextBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.goToPageOffset(1);
            SaveCartoon.onLoaded();
        });
        const prevBtn = document.getElementById('prev-page-btn') as HTMLElement;
        prevBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.goToPageOffset(-1);
            SaveCartoon.onLoaded();
        });
    }

    static pageOperateInit() {
        const insertPageBtn = document.getElementById('insert-page-btn') as HTMLElement;
        insertPageBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.insertPageAtEndOf();
            SaveCartoon.onLoaded();
        });

        const deletePageBtn = document.getElementById('delete-page-btn') as HTMLElement;
        deletePageBtn.addEventListener('click', async function () {
            // 如果已经存在模态框，不重复创建
            const onConfirm = async () => {
                SaveCartoon.onLoading();
                await PageApi.deletePageAt();
                SaveCartoon.onLoaded();
            }
            if (document.getElementById('custom-confirm-modal')) return;

            // 创建遮罩层
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'custom-confirm-modal';
            Object.assign(modalOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '9998'
            });

            // 创建模态框内容容器
            const modalContent = document.createElement('div');
            Object.assign(modalContent.style, {
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                width: '300px',
                textAlign: 'center',
                position: 'relative',
                zIndex: '9999'
            });

            // 创建提示文字
            const message = document.createElement('p');
            message.textContent = '确定要删除当前页吗？';
            Object.assign(message.style, {
                fontSize: '16px',
                marginBottom: '20px'
            });

            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'space-between';
            buttonContainer.style.gap = '10px';

            // 创建确认按钮
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = '确认';
            Object.assign(confirmBtn.style, {
                flex: '1',
                padding: '8px',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            });

            // 创建取消按钮
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = '取消';
            Object.assign(cancelBtn.style, {
                flex: '1',
                padding: '8px',
                backgroundColor: '#ccc',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            });

            // 添加按钮点击事件
            confirmBtn.onclick = function () {
                modalOverlay.remove();
                onConfirm(); // 执行确认后的操作（即删除页面）
            };

            cancelBtn.onclick = function () {
                modalOverlay.remove();
            };

            // 将按钮添加到按钮容器
            buttonContainer.appendChild(confirmBtn);
            buttonContainer.appendChild(cancelBtn);

            // 将内容添加到模态框中
            modalContent.appendChild(message);
            modalContent.appendChild(buttonContainer);

            // 将模态框添加到 body 中
            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

        });

        const saveBtn = document.getElementById('save-btn') as HTMLElement;
        saveBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.updatePage();
            SaveCartoon.onLoaded();
        });

        const autoCutBtn = document.getElementById('auto-cut-btn') as HTMLElement;
        autoCutBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.autoCutPage();
            SaveCartoon.onLoaded();
        });

        const hideToolbarCheckbox = document.getElementById('hide-toolbar-checkbox') as HTMLInputElement;
        hideToolbarCheckbox.addEventListener('change', function () {
            const paginationControls = document.getElementById('pagination-controls');
            const backBtn = document.getElementById('back-title-btn');
            const title = document.getElementById('title');
            const toolbar = document.querySelector('.ql-toolbar');
            const container = document.querySelector('.ql-container.ql-snow');
            if (!(toolbar instanceof HTMLElement
                && container instanceof HTMLElement)) {
                console.error('缺少元素 toolbar, container');
                return
            };
            if (!(paginationControls && backBtn && title)) {
                console.error('缺少元素 paginationControls, backBtn, title');
                return
            };
            if (this.checked) {
                toolbar.style.display = 'none';  // 隐藏
                paginationControls.style.display = 'none';
                container.style.borderTop = '1px solid #ccc';
                backBtn.style.display = 'none';
                title.style.display = 'none';
            } else {
                toolbar.style.display = '';  // 显示
                paginationControls.style.display = 'block';
                container.style.borderTop = 'none';
                backBtn.style.display = 'block';
                title.style.display = 'block';
            }
        });
    }

    static backBtnInit() {
        const backBtn = document.getElementById('back-title-btn') as HTMLElement;
        backBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            if (QuillObj.quillTextChange.value) {
                const updateResult = await PageApi.updatePage();
                if (!updateResult) {
                    SaveCartoon.onLoaded();
                    return;
                }
            }
            const docName = PageApi.getQueryParameter('doc_name');
            const chapterId = PageApi.getQueryParameter('chapter_id');
            const pageNum = PageApi.getQueryParameter('page_num');
            window.location.href = `${serverPrefix.value}/pageIndex?doc_name=${docName}&chapter_id=${chapterId}&last_page=${pageNum}`;
            SaveCartoon.onLoaded();
        });
    }

    static async loadQuillContent() {
        const docName = PageApi.getQueryParameter('doc_name');
        const chapterId = parseInt(PageApi.getQueryParameter('chapter_id'));
        const pageNum = parseInt(PageApi.getQueryParameter('page_num'));
        if (!docName || isNaN(chapterId) || isNaN(pageNum)) {
            QuillObj.quill.root.innerHTML = '<li>缺少 ID 位置，请检查 URL。</li>';
            return;
        }
        await PageApi.loadPage(docName, chapterId, pageNum); // 根据 docName, chapterId, lastPage 加载页面
    }

}

class EditorFRDomBinder {
    static init() {
        const findReplaceModal = document.getElementById('findReplaceModal') as HTMLElement;
        const moveFRDiv = document.getElementById('moveFRDiv') as HTMLElement;
        EditorFRDomBinder.makeDraggable(findReplaceModal, moveFRDiv);

        const replaceBlock = document.getElementById('replaceBlock') as HTMLElement;
        const openFindBtn = document.getElementById('openFindBtn') as HTMLElement;
        openFindBtn.addEventListener('click', function () {
            findReplaceModal.style.display = "block";
            replaceBlock.style.display = "none";
        });

        const openFindReplaceBtn = document.getElementById('openFindReplaceBtn') as HTMLElement;
        openFindReplaceBtn.addEventListener('click', function () {
            findReplaceModal.style.display = "block";
            replaceBlock.style.display = "block";
        });

        const closeFindReplaceBtn = document.getElementById('closeFindReplaceBtn') as HTMLElement;
        closeFindReplaceBtn.addEventListener('click', function closeFind() {
            findReplaceModal.style.display = "none";
            EditorFRDomBinder.removeHighlights();
        }
        );
        const findInput = document.getElementById('findInput') as HTMLInputElement;
        const findPreviousBtn = document.getElementById('findPreviousBtn') as HTMLElement;
        findPreviousBtn.addEventListener('click', () => {
            EditorFRDomBinder.performFindPrevious(findInput.value)
        });

        const findNextBtn = document.getElementById('findNextBtn') as HTMLElement;
        findNextBtn.addEventListener('click', () => {
            EditorFRDomBinder.performFindNext(findInput.value)
        }
        );

        const replaceInput = document.getElementById('replaceInput') as HTMLInputElement;
        const replaceBtn = document.getElementById('replaceBtn') as HTMLElement;
        replaceBtn.addEventListener('click', () => {
            EditorFRDomBinder.performReplace(findInput.value, replaceInput.value)
        });

        const replaceAllBtn = document.getElementById('replaceAllBtn') as HTMLElement;
        replaceAllBtn.addEventListener('click', () => {
            EditorFRDomBinder.performReplaceAll(findInput.value, replaceInput.value)
        });

    }

    private static performFindPrevious(findText: string) {
        if (!findText) return;
        EditorFRDomBinder.removeHighlights();
        const text = QuillObj.quill.getText();
        const selection = QuillObj.quill.getSelection();
        let end = selection ? selection.index : text.length;
        const index = text.lastIndexOf(findText, end - 1);
        if (index !== -1) {
            EditorFRDomBinder.highlightAndSelect(index, findText.length);
        } else {
            alert('未找到匹配项。');
        }
    }

    private static performFindNext(findText: string) {
        if (!findText) return;
        EditorFRDomBinder.removeHighlights();
        const text = QuillObj.quill.getText();
        const selection = QuillObj.quill.getSelection();
        let start = selection ? selection.index + selection.length : 0;
        const index = text.indexOf(findText, start);
        if (index !== -1) {
            EditorFRDomBinder.highlightAndSelect(index, findText.length);
        } else {
            alert('未找到匹配项。');
        }
    }

    private static performReplace(findText: string, replaceText: string) {
        if (!findText) return;
        const selection = QuillObj.quill.getSelection();
        if (!selection || selection.length === 0) return;
        QuillObj.quill.deleteText(selection.index, selection.length);
        QuillObj.quill.insertText(selection.index, replaceText, 'user');
        EditorFRDomBinder.performFindNext(findText);
    }

    private static performReplaceAll(findText: string, replaceText: string) {
        if (!findText) return;
        const delta = QuillObj.quill.getContents();
        const ops = delta.ops;
        let offset = 0;
        for (const element of ops) {
            if (element.insert && typeof element.insert === 'string') {
                const originalLength = element.insert.length;
                element.insert = element.insert.split(findText).join(replaceText);
                const diff = element.insert.length - originalLength;
                offset += diff;
            }
        }
        QuillObj.quill.setContents(delta);
    }

    private static makeDraggable(element: HTMLElement, moveDot: HTMLElement) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        moveDot.onmousedown = dragMouseDown;

        function dragMouseDown(e: MouseEvent) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e: MouseEvent) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    private static highlightAndSelect(start: number, length: number) {
        QuillObj.quill.formatText(start, length, 'background', 'yellow');
        QuillObj.quill.setSelection(start, length);
    }

    private static removeHighlights() {
        const delta = QuillObj.quill.getContents();
        const ops = delta.ops;

        for (let i = 0; i < ops.length; i++) {
            if (ops[i].insert && typeof ops[i].insert === 'string') {
                QuillObj.quill.removeFormat(i, ops[i].insert.length, 'background');
            }
        }
    }

}

window.addEventListener('DOMContentLoaded', async function () {
    await EditorDomBinder.loginBtnInit();
    EditorDomBinder.quillEventInit();
    EditorDomBinder.jumpToPageInit();
    EditorDomBinder.pageOperateInit();
    EditorDomBinder.backBtnInit();
    await EditorDomBinder.loadQuillContent();

    EditorFRDomBinder.init();

});
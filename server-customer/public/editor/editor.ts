import { serverPrefix } from "../../config";

class QuillObj {
    static readonly quill: Quill = new Quill('#editor-container', {
        theme: 'snow',
        readOnly: true,
    });
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
            const quillBytes = data.content;
            if (quillBytes) QuillObj.quill.setContents(JSON.parse(quillBytes));
            else QuillObj.quill.setText(data.plain_text);
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                this.handleError('Error loading page:', error, `From loadPage(${docName},${chapterId},${pageNum})`);
            } else {
                this.handleError('Error loading page:', new Error("unknown error"), `From loadPage(${docName},${chapterId},${pageNum})`);
            }
        }
    }


    static async goToPageOffset(offset: number) {
        const docName = PageApi.getQueryParameter('doc_name'); // 从 URL 中获取 docName
        const chapterId = parseInt(PageApi.getQueryParameter('chapter_id')); // 从 URL 中获取 chapterId
        const page = parseInt(PageApi.getQueryParameter('page_num')) + offset; // 从 URL 中获取 lastPage
        await this.goToPage(docName, chapterId, page, false);
    }

    static async goToPage(docName: string, chapterId: number, page_num: number, update = true) {
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

}

class LoadCartoon {
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


    static _clear() {
        if (this.overlay?.parentNode) {
            this.overlay.remove();
        }
        this.overlay = null;
        this.box = null;
    }

    static onLoading() {
        this._mask();
        if (!this.overlay || !this.box) return;
        this.overlay.appendChild(this.box);
        document.body.appendChild(this.overlay);
    }

    static onLoaded() {
        if (!this.overlay || !this.box ) return;
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

    static jumpToPageInit() {
        const pageInputElement = document.getElementById('page-input') as HTMLInputElement;
        pageInputElement.addEventListener('keydown', async function (e) {
            if (e.key === 'Enter') {
                LoadCartoon.onLoading();
                const docName = PageApi.getQueryParameter('doc_name');
                const chapterId = parseInt(PageApi.getQueryParameter('chapter_id'));
                const pageNum = parseInt(pageInputElement.value);
                await PageApi.goToPage(docName, chapterId, pageNum, false);
                LoadCartoon.onLoaded();
            }
        });
        const nextBtn = document.getElementById('next-page-btn') as HTMLElement;
        nextBtn.addEventListener('click', async function () {
            LoadCartoon.onLoading();
            await PageApi.goToPageOffset(1);
            LoadCartoon.onLoaded();
        });
        const prevBtn = document.getElementById('prev-page-btn') as HTMLElement;
        prevBtn.addEventListener('click', async function () {
            LoadCartoon.onLoading();
            await PageApi.goToPageOffset(-1);
            LoadCartoon.onLoaded();
        });
    }

    static pageOperateInit() {

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
            LoadCartoon.onLoading();
            const docName = PageApi.getQueryParameter('doc_name');
            const chapterId = PageApi.getQueryParameter('chapter_id');
            const pageNum = PageApi.getQueryParameter('page_num');
            window.location.href = `${serverPrefix.value}/pageIndex?doc_name=${docName}&chapter_id=${chapterId}&last_page=${pageNum}`;
            LoadCartoon.onLoaded();
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

        const openFindBtn = document.getElementById('openFindBtn') as HTMLElement;
        openFindBtn.addEventListener('click', function () {
            findReplaceModal.style.display = "block";
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
    EditorDomBinder.jumpToPageInit();
    EditorDomBinder.pageOperateInit();
    EditorDomBinder.backBtnInit();
    await EditorDomBinder.loadQuillContent();

    EditorFRDomBinder.init();

});
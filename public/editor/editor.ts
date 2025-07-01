interface Window {
    quillTextChange: boolean;
    current_version: number;
    // 如果还有其他自定义属性，也可以在这里定义
}
interface Quill {
    on(event: string, callback: (delta: any, oldContents: any, source: string) => void): void;
    getText(): string;
}
window.addEventListener('DOMContentLoaded', async function () {
    this.window.quillTextChange = false;
    this.window.current_version = -1;
    const docName = this.window.getQueryParameter('doc_name');
    const chapterId = parseInt(this.window.getQueryParameter('chapter_id'));
    const pageNum = parseInt(this.window.getQueryParameter('page_num'));

    const textChangeElement = document.getElementById('textChange');
    const textCountElement = document.getElementById('textCount');
    if (!(textChangeElement instanceof HTMLElement
        && textCountElement instanceof HTMLElement)) {
        console.error('缺少元素 textChangeElement');
        return
    };
    if (!docName || isNaN(chapterId) || isNaN(pageNum)) {
        this.quill.root.innerHTML = '<li>缺少 ID 位置，请检查 URL。</li>';
        return;
    }
    await PageImpl.loadPage(docName, chapterId, pageNum); // 根据 docName, chapterId, lastPage 加载页面
    window.quill.on('text-change', function () {
        window.quillTextChange = true;
        textChangeElement.textContent = '💾：❌';
        const textCount = window.quill.getText().length;
        textCountElement.textContent = '🖊️：' + textCount + " 字符";
    });

    const pageInputElement = document.getElementById('page-input');
    if (!(pageInputElement instanceof HTMLInputElement)) {
        console.error('缺少元素 pageInputElement');
        return
    };
    pageInputElement.addEventListener('keydown', async function (e) {
        if (e.key === 'Enter') {
            SaveCartoon.onLoading();
            const docName = window.getQueryParameter('doc_name');
            const chapterId = parseInt(window.getQueryParameter('chapter_id'));
            const pageNum = parseInt(pageInputElement.value);
            await PageImpl.goToPage(docName, chapterId, pageNum, window.quillTextChange);
            SaveCartoon.onLoaded();
        }
    });

    const backBtn = document.getElementById('back-title-btn');
    if (!(backBtn instanceof HTMLElement)) {
        console.error('缺少元素 backBtn');
        return
    };
    backBtn.addEventListener('click', async function () {
        SaveCartoon.onLoading();
        await backPageIndex();
        SaveCartoon.onLoaded();
    });

    const nextBtn = document.getElementById('next-page-btn');
    if (!(nextBtn instanceof HTMLElement)) {
        console.error('缺少元素 nextBtn');
        return
    };
    nextBtn.addEventListener('click', async function () {
        SaveCartoon.onLoading();
        await PageImpl.goToPageOffset(1);
        SaveCartoon.onLoaded();
    });

    const prevBtn = document.getElementById('prev-page-btn');
    if (!(prevBtn instanceof HTMLElement)) {
        console.error('缺少元素 prevBtn');
        return
    };
    prevBtn.addEventListener('click', async function () {
        SaveCartoon.onLoading();
        await PageImpl.goToPageOffset(-1);
        SaveCartoon.onLoaded();
    });

    const autoCutBtn = document.getElementById('auto-cut-btn');
    if (!(autoCutBtn instanceof HTMLElement)) {
        console.error('缺少元素 autoCutBtn');
        return
    };
    autoCutBtn.addEventListener('click', async function () {
        SaveCartoon.onLoading();
        await PageImpl.autoCutPage();
        SaveCartoon.onLoaded();
    });

    const insertPageBtn = document.getElementById('insert-page-btn');
    if (!(insertPageBtn instanceof HTMLElement)) {
        console.error('缺少元素 insertPageBtn');
        return
    };
    insertPageBtn.addEventListener('click', async function () {
        SaveCartoon.onLoading();
        await PageImpl.insertPageAtEndOf();
        SaveCartoon.onLoaded();
    });

    const deletePageBtn = document.getElementById('delete-page-btn');
    if (!(deletePageBtn instanceof HTMLElement)) {
        console.error('缺少元素 deletePageBtn');
        return
    };
    deletePageBtn.addEventListener('click', async function () {
        SaveCartoon.onLoading();
        await PageImpl.deletePageAt();
        SaveCartoon.onLoaded();
    });

    const saveBtn = document.getElementById('save-btn');
    if (!(saveBtn instanceof HTMLElement)) {
        console.error('缺少元素 saveBtn');
        return
    };
    saveBtn.addEventListener('click', async function () {
        SaveCartoon.onLoading();
        await PageImpl.updatePage();
        SaveCartoon.onLoaded();
    });

    const hideToolbarCheckbox = document.getElementById('hide-toolbar-checkbox');
    if (!(hideToolbarCheckbox instanceof HTMLInputElement)) {
        console.error('缺少元素 hideToolbarCheckbox');
        return
    };
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

    async function backPageIndex() {
        if (window.quillTextChange) {
            const updateResult = await PageImpl.updatePage();
            if (!updateResult) {
                return;
            }
        }
        const docName = window.getQueryParameter('doc_name');
        const chapterId = window.getQueryParameter('chapter_id');
        const pageNum = window.getQueryParameter('page_num');
        window.location.href = `/pageIndex?doc_name=${docName}&chapter_id=${chapterId}&last_page=${pageNum}`;
    }

});
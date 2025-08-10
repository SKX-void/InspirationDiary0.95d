import { serverPrefix } from "../../config";

class PageIndexApi {
    static handleError(info: string, error?: Error, message?: string) {
        let errMsg = "无错误信息";
        if (error) errMsg = error.message;
        let msg = "无消息";
        if (message) msg = message;
        alert(`发生错误:\n错误描述:${info}+\n错误:${errMsg}\n消息:${msg}`);
    }
    static getQueryParameter(paramName: string) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(paramName);
    }

    static readonly docName: string = PageIndexApi.getQueryParameter('doc_name') ?? ''; // 从 URL 中获取 docName
    static readonly chapterId = parseInt(PageIndexApi.getQueryParameter('chapter_id') ?? '0'); // 从 URL 中获取 chapterId
    static readonly lastPage = parseInt(PageIndexApi.getQueryParameter('last_page') ?? '0'); // 从 URL 中获取 lastPage

    static async getPageList() {
        try {
            const response = await fetch(`${serverPrefix.value}/api/page/total?doc_name=${encodeURIComponent(PageIndexApi.docName)}&chapter_id=${PageIndexApi.chapterId}`);
            const data = await response.json();
            if (!response.ok) {
                PageIndexApi.handleError("服务器获取总页数失败:", new Error(`${response.status}: ${data.err}`));
            }
            const totalPages = data.total_pages;
            PageIndexApi.renderPageList(totalPages, PageIndexApi.docName, PageIndexApi.chapterId, PageIndexApi.lastPage);
        } catch (error) {
            if (error instanceof Error) {
                PageIndexApi.handleError('服务器获取总页数失败:', error);
            } else {
                PageIndexApi.handleError('服务器获取总页数失败:未知错误');
            }
            const pageList = document.getElementById('pageList') as HTMLElement;
            pageList.innerHTML = '<li>加载页面列表失败，请稍后重试。</li>';
        }
    }
    static renderPageList(totalPages: number, docName: string, chapterId: number, lastPage: number) {
        const pageListElement = document.getElementById('pageList') as HTMLElement;
        pageListElement.innerHTML = ''; // 清空现有内容
        const lastPageNumber = lastPage; // 转换为数字
        for (let i = 1; i <= totalPages; i++) {
            const listItem = document.createElement('li');
            listItem.className = 'page-item';
            // 如果当前页码等于 lastPage，则标记为 active
            if (i === lastPageNumber) {
                listItem.classList.add('active');
            }
            listItem.textContent = i.toString();

            listItem.addEventListener('click', () => {
                window.location.href = `${serverPrefix.value}/editor?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}&page_num=${i}`;
            });

            pageListElement.appendChild(listItem);
        }
        // 自动滚动到标记的方块（如果有 lastPage）
        if (lastPage) {
            const activeItem = document.querySelector('.pageNum-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    static async appendPage() {
        const response = await fetch(`${serverPrefix.value}/api/page/append?doc_name=${encodeURIComponent(PageIndexApi.docName)}&chapter_id=${PageIndexApi.chapterId}`
            , { method: 'POST' }
        );
        const data = await response.json();
        if (!response.ok) {
            PageIndexApi.handleError("服务器追加页面失败:", new Error(`${response.status}: ${data.err}`));
        }
        await PageIndexApi.getPageList();
    }
}
window.addEventListener('DOMContentLoaded', () => {
    if (!PageIndexApi.docName || !PageIndexApi.chapterId) {
        const pageList = document.getElementById('pageList') as HTMLElement;
        pageList.innerHTML = '<li>缺少文档 ID 或标题 ID，请检查 URL。</li>';
        return;
    }
    PageIndexApi.getPageList(); // 根据 docName 和 chapterId 获取页面列表

    const backTitleIndexBtn = document.getElementById('backTitleIndexBtn') as HTMLElement;
    backTitleIndexBtn.addEventListener('click', () => {
        window.location.href = `${serverPrefix.value}/chapterIndex?doc_name=${encodeURIComponent(PageIndexApi.docName)}`;
    });

    const appendPageBtn = document.getElementById('appendPageBtn');
    if (!(appendPageBtn instanceof HTMLElement)) {
        console.warn('追加页面按钮未找到');
        return;
    };
    appendPageBtn.addEventListener('click', PageIndexApi.appendPage);

});
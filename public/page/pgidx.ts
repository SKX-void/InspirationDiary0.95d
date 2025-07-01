window.addEventListener('DOMContentLoaded', () => {
    function handleError(info: string, error?: Error, message?: string) {
        let errMsg = "no err mag";
        if (error) errMsg = error.message;
        let msg = "no msg";
        if (message) msg = message;
        alert(`handleErrorMSG:\nprefix:${info}+\nerr:${errMsg}\nmsg:${msg}`);
    }

    const docName:string = getQueryParameter('doc_name')?? ''; // 从 URL 中获取 docName
    const chapterId = parseInt(getQueryParameter('chapter_id') ?? '0'); // 从 URL 中获取 chapterId
    const lastPage = parseInt(getQueryParameter('last_page') ?? '0'); // 从 URL 中获取 lastPage

    if (!docName || !chapterId) {
        const pageList = document.getElementById('pageList');
        if (!(pageList instanceof HTMLElement)) {
            console.warn('页面列表元素未找到');
            return};
        pageList.innerHTML = '<li>缺少文档 ID 或标题 ID，请检查 URL。</li>';
        return;
    }
    getPageList(docName, chapterId, lastPage); // 根据 docName 和 chapterId 获取页面列表

    // 获取 URL 中的查询参数
    function getQueryParameter(paramName: string) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(paramName);
    }

    // 获取总页数并渲染页面列表
    async function getPageList(docName: string, chapterId: number, lastPage: number) {
        try {
            const response = await fetch(`/api/page/total?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}`);
            const data = await response.json();
            if (!response.ok) {
                handleError("服务器获取总页数失败:", new Error(`${response.status}: ${data.err}`));
            }
            const totalPages = data.total_pages;
            renderPageList(totalPages, docName, chapterId, lastPage);
        } catch (error) {
            if (error instanceof Error) {
                handleError('服务器获取总页数失败:', error);
            } else {
                handleError('服务器获取总页数失败:未知错误');
            }
            const pageList = document.getElementById('pageList');
            if (!(pageList instanceof HTMLElement)) {
                console.warn('页面列表元素未找到');
                return};
            pageList.innerHTML = '<li>加载页面列表失败，请稍后重试。</li>';
        }
    }

    // 渲染页面列表
    function renderPageList(totalPages: number, docName:string, chapterId: number, lastPage: number) {
        const pageListElement = document.getElementById('pageList');
        if (!(pageListElement instanceof HTMLElement)) {
            console.warn('页面列表元素未找到');
            return};
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
                window.location.href = `/editor?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}&page_num=${i}`;
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
    const backTitleIndexBtn = document.getElementById('backTitleIndexBtn');
    if (!(backTitleIndexBtn instanceof HTMLElement)){
        console.warn('返回标题索引按钮未找到');
        return};

backTitleIndexBtn.addEventListener('click', backTitleIndex);
    function backTitleIndex() {
        window.location.href = `/chapterIndex?doc_name=${encodeURIComponent(docName)}`;
    }

    const appendPageBtn = document.getElementById('appendPageBtn');
    if (!(appendPageBtn instanceof HTMLElement)) {
        console.warn('追加页面按钮未找到');
        return;
    };
    appendPageBtn.addEventListener('click', appendPage);
    async function appendPage() {
        const response = await fetch(`/api/page/append?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}`
            , { method: 'POST' }
        );
        const data = await response.json();
        if (!response.ok) {
            handleError("服务器追加页面失败:", new Error(`${response.status}: ${data.err}`));
        }
        await getPageList(docName, chapterId, lastPage);
    }
});
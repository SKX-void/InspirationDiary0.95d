
document.addEventListener('DOMContentLoaded', function () {
    // 获取URL参数
    function getQueryParam(name: string) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // 返回按钮
    (document.getElementById('back-btn') as HTMLElement).addEventListener('click', function () {
        window.history.back();
    });

    // 新搜索按钮
    (document.getElementById('new-search-btn') as HTMLElement).addEventListener('click', function () {
        (document.getElementById('search-input') as HTMLInputElement).value = '';
        (document.getElementById('search-input') as HTMLInputElement).focus();
        (document.getElementById('search-results') as HTMLElement).innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>等待搜索</h3>
                        <p>请输入关键词进行搜索</p>
                    </div>
                `;
        (document.getElementById('search-stats') as HTMLElement).innerHTML = `找到 <span class="highlight">0</span> 个结果`;
        (document.getElementById('keyword-info') as HTMLElement).innerHTML = `关键词: <span class="keyword-highlight">-</span>`;
    });

    // 搜索按钮
    (document.getElementById('search-btn') as HTMLElement).addEventListener('click', performSearch);

    // 回车搜索
    (document.getElementById('search-input') as HTMLInputElement).addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // 执行搜索
    async function performSearch() {
        const keyword = (document.getElementById('search-input') as HTMLInputElement).value.trim();
        if (!keyword) {
            alert('请输入搜索关键词');
            return;
        }

        // 显示加载状态
        (document.getElementById('search-results') as HTMLElement).innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">⏳</div>
                        <h3>搜索中...</h3>
                        <p>正在查找包含"<span class="keyword-highlight">${keyword}</span>"的内容</p>
                    </div>
                `;

        // 获取文档名称
        const docName = getQueryParam('doc_name') || 'default';

        // 调用API执行搜索
        const response = await fetch(`/api/page/search?doc_name=${encodeURIComponent(docName)}&keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) {
            const errorJson = await response.json();
            console.error('搜索失败:', errorJson.err);
            (document.getElementById('search-results') as HTMLElement).innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon">❌</div>
                                <h3>搜索失败</h3>
                                <p>${errorJson.err}</p>
                            </div>
                        `;
        }
        const results = await response.json();
        renderSearchResults(results, keyword);

    }

    // 渲染搜索结果
    function renderSearchResults(results: { chapter_id: string, page_num: string, preview: string, relevance: string }[], keyword: string) {
        const resultsContainer = document.getElementById('search-results') as HTMLElement;
        const statsElement = document.getElementById('search-stats') as HTMLElement;
        const keywordElement = document.getElementById('keyword-info') as HTMLElement;

        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">🔍</div>
                            <h3>未找到结果</h3>
                            <p>尝试使用不同的关键词</p>
                        </div>
                    `;
            statsElement.innerHTML = `找到 <span class="highlight">0</span> 个结果`;
            keywordElement.innerHTML = `关键词: <span class="keyword-highlight">"${keyword}"</span>`;
            return;
        }

        statsElement.innerHTML = `找到 <span class="highlight">${results.length}</span> 个结果`;
        keywordElement.innerHTML = `关键词: <span class="keyword-highlight">"${keyword}"</span>`;

        resultsContainer.innerHTML = '';
        results.forEach((result) => {
            const resultCard = document.createElement('a');
            resultCard.className = 'search-card';
            resultCard.href = `/editor?doc_name=${getQueryParam('doc_name')}&chapter_id=${result.chapter_id}&page_num=${result.page_num}`;

            // 高亮处理关键词
            let previewHTML = result.preview;

            resultCard.innerHTML = `
                        <div class="card-header">
                            <div class="search-location">第${result.chapter_id}章 - 第${result.page_num}页</div>
                            <div class="search-relevance">相关度: ${parseFloat(result.relevance).toFixed(2)}</div>
                        </div>
                        <div class="search-preview">
                            ${previewHTML}
                        </div>
                        <div class="card-footer">
                            <div>点击查看完整内容</div>
                        </div>
                    `;

            resultsContainer.appendChild(resultCard);
        });
    }

    // // 如果有URL中的关键词，自动搜索
    // const initialKeyword = getQueryParam('keyword');
    // if (initialKeyword) {
    //     (document.getElementById('search-input')as HTMLInputElement).value = initialKeyword;
    //     performSearch();
    // }*
});
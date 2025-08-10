import { serverPrefix } from "../../config";

class HistoryApi {
    static readonly history: { data: { history_id: number, chapter_id: number, page_num: number, saved_at: string }[] } = { data: [] };

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
    static async getHistoryArray() {
        const docName = HistoryApi.getQueryParameter('doc_name') ?? '';
        const res = await fetch(`${serverPrefix.value}/api/history/total?doc_name=${encodeURIComponent(docName)}`);
        if (!res.ok) {
            const error = await res.json();
            HistoryApi.handleError('获取历史记录失败', error.err);
            return [];
        }
        const data = await res.json();
        return data;
    }
    static async getHistoryPage(historyId: number) {
        const docName = HistoryApi.getQueryParameter('doc_name') ?? '';
        const res = await fetch(`${serverPrefix.value}/api/history/page?doc_name=${encodeURIComponent(docName)}&history_id=${historyId}`);
        if (!res.ok) {
            const error = await res.json();
            HistoryApi.handleError('获取历史记录详情失败', error.err);
            return null;
        }
        const data = await res.json();
        return data;
    }
}

class HistoryDom {
    static readonly quill = new Quill('#history-editor', {
        modules: {
            toolbar: []
        },
        readOnly: true,
        theme: 'snow'
    });
    // 渲染历史记录卡片
    static renderHistoryCards(data: { history_id: number, chapter_id: number, page_num: number, saved_at: string }[]) {

        const historyGrid = document.getElementById('history-grid');
        if (!(historyGrid instanceof HTMLElement)) {
            return;
        }
        historyGrid.innerHTML = '';

        if (data.length === 0) {
            historyGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <h3>没有找到历史记录</h3>
                        <p>请尝试调整筛选条件或搜索关键词</p>
                    </div>
                `;
            return;
        }

        data.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.dataset.id = String(item.history_id);

            card.innerHTML = `
                    <div class="card-header">
                        <div class="history-id">ID: ${item.history_id}</div>
                        <div class="history-date">${HistoryDom.formatDateTime(item.saved_at)}</div>
                    </div>
                    <div class="card-details">
                        <div class="detail-item">
                            <span class="detail-label">章节</span>
                            <span class="detail-value">第${item.chapter_id}章</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">页码</span>
                            <span class="detail-value">第${item.page_num}页</span>
                        </div>
                    </div>
                   
                `;
            card.addEventListener('click', async () => {
                // 设置选中状态
                document.querySelectorAll('.history-card').forEach(c => {
                    c.classList.remove('active');
                });
                card.classList.add('active');

                // 加载详情
                await HistoryDom.loadHistoryDetail(item.history_id);

                // 显示模态框

                const detailModal = document.getElementById('detail-modal');
                if (!(detailModal instanceof HTMLElement)) {
                    return;
                }
                detailModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            historyGrid.appendChild(card);
        });
    }
    // 加载历史记录详情
    static async loadHistoryDetail(historyId: number) {
        // 在实际应用中，这里应该调用API获取详情
        const item = HistoryApi.history.data.find(i => i.history_id === historyId);

        if (item) {
            // 更新详情信息
            const detailId = document.getElementById('detail-id') as HTMLElement;
            const detailChapter = document.getElementById('detail-chapter') as HTMLElement;
            const detailPage = document.getElementById('detail-page') as HTMLElement;
            const detailTime = document.getElementById('detail-time') as HTMLElement;
            detailId.textContent = String(item.history_id);
            detailChapter.textContent = `第${item.chapter_id}章`;
            detailPage.textContent = `第${item.page_num}页`;
            detailTime.textContent = HistoryDom.formatDateTime(item.saved_at);
            const { content, plain_text } = await HistoryApi.getHistoryPage(historyId);
            if (content) {
                HistoryDom.quill.setContents(JSON.parse(content));
            } else {
                HistoryDom.quill.setText(plain_text);
            }
        }
    }

    static closeModal() {
        const detailModal = document.getElementById('detail-modal');
        if (!(detailModal instanceof HTMLElement)) {
            return;
        }
        detailModal.classList.remove('active');
        document.body.style.overflow = 'auto';

        // 清除选中状态
        document.querySelectorAll('.history-card').forEach(c => {
            c.classList.remove('active');
        });
    }

    // 格式化日期时间
    static formatDateTime(dateString: string) {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
}

class HistoryFilter {
    static populateFilterOptions() {
        // 清空现有选项（保留默认选项）
        const chapterFilter = document.getElementById('chapter-filter') as HTMLSelectElement;
        while (chapterFilter.options.length > 1) {
            chapterFilter.remove(1);
        }
        const pageFilter = document.getElementById('page-filter') as HTMLSelectElement;
        while (pageFilter.options.length > 1) {
            pageFilter.remove(1);
        }

        // 从历史数据中提取所有章节和页码
        const chapters = new Set<number>();
        const pages = new Set<number>();

        HistoryApi.history.data.forEach(item => {
            chapters.add(item.chapter_id);
            pages.add(item.page_num);
        });

        // 按数字顺序添加章节选项
        Array.from(chapters)
            .sort((a, b) => a - b)
            .forEach(chapterId => {
                const option = document.createElement('option');
                option.value = chapterId.toString();
                option.textContent = `第${chapterId}章`;
                chapterFilter.appendChild(option);
            });

        // 按数字顺序添加页码选项
        Array.from(pages)
            .sort((a, b) => a - b)
            .forEach(pageNum => {
                const option = document.createElement('option');
                option.value = pageNum.toString();
                option.textContent = `第${pageNum}页`;
                pageFilter.appendChild(option);
            });
    }

    // 初始化筛选控件
    static initFilters() {
        // 动态生成筛选选项
        HistoryFilter.populateFilterOptions();

        // 添加事件监听器
        const chapterFilter = document.getElementById('chapter-filter') as HTMLSelectElement;
        chapterFilter.addEventListener('change', HistoryFilter.applyFilters);
        const pageFilter = document.getElementById('page-filter') as HTMLSelectElement;
        pageFilter.addEventListener('change', HistoryFilter.applyFilters);
        const fromDateFilter = document.getElementById('from-date-filter') as HTMLInputElement;
        fromDateFilter.addEventListener('change', HistoryFilter.applyFilters);
        const toDateFilter = document.getElementById('to-date-filter') as HTMLInputElement;
        toDateFilter.addEventListener('change', HistoryFilter.applyFilters);
        const sortSelect = document.getElementById('sort') as HTMLSelectElement;
        sortSelect.addEventListener('change', HistoryFilter.applyFilters);

        // 添加重置按钮
        const resetFiltersBtn = document.createElement('button');
        resetFiltersBtn.textContent = '重置筛选';
        resetFiltersBtn.className = 'btn btn-outline';
        resetFiltersBtn.addEventListener('click', () => {
            chapterFilter.value = '';
            pageFilter.value = '';
            fromDateFilter.value = '';
            toDateFilter.value = '';
            sortSelect.value = 'newest';
            HistoryFilter.applyFilters();
        });

        // 将重置按钮添加到筛选栏
        const filterBar = document.querySelector('.filter-bar');
        if (filterBar) {
            const resetContainer = document.createElement('div');
            resetContainer.className = 'filter-item';
            resetContainer.appendChild(resetFiltersBtn);
            filterBar.appendChild(resetContainer);
        }

        // 初始应用筛选
        HistoryFilter.applyFilters();
    }
    // 应用筛选函数
    static applyFilters() {
        // 获取当前筛选值
        const chapterFilter = document.getElementById('chapter-filter') as HTMLSelectElement;
        const chapterValue = chapterFilter.value;
        const pageFilter = document.getElementById('page-filter') as HTMLSelectElement;
        const pageValue = pageFilter.value;
        const fromDateFilter = document.getElementById('from-date-filter') as HTMLInputElement;
        const fromDateValue = fromDateFilter.value;
        const toDateFilter = document.getElementById('to-date-filter') as HTMLInputElement;
        const toDateValue = toDateFilter.value;
        const sortSelect = document.getElementById('sort') as HTMLSelectElement;
        const sortValue = sortSelect.value;

        // 对历史记录数据进行筛选
        const filteredData = HistoryApi.history.data.filter(item => {
            // 章节筛选
            if (chapterValue && item.chapter_id !== parseInt(chapterValue)) {
                return false;
            }
            // 页码筛选
            if (pageValue && item.page_num !== parseInt(pageValue)) {
                return false;
            }
            // 日期范围筛选
            const savedDate = new Date(item.saved_at);
            const savedDateStr = savedDate.toISOString().split('T')[0];

            if (fromDateValue && savedDateStr < fromDateValue) {
                return false;
            }

            if (toDateValue && savedDateStr > toDateValue) {
                return false;
            }

            return true;
        });
        // 应用排序
        const sortedData = [...filteredData];
        if (sortValue === 'newest') {
            sortedData.sort((a, b) =>
                new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
            );
        } else if (sortValue === 'oldest') {
            sortedData.sort((a, b) =>
                new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime()
            );
        }
        // 重新渲染筛选后的卡片
        HistoryDom.renderHistoryCards(sortedData);
    }
}

window.addEventListener('DOMContentLoaded', async () => {

    const backBtn = document.getElementById('back-btn') as HTMLElement;
    // 返回按钮
    backBtn.addEventListener('click', () => {
        window.history.back();
    });

    const modalClose = document.getElementById('modal-close') as HTMLElement;
    modalClose.addEventListener('click', HistoryDom.closeModal);
    // 点击模态框背景关闭
    const detailModal = document.getElementById('detail-modal') as HTMLElement;
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            HistoryDom.closeModal();
        }
    });

    const refreshBtn = document.getElementById('refresh-btn') as HTMLElement;
    // 刷新按钮
    refreshBtn.addEventListener('click', async () => {
        // 模拟刷新数据
        HistoryApi.history.data = await HistoryApi.getHistoryArray();
        HistoryDom.renderHistoryCards(HistoryApi.history.data);
    });

    // 初始化页面
    HistoryApi.history.data = await HistoryApi.getHistoryArray();
    HistoryDom.renderHistoryCards(HistoryApi.history.data);
    HistoryFilter.initFilters();
});



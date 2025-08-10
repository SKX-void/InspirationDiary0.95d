import { serverPrefix } from "../../config";

namespace Chapter {
    class ChapterApi {
        static handleError(info: string, error?: Error, message?: string) {
            let errMsg = "no err mag";
            if (error) errMsg = error.message;
            let msg = "no msg";
            if (message) msg = message;
            alert(`错误处理器:\nprefix:${info}+\nerr:${errMsg}\nmsg:${msg}`);
        }

        static async getChapterList(docName: string) {
            try {
                const response = await fetch(`${serverPrefix.value}/api/chapter?doc_name=${encodeURIComponent(docName)}`);
                const data = await response.json();
                if (!response.ok) {
                    ChapterApi.handleError('服务器获取章节列表失败:', new Error(`${response.status}:${data.err}`));
                    return;
                }
                ChapterApi.renderChapterList(data, docName);
            } catch (error) {
                if (error instanceof Error) {
                    ChapterApi.handleError('获取章节列表失败:', error);
                } else {
                    ChapterApi.handleError('获取章节列表失败非法错误');
                }
                const chapterList = document.getElementById('chapterList');
                if (!(chapterList instanceof HTMLElement)) {
                    console.warn('章节列表元素不存在，无法渲染。');
                    return
                };
                chapterList.innerHTML = '<li>加载标题列表失败，请稍后重试。</li>';
            }
        }

        private static renderChapterList(chapters: { title: string, chapter_id: number, last_page: number, sort_order: number }[], docName: string) {
            const chapterListElement = document.getElementById('chapterList');
            if (!(chapterListElement instanceof HTMLElement)) {
                console.warn('章节列表元素不存在，无法渲染。');
                return
            };
            chapterListElement.innerHTML = '';

            if (chapters.length === 0) {
                chapterListElement.innerHTML = '<li>暂无章节</li>';
                return;
            }

            chapters.forEach(chapter => {
                const listItem = document.createElement('li');
                listItem.className = 'chapter-item';
                listItem.textContent = chapter.title;

                listItem.addEventListener('click', () => {
                    window.location.href = `${serverPrefix.value}/pageIndex?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapter.chapter_id}&last_page=${chapter.last_page}`;
                });

                listItem.dataset.chapterId = String(chapter.chapter_id);
                listItem.dataset.title = chapter.title;
                listItem.dataset.sortOrder = String(chapter.sort_order);

                chapterListElement.appendChild(listItem);
            });
        }
        // 获取 URL 中的参数
        static getQueryParameter(paramName: string) {
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            return urlParams.get(paramName);
        }
    }

    window.addEventListener('DOMContentLoaded', async () => {

        const docName = ChapterApi.getQueryParameter('doc_name');
        if (!docName) {
            const chapterList = document.getElementById('chapterList');
            if (!(chapterList instanceof HTMLElement)) throw new Error('缺少文档 ID，请检查 URL。');
            chapterList.innerHTML = '<li>缺少文档 ID，请检查 URL。</li>';
        } else {
            ChapterApi.getChapterList(docName);
        }

        //#endregion
        const backDocIndexBtn = document.getElementById('backDocIndexBtn');
        if (!(backDocIndexBtn instanceof HTMLElement)) {
            console.warn('返回文档列表按钮元素不存在，无法绑定事件。');
            return;
        };
        backDocIndexBtn.addEventListener('click', () => {
            window.location.href = `${serverPrefix.value}/docIndex`;
        });

        const searchBtn = document.getElementById('searchBtn');
        if (!(searchBtn instanceof HTMLElement)) {
            console.warn('搜索按钮元素不存在，无法绑定事件。');
            return;
        };
        searchBtn.addEventListener('click', () => {
            const docName = ChapterApi.getQueryParameter('doc_name');
            if (!docName) {
                alert('缺少文档 ID，请检查 URL。');
                return;
            }
            window.location.href = `${serverPrefix.value}/search?doc_name=${encodeURIComponent(docName)}`;
        });

    });

    //#endregion
}
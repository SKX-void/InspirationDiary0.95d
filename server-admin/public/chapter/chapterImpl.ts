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

        static async insertChapter(docName: string, title: string) {
            try {
                const response = await fetch(`${serverPrefix.value}/api/chapter`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ doc_name: docName, title: title })
                });
                const data = await response.json();
                if (!response.ok) {
                    ChapterApi.handleError('服务器插入章节失败:', new Error(`${response.status}:${data.err}`));
                }
            } catch (error) {
                if (error instanceof Error) {
                    ChapterApi.handleError('插入章节失败:', error);
                } else {
                    ChapterApi.handleError('插入章节失败非法错误');
                }
            }
        }

        static async updateChapter(docName: string, chapterId: string | number, title: string, sortOrder: number | string) {
            try {
                const response = await fetch(`${serverPrefix.value}/api/chapter`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ doc_name: docName, chapter_id: chapterId, title: title, sort_order: sortOrder })
                });
                const data = await response.json();
                if (!response.ok) {
                    ChapterApi.handleError('服务器更新章节失败:', new Error(`${response.status}:${data.err}`));
                }
            } catch (error) {
                if (error instanceof Error) {
                    ChapterApi.handleError('更新章节失败:', error);
                } else {
                    ChapterApi.handleError('更新章节失败非法错误');
                }
            }
        }

        static async deleteChapter(docName: string, chapterId: string | number) {
            try {
                const response = await fetch(`${serverPrefix.value}/api/chapter`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ doc_name: docName, chapter_id: chapterId })
                });
                const data = await response.json();
                if (!response.ok) {
                    ChapterApi.handleError('服务器删除章节失败:', new Error(`${response.status}:${data.err}`));
                }
            } catch (error) {
                if (error instanceof Error) {
                    ChapterApi.handleError('删除章节失败:', error);
                } else {
                    ChapterApi.handleError('删除章节失败非法错误');
                }
            }
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

        let currentChapterId: null | number = null;
        let currentTitle: null | string = null;
        let currentSortOrder: null | number = null;

        const addChapterModal = document.getElementById('addChapterModal');
        const newChapterInput = document.getElementById('newChapterInput');

        const contextMenu = document.getElementById('contextMenu');

        const editChapterModal = document.getElementById('editChapterModal');
        const editChapterId = document.getElementById('editChapterId');
        const editTitle = document.getElementById('editTitle');
        const editSortOrder = document.getElementById('editSortOrder');

        // 删除章节模态框
        const deleteChapterModal = document.getElementById('deleteChapterModal');

        // 页面加载时获取 docName 并加载章节列表

        // 绑定增加章节按钮事件
        if (!(addChapterModal instanceof HTMLElement
            && newChapterInput instanceof HTMLInputElement)) {
            console.warn('章节列表元素不存在，无法绑定事件。');
            return
        };
        (document.getElementById('addChapterButton') as HTMLElement).addEventListener('click', () => {
            addChapterModal.style.display = 'block';
        });
        (document.getElementById('cancelAddChapter') as HTMLElement).addEventListener('click', () => {
            addChapterModal.style.display = 'none';
            newChapterInput.value = '';
        });
        (document.getElementById('confirmAddChapter') as HTMLElement).addEventListener('click', async () => {
            const title = newChapterInput.value.trim();
            if (!title) {
                alert('章节名不能为空！');
                return;
            }
            try {
                if (!docName) throw new Error('缺少文档 ID，请检查 URL。');
                await ChapterApi.insertChapter(docName, title);
                await ChapterApi.getChapterList(docName);
                addChapterModal.style.display = 'none';
                newChapterInput.value = '';
            } catch (error) {
                console.error('添加章节失败:', error);
                alert('添加章节失败，请稍后重试。');
            }
        });

        // 右键菜单相关逻辑
        document.addEventListener('contextmenu', (event) => {
            const target = event.target;
            if (!(contextMenu instanceof HTMLElement)) {
                console.warn('右键菜单元素不存在，无法绑定事件。');
                return
            };
            if (target instanceof HTMLElement && target.classList.contains('chapter-item')) {
                event.preventDefault();
                if (!(target.dataset.chapterId && target.dataset.title && target.dataset.sortOrder)) {
                    console.warn('章节元素缺少必要数据，无法绑定事件。');
                    return
                };

                currentChapterId = parseInt(target.dataset.chapterId);
                currentTitle = target.dataset.title;
                currentSortOrder = parseInt(target.dataset.sortOrder);

                contextMenu.style.display = 'block';
                contextMenu.style.left = `${event.pageX}px`;
                contextMenu.style.top = `${event.pageY}px`;
            } else {
                contextMenu.style.display = 'none';
            }
        });
        document.addEventListener('click', () => {
            if (!(contextMenu instanceof HTMLElement)) {
                console.warn('右键菜单元素不存在，无法绑定事件。');
                return
            };
            contextMenu.style.display = 'none';
        });

        if (!(editChapterId instanceof HTMLInputElement
            && editSortOrder instanceof HTMLInputElement
            && editChapterModal instanceof HTMLElement
            && contextMenu)) {
            console.warn('编辑章节元素不存在，无法绑定事件。');
            return
        };
        (document.getElementById('editChapterOption') as HTMLElement).addEventListener('click', () => {
            editChapterId.value = String(currentChapterId);
            editSortOrder.value = String(currentSortOrder);
            editSortOrder.value = String(currentSortOrder);
            editChapterModal.style.display = 'block';
            contextMenu.style.display = 'none';
        });

        if (!(editTitle instanceof HTMLInputElement)) {
            console.warn('编辑章节元素不存在，无法绑定事件。');
            return
        };
        (document.getElementById('cancelEditChapter') as HTMLElement).addEventListener('click', () => {
            editChapterModal.style.display = 'none';
            editChapterId.value = '';
            editTitle.value = '';
        });

        (document.getElementById('confirmEditChapter') as HTMLElement).addEventListener('click', async () => {
            const newTitle = editTitle.value.trim();
            const newSortOrder = editSortOrder.value;
            if (!newSortOrder) {
                alert('排序序号不能为空！');
                return;
            }

            try {
                if (!docName || !currentChapterId) throw new Error('缺少文档或章节 ID，请检查 URL。');
                await ChapterApi.updateChapter(docName, currentChapterId, newTitle, newSortOrder);
                await ChapterApi.getChapterList(docName);
                editChapterModal.style.display = 'none';
            } catch (error) {
                console.error('修改章节失败:', error);
                alert('修改章节失败，请稍后重试。');
            }
        });

        if (!(deleteChapterModal instanceof HTMLElement)) {
            console.warn('删除章节元素不存在，无法绑定事件。');
            return
        };
        (document.getElementById('deleteChapterOption') as HTMLElement).addEventListener('click', () => {
            const deleteChapterMessage = document.getElementById('deleteChapterMessage');
            if (!(deleteChapterMessage instanceof HTMLElement)) {
                console.warn('删除章节提示元素不存在，无法绑定事件。');
                return
            };
            deleteChapterMessage.textContent = `确定要删除章节 "${currentTitle}" 吗？`;
            deleteChapterModal.style.display = 'block';
            contextMenu.style.display = 'none';
        });

        (document.getElementById('cancelDeleteChapter') as HTMLElement).addEventListener('click', () => {
            deleteChapterModal.style.display = 'none';
        });

        (document.getElementById('confirmDeleteChapter') as HTMLElement).addEventListener('click', async () => {
            try {
                if (!docName || !currentChapterId) throw new Error('缺少文档或章节 ID，请检查 URL。');
                await ChapterApi.deleteChapter(docName, currentChapterId);
                await ChapterApi.getChapterList(docName);
                deleteChapterModal.style.display = 'none';
            } catch (error) {
                console.error('删除章节失败:', error);
                alert('删除章节失败，请稍后重试。');
            }
        });
        const gotoHistoryBtn = document.getElementById('gotoHistoryBtn');
        if (!(gotoHistoryBtn instanceof HTMLElement)) {
            console.warn('查看历史按钮元素不存在，无法绑定事件。');
            return;
        };
        gotoHistoryBtn.addEventListener('click', () => {
            const docName = ChapterApi.getQueryParameter('doc_name');
            if (!docName) {
                alert('缺少文档 ID，请检查 URL。');
                return;
            }
            window.location.href = `${serverPrefix.value}/history?doc_name=${encodeURIComponent(docName)}`;
        });
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
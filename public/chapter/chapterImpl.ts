//#region Impl
/**
 * 错误处理函数
 */
window.addEventListener('DOMContentLoaded', async () => {
    function handleError(info: string, error?: Error, message?: string) {
        let errMsg = "no err mag";
        if (error) errMsg = error.message;
        let msg = "no msg";
        if (message) msg = message;
        alert(`handleErrorMSG:\nprefix:${info}+\nerr:${errMsg}\nmsg:${msg}`);
    }
    async function insertChapter(docName: string, title: string) {
        try {
            const response = await fetch(`/api/chapter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doc_name: docName, title: title })
            });
            const data = await response.json();
            if (!response.ok) {
                handleError('服务器插入章节失败:', new Error(`${response.status}:${data.err}`));
            }
        } catch (error) {
            if (error instanceof Error) {
                handleError('插入章节失败:', error);
            } else {
                handleError('插入章节失败非法错误');
            }
        }
    }

    async function updateChapter(docName: string, chapterId: string | number, title: string, sortOrder: number | string) {
        try {
            const response = await fetch(`/api/chapter`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doc_name: docName, chapter_id: chapterId, title: title, sort_order: sortOrder })
            });
            const data = await response.json();
            if (!response.ok) {
                handleError('服务器更新章节失败:', new Error(`${response.status}:${data.err}`));
            }
        } catch (error) {
            if (error instanceof Error) {
                handleError('更新章节失败:', error);
            } else {
                handleError('更新章节失败非法错误');
            }
        }
    }

    async function deleteChapter(docName: string, chapterId: string | number) {
        try {
            const response = await fetch(`/api/chapter`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doc_name: docName, chapter_id: chapterId })
            });
            const data = await response.json();
            if (!response.ok) {
                handleError('服务器删除章节失败:', new Error(`${response.status}:${data.err}`));
            }
        } catch (error) {
            if (error instanceof Error) {
                handleError('删除章节失败:', error);
            } else {
                handleError('删除章节失败非法错误');
            }
        }
    }

    async function getChapterList(docName: string) {
        try {
            const response = await fetch(`/api/chapter?doc_name=${encodeURIComponent(docName)}`);
            const data = await response.json();
            if (!response.ok) {
                handleError('服务器获取章节列表失败:', new Error(`${response.status}:${data.err}`));
                return;
            }
            renderChapterList(data, docName);
        } catch (error) {
            if (error instanceof Error) {
                handleError('获取章节列表失败:', error);
            } else {
                handleError('获取章节列表失败非法错误');
            }
            const chapterList = document.getElementById('chapterList');
            if (!(chapterList instanceof HTMLElement)) {
                console.warn('章节列表元素不存在，无法渲染。');
                return
            };
            chapterList.innerHTML = '<li>加载标题列表失败，请稍后重试。</li>';
        }
    }
    //#endregion

    //#region html

    const docName = getQueryParameter('doc_name');
    if (!docName) {
        const chapterList = document.getElementById('chapterList');
        if (!(chapterList instanceof HTMLElement)) throw new Error('缺少文档 ID，请检查 URL。');
        chapterList.innerHTML = '<li>缺少文档 ID，请检查 URL。</li>';
    } else {
        getChapterList(docName);
    }

    let currentChapterId: null | number = null;
    let currentTitle: null | string = null;
    let currentSortOrder: null | number = null;

    // 获取 URL 中的参数
    function getQueryParameter(paramName: string) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(paramName);
    }

    // 渲染章节列表
    function renderChapterList(chapters: { title: string, chapter_id: number, last_page: number, sort_order: number }[], docName: string) {
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
                window.location.href = `/pageIndex?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapter.chapter_id}&last_page=${chapter.last_page}`;
            });

            listItem.dataset.chapterId = String(chapter.chapter_id);
            listItem.dataset.title = chapter.title;
            listItem.dataset.sortOrder = String(chapter.sort_order);

            chapterListElement.appendChild(listItem);
        });
    }

    const addChapterButton = document.getElementById('addChapterButton');
    const addChapterModal = document.getElementById('addChapterModal');
    const confirmAddChapter = document.getElementById('confirmAddChapter');
    const cancelAddChapter = document.getElementById('cancelAddChapter');
    const newChapterInput = document.getElementById('newChapterInput');

    const contextMenu = document.getElementById('contextMenu');
    const editChapterOption = document.getElementById('editChapterOption');
    const deleteChapterOption = document.getElementById('deleteChapterOption');

    const editChapterModal = document.getElementById('editChapterModal');
    const editChapterId = document.getElementById('editChapterId');
    const editTitle = document.getElementById('editTitle');
    const editSortOrder = document.getElementById('editSortOrder');
    const confirmEditChapter = document.getElementById('confirmEditChapter');
    const cancelEditChapter = document.getElementById('cancelEditChapter');

    // 删除章节模态框
    const deleteChapterModal = document.getElementById('deleteChapterModal');
    const confirmDeleteChapter = document.getElementById('confirmDeleteChapter');
    const cancelDeleteChapter = document.getElementById('cancelDeleteChapter');

    // 页面加载时获取 docName 并加载章节列表

    // 绑定增加章节按钮事件
    if (!(addChapterButton instanceof HTMLElement 
        && addChapterModal instanceof HTMLElement 
        && confirmAddChapter instanceof HTMLElement 
        && cancelAddChapter instanceof HTMLElement 
        && newChapterInput instanceof HTMLInputElement)) {
            console.warn('章节列表元素不存在，无法绑定事件。');
            return
        };
    addChapterButton.addEventListener('click', () => {
        addChapterModal.style.display = 'block';
    });
    cancelAddChapter.addEventListener('click', () => {
        addChapterModal.style.display = 'none';
        newChapterInput.value = '';
    });
    confirmAddChapter.addEventListener('click', async () => {
        const title = newChapterInput.value.trim();
        if (!title) {
            alert('章节名不能为空！');
            return;
        }
        try {
            if (!docName) throw new Error('缺少文档 ID，请检查 URL。');
            await insertChapter(docName, title);
            await getChapterList(docName);
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

    if (!(editChapterOption instanceof HTMLElement 
        && editChapterId instanceof HTMLInputElement 
        && editSortOrder instanceof HTMLInputElement 
        && editChapterModal instanceof HTMLElement 
        && contextMenu)) {
            console.warn('编辑章节元素不存在，无法绑定事件。');
            return
        };
    editChapterOption.addEventListener('click', () => {
        editChapterId.value = String(currentChapterId);
        editSortOrder.value = String(currentSortOrder);
        editSortOrder.value = String(currentSortOrder);
        editChapterModal.style.display = 'block';
        contextMenu.style.display = 'none';
    });

    if (!(cancelEditChapter instanceof HTMLElement 
        && editTitle instanceof HTMLInputElement)) {
            console.warn('编辑章节元素不存在，无法绑定事件。');
            return
        };
    cancelEditChapter.addEventListener('click', () => {
        editChapterModal.style.display = 'none';
        editChapterId.value = '';
        editTitle.value = '';
    });

    if (!(confirmEditChapter instanceof HTMLElement)) {
        console.warn('编辑章节元素不存在，无法绑定事件。');
        return
    };
    confirmEditChapter.addEventListener('click', async () => {
        const newTitle = editTitle.value.trim();
        const newSortOrder = editSortOrder.value;
        if (!newSortOrder) {
            alert('排序序号不能为空！');
            return;
        }

        try {
            if (!docName || !currentChapterId) throw new Error('缺少文档或章节 ID，请检查 URL。');
            await updateChapter(docName, currentChapterId, newTitle, newSortOrder);
            await getChapterList(docName);
            editChapterModal.style.display = 'none';
        } catch (error) {
            console.error('修改章节失败:', error);
            alert('修改章节失败，请稍后重试。');
        }
    });

    if (!(deleteChapterOption instanceof HTMLElement 
        && deleteChapterModal instanceof HTMLElement)) {
            console.warn('删除章节元素不存在，无法绑定事件。');
            return
        };
    deleteChapterOption.addEventListener('click', () => {
        const deleteChapterMessage = document.getElementById('deleteChapterMessage');
        if (!(deleteChapterMessage instanceof HTMLElement)) {
            console.warn('删除章节提示元素不存在，无法绑定事件。');
            return
        };
        deleteChapterMessage.textContent = `确定要删除章节 "${currentTitle}" 吗？`;
        deleteChapterModal.style.display = 'block';
        contextMenu.style.display = 'none';
    });

    if (!(cancelDeleteChapter instanceof HTMLElement)) {
        console.warn('删除章节元素不存在，无法绑定事件。');
        return
    };
    cancelDeleteChapter.addEventListener('click', () => {
        deleteChapterModal.style.display = 'none';
    });

    if (!(confirmDeleteChapter instanceof HTMLElement)) {
        console.warn('删除章节元素不存在，无法绑定事件。');
        return
    };
    confirmDeleteChapter.addEventListener('click', async () => {
        try {
            if (!docName || !currentChapterId) throw new Error('缺少文档或章节 ID，请检查 URL。');
            await deleteChapter(docName, currentChapterId);
            await getChapterList(docName);
            deleteChapterModal.style.display = 'none';
        } catch (error) {
            console.error('删除章节失败:', error);
            alert('删除章节失败，请稍后重试。');
        }
    });
});
function backDocIndex() {
    window.location.href = `/docIndex`;
}

//#endregion
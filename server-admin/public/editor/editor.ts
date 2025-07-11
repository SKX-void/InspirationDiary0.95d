class EditorDomBinder {
    static async loginBtnInit() {
        const loginBtn = document.getElementById('login');
        if (!(loginBtn instanceof HTMLElement)) {
            console.warn('登录按钮元素不存在，无法绑定事件。');
            return;
        };
        loginBtn.addEventListener('click', () => {
            window.location.href = '/login';
        });
        const loginStatus = await fetch('/login-status');
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
        const textChangeElement = document.getElementById('textChange');
        const textCountElement = document.getElementById('textCount');
        if (!(textChangeElement instanceof HTMLElement
            && textCountElement instanceof HTMLElement)) {
            console.error('缺少元素 textChangeElement');
            return;
        };
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
        const quillUndoBtn = document.getElementById('quill-undo-btn');
        if (!(quillUndoBtn instanceof HTMLElement)) {
            console.error('缺少元素 quillUndoBtn');
            return;
        };
        quillUndoBtn.addEventListener('click', function () {
            QuillObj.quill.history.undo();
        });
        const quillRedoBtn = document.getElementById('quill-redo-btn');
        if (!(quillRedoBtn instanceof HTMLElement)) {
            console.error('缺少元素 quillRedoBtn');
            return;
        }
        quillRedoBtn.addEventListener('click', function () {
            QuillObj.quill.history.redo();
        });
    }

    static jumpToPageInit() {
        const pageInputElement = document.getElementById('page-input');
        if (!(pageInputElement instanceof HTMLInputElement)) {
            console.error('缺少元素 pageInputElement');
            return;
        };
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
        const nextBtn = document.getElementById('next-page-btn');
        if (!(nextBtn instanceof HTMLElement)) {
            console.error('缺少元素 nextBtn');
            return
        };
        nextBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.goToPageOffset(1);
            SaveCartoon.onLoaded();
        });
        const prevBtn = document.getElementById('prev-page-btn');
        if (!(prevBtn instanceof HTMLElement)) {
            console.error('缺少元素 prevBtn');
            return
        };
        prevBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.goToPageOffset(-1);
            SaveCartoon.onLoaded();
        });
    }

    static pageOperateInit() {
        const insertPageBtn = document.getElementById('insert-page-btn');
        if (!(insertPageBtn instanceof HTMLElement)) {
            console.error('缺少元素 insertPageBtn');
            return
        };
        insertPageBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.insertPageAtEndOf();
            SaveCartoon.onLoaded();
        });

        const deletePageBtn = document.getElementById('delete-page-btn');
        if (!(deletePageBtn instanceof HTMLElement)) {
            console.error('缺少元素 deletePageBtn');
            return
        };
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

        const saveBtn = document.getElementById('save-btn');
        if (!(saveBtn instanceof HTMLElement)) {
            console.error('缺少元素 saveBtn');
            return
        };
        saveBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.updatePage();
            SaveCartoon.onLoaded();
        });

        const autoCutBtn = document.getElementById('auto-cut-btn');
        if (!(autoCutBtn instanceof HTMLElement)) {
            console.error('缺少元素 autoCutBtn');
            return
        };
        autoCutBtn.addEventListener('click', async function () {
            SaveCartoon.onLoading();
            await PageApi.autoCutPage();
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
    }

    static backBtnInit() {
        const backBtn = document.getElementById('back-title-btn');
        if (!(backBtn instanceof HTMLElement)) {
            console.error('缺少元素 backBtn');
            return
        };
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
            window.location.href = `/pageIndex?doc_name=${docName}&chapter_id=${chapterId}&last_page=${pageNum}`;
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
        const findReplaceModal = document.getElementById('findReplaceModal');
        const moveFRDiv = document.getElementById('moveFRDiv');
        if (!(findReplaceModal instanceof HTMLElement && moveFRDiv instanceof HTMLElement)) {
            console.error('缺少元素 findReplaceModal、moveFRDiv');
            return;
        };
        EditorFRDomBinder.makeDraggable(findReplaceModal, moveFRDiv);

        const replaceBlock = document.getElementById('replaceBlock');
        const openFindBtn = document.getElementById('openFindBtn');
        if (!(replaceBlock instanceof HTMLElement
            && openFindBtn instanceof HTMLElement)) {
            console.error('缺少元素 findReplaceModal、replaceBlock、openFindBtn');
            return;
        };
        openFindBtn.addEventListener('click', function () {
            findReplaceModal.style.display = "block";
            replaceBlock.style.display = "none";
        });

        const openFindReplaceBtn = document.getElementById('openFindReplaceBtn');
        if (!(openFindReplaceBtn instanceof HTMLElement)) {
            console.error('缺少元素 openFindReplaceBtn');
            return;
        };
        openFindReplaceBtn.addEventListener('click', function () {
            findReplaceModal.style.display = "block";
            replaceBlock.style.display = "block";
        });

        const closeFindReplaceBtn = document.getElementById('closeFindReplaceBtn');
        if (!(closeFindReplaceBtn instanceof HTMLElement)) {
            console.error('缺少元素 closeFindReplaceBtn');
            return;
        };
        closeFindReplaceBtn.addEventListener('click', function closeFind() {
            findReplaceModal.style.display = "none";
            EditorFRDomBinder.removeHighlights();
        }
        );
        const findInput = document.getElementById('findInput');
        if (!(findInput instanceof HTMLInputElement)) {
            console.error('缺少元素 findInput');
            return;
        };
        const findPreviousBtn = document.getElementById('findPreviousBtn');
        if (!(findPreviousBtn instanceof HTMLElement)) {
            console.error('缺少元素 findPreviousBtn');
            return;
        };
        findPreviousBtn.addEventListener('click', () => {
            EditorFRDomBinder.performFindPrevious(findInput.value)
        });

        const findNextBtn = document.getElementById('findNextBtn');
        if (!(findNextBtn instanceof HTMLElement)) {
            console.error('缺少元素 findNextBtn');
            return;
        };
        findNextBtn.addEventListener('click', () => {
            EditorFRDomBinder.performFindNext(findInput.value)
        }
        );

        const replaceInput = document.getElementById('replaceInput');
        if (!(replaceInput instanceof HTMLInputElement)) {
            console.error('缺少元素 replaceInput');
            return;
        };
        const replaceBtn = document.getElementById('replaceBtn');
        if (!(replaceBtn instanceof HTMLElement)) {
            console.error('缺少元素 replaceBtn');
            return;
        }
        replaceBtn.addEventListener('click', () => {
            EditorFRDomBinder.performReplace(findInput.value, replaceInput.value)
        });

        const replaceAllBtn = document.getElementById('replaceAllBtn');
        if (!(replaceAllBtn instanceof HTMLElement)) {
            console.error('缺少元素 replaceAllBtn');
            return;
        };
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
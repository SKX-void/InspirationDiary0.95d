async function loadPage(docId, chapterId, pageNum){
    try {
        if(!await updatePage()){return;}
        let page=parseInt(pageNum);
        if (page < 1) {page=1;}
        const totalPagesElement = document.getElementById('total-pages');
        if(!(totalPagesElement instanceof HTMLSpanElement))return;
        const total_pages=totalPagesElement.value;
        if (page>total_pages){page=total_pages;}
        const response = await fetch(`/page?doc_name=${encodeURIComponent(docId)}&chapter_id=${chapterId}&page_num=${page}`);
        if (!response.ok) {
            const error = await response.json();
            alert("加载页面失败！" + error.err);
            return;
        }
        const data = await response.json();
        const rtfBytes = data.content;
        if (rtfBytes) quill.setContents(JSON.parse(rtfBytes));
        else quill.setText(data.plain_text);
        const last_local=data.last_local;
        if (last_local) quill.setSelection(last_local, 0);
        document.getElementById('page-input').value = `${page}`;
        quill.enable();
        await upChapterLastPage();
    } catch (error) {
        alert('未知错误:', error);
    }
}

async function loadLastPage() {
    const docElement = document.getElementById('document-select');
    const chapterElement = document.getElementById('chapter-select');
    if (!(docElement instanceof HTMLSelectElement) || !(chapterElement instanceof HTMLSelectElement)) return;
    const docName = docElement.value;
    const chapterId = chapterElement.value;
    const lastPage = chapterElement.options[chapterElement.selectedIndex].getAttribute('data-last-page');
    if (!chapterId) {
        quill.root.innerHTML = '';
        document.getElementById('page-input').value = '';
        document.getElementById('total-pages').textContent = "/";
        return;
    }
    await getTotalPages();
    await loadPage(docName, chapterId, lastPage);
}

function getCurrentId() {
    const docElement = document.getElementById('document-select');
    const chapterElement = document.getElementById('chapter-select');
    const pageInput = document.getElementById('page-input');
    if (!(docElement instanceof HTMLSelectElement) || !(chapterElement instanceof HTMLSelectElement) || !(pageInput instanceof HTMLInputElement)) return {};
    return {
        docName : docElement.value,
        chapterId : chapterElement.value,
        pageNum : pageInput.value
    }
}


async function goToPage(){
    const {docName,chapterId,pageNum} = getCurrentId();
    await loadPage(docName, chapterId, pageNum);
}

async function goToPageOffset(offset){
    const {docName,chapterId,pageNum} = getCurrentId();
    const pageNumOffset = parseInt(pageNum)+offset;
    await loadPage(docName, chapterId, pageNumOffset);
}

async function insertPageAtEndOf(){
    const {docName,chapterId,pageNum} = getCurrentId();
    const response = await fetch(`/page`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            doc_name: docName,
            chapter_id: chapterId,
            page_num: pageNum
        })
    });
    const data = await response;
    if(!response.ok)alert("操作失败："+data.err);
    const nextPage = parseInt(pageNum) + 1;
    await getTotalPages();
    await loadPage(docName, chapterId, nextPage);
}

async function updatePage() {
    try {
        const {docName,chapterId,pageNum} = getCurrentId();
        if (isNaN(parseInt(chapterId)) || isNaN(parseInt(pageNum))) return true;
        const rtfText = quill.getContents();
        const text = quill.getText();
        const selection = quill.getSelection();
        const last_local = selection ? selection.index : 0;
        const response = await fetch(`/page`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doc_name: docName,
                chapter_id: chapterId,
                page_num: pageNum,
                content: JSON.stringify(rtfText),
                plain_text: text,
                last_local: last_local
            })
        });
        const data = await response.json();
        if (!response.ok) {
            alert("保存操作失败！" + data.err);
            return false;
        }
        return true;
    } catch (error) {
        alert('未知错误:', error);
        return false;
    }
}

/**
 * @typedef {Object} PageTotalResponse
 * @property {number} [total_pages]
 * @property {string} [err]
 */
async function getTotalPages(){
    const {docName,chapterId} = getCurrentId();
    try {
        const response = await fetch(`/page/total?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}`);
        /** @type {PageTotalResponse} */
        const data = await response.json();
        if (!response.ok) {
            alert("获取总页数失败！" + data.err);
            return;
        }
        //if(!(data instanceof ))return;
        document.getElementById('total-pages').textContent = "/ "+data.total_pages;
        document.getElementById('total-pages').value = data.total_pages;
    } catch (error) {
        console.error('未知错误:', error);
    }
}

async function deletePageAt(){
    const {docName,chapterId,pageNum} = getCurrentId();
    const totalPagesElement = document.getElementById('total-pages');
    if(!(totalPagesElement instanceof HTMLSpanElement))return;
    if(parseInt(pageNum)===1 && parseInt(totalPagesElement.value)===1){
        quill.root.innerHTML = '';
        return;
    }
    try {
        const response = await fetch(`/page`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_name: docName, chapter_id: chapterId, page_num: pageNum})
        });
        const data = await response.json();
        if(!response.ok)alert("操作失败："+data.err);
        let toPage;
        if(parseInt(pageNum)!==1){
            toPage=(parseInt(pageNum)-1).toString();
        }else {
            toPage=(parseInt(pageNum)).toString();
        }
        await loadPage(docName, chapterId, toPage);
    } catch (error) {
        alert('未知错误:', error);
    }
}
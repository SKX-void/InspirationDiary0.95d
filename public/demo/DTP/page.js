async function loadPage(docId, chapterId, pageNum){
    try {
        if(!await updatePage()){return;}
        let page=parseInt(pageNum);
        if (page < 1) {page=1;}
        const total_pages=document.getElementById('total-pages').value;
        if (page>total_pages){page=total_pages;}
        const response = await fetch(`/page?doc_name=${encodeURIComponent(docId)}&chapter_id=${chapterId}&page_num=${page}`);
        if (!response.ok) {
            alert("加载页面失败！" + response.json().err);
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
        await updateChapterLastPage();
    } catch (error) {
        alert('未知错误:', error);
    }
}

async function loadLastPage() {
    const docName = document.getElementById('document-select').value;
    const selectElement = document.getElementById('chapter-select');
    const chapterId = selectElement.value;
    const lastPage = selectElement.options[selectElement.selectedIndex].getAttribute('data-last-page');
    if (!chapterId) {
        quill.root.innerHTML = '';
        document.getElementById('page-input').value = '';
        document.getElementById('total-pages').textContent = "/";
        return;
    }
    await getTotalPages();
    await loadPage(docName, chapterId, lastPage);
}

async function goToPage(){
    const docName = document.getElementById('document-select').value;
    const chapterId = document.getElementById('chapter-select').value;
    const pageNum = document.getElementById('page-input').textContent;
    await loadPage(docName, chapterId, pageNum);
}

async function goToPageOffset(offset){
    const docName = document.getElementById('document-select').value;
    const chapterId = document.getElementById('chapter-select').value;
    const pageNum = (parseInt(document.getElementById('page-input').value) + offset).toString();
    await loadPage(docName, chapterId, pageNum);
}

async function insertPageAtEndOf(){
    const docName = document.getElementById('document-select').value;
    const chapterId = document.getElementById('chapter-select').value;
    const currentPage = document.getElementById('page-input').value;
    const response = await fetch(`/page`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            doc_name: docName,
            chapter_id: chapterId,
            page_num: currentPage
        })
    });
    const data = await response;
    if(!response.ok)alert("操作失败："+data.err);
    const nextPage = parseInt(currentPage) + 1;
    await getTotalPages();
    await loadPage(docName, chapterId, nextPage);
}

async function updatePage() {
    try {
        const docName = document.getElementById('document-select').value;
        const chapterId = document.getElementById('chapter-select').value;
        const page = document.getElementById('page-input').value;
        if (isNaN(parseInt(chapterId)) || isNaN(parseInt(page))) return true;
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
                page_num: page,
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

async function getTotalPages(){
    const docName = document.getElementById('document-select').value;
    const chapterId = document.getElementById('chapter-select').value;
    try {
        const response = await fetch(`/page/total?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}`);
        const data = await response.json();
        if (!response.ok) {
            alert("获取总页数失败！" + data.err);
            return;
        }
        document.getElementById('total-pages').textContent = "/ "+data.total_pages;
        document.getElementById('total-pages').value = data.total_pages;
    } catch (error) {
        console.error('未知错误:', error);
    }
}

async function deletePageAt(){
    const docName = document.getElementById('document-select').value;
    const chapterId = document.getElementById('chapter-select').value;
    const page = document.getElementById('pageNum-input').value;
    if(parseInt(page)===1 && parseInt(document.getElementById('total-pages').value)===1){
        quill.root.innerHTML = '';
        return;
    }
    try {
        const response = await fetch(`/page`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_name: docName, chapter_id: chapterId, page_num: page})
        });
        const data = await response.json();
        if(!response.ok)alert("操作失败："+data.err);
        let toPage;
        if(parseInt(page)!==1){
            toPage=(parseInt(page)-1).toString();
        }else {
            toPage=(parseInt(page)).toString();
        }
        await loadPage(docName, chapterId, toPage);
    } catch (error) {
        alert('未知错误:', error);
    }
}
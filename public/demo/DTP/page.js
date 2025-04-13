async function loadPage(doc_id, title_id, page_num){
    try {
        if(!await updatePage()){return;}
        let page=parseInt(page_num);
        if (page < 1) {page=1;}
        if (page>document.getElementById('total-pages').value){page=document.getElementById('total-pages').value;}
        const response = await fetch(`/page?doc_id=${doc_id}&title_id=${title_id}&page=${page}`);
        if (!response.ok) {
            alert("加载页面失败！" + response.json().message);
            return;
        }
        const data = await response.json();
        const rtfBytes = data.rtf_bytes;
        if (rtfBytes) quill.setContents(JSON.parse(rtfBytes));
        else quill.setText(data.text);
        const last_local=data.last_local;
        if (last_local) quill.setSelection(last_local, 0);
        document.getElementById('page-input').value = `${page_num}`;
        quill.enable();
        await updateTitleLastPage();
    } catch (error) {
        console.error('Error loading last page:', error);
    }
}

async function loadLastPage() {
    const doc_id = document.getElementById('document-select').value;
    const selectElement = document.getElementById('title-select');
    const title_id = selectElement.value;
    const last_page = selectElement.options[selectElement.selectedIndex].getAttribute('data-last-page');
    if (!title_id) {
        quill.root.innerHTML = '';
        document.getElementById('page-input').value = '';
        document.getElementById('total-pages').textContent = "/";
        return;
    }
    await getTotalPages();
    await loadPage(doc_id, title_id, last_page);
}

async function goToPage(){
    const doc_id = document.getElementById('document-select').value;
    const title_id = document.getElementById('title-select').value;
    const page_num = document.getElementById('page-input').textContent;
    await loadPage(doc_id, title_id, page_num);
}

async function goToPageOffset(offset){
    const selectDocument = document.getElementById('document-select');
    const doc_id = selectDocument.value;
    const selectElement = document.getElementById('title-select');
    const title_id = selectElement.value;
    const page_num = (parseInt(document.getElementById('page-input').value) + offset).toString();
    await loadPage(doc_id, title_id, page_num);
}

async function insertPageAtEndOf(){
    const selectDocument = document.getElementById('document-select');
    const doc_id = selectDocument.value;
    const selectElement = document.getElementById('title-select');
    const title_id = selectElement.value;
    const currentPage = document.getElementById('page-input').value;
    const response = await fetch(`/page`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            doc_id: doc_id,
            title_id: title_id,
            page: currentPage
        })
    });
    const data = await response;
    if(!data.ok)alert("操作失败："+data.message);
    const nextPage = parseInt(currentPage) + 1;
    await getTotalPages();
    await loadPage(doc_id, title_id, nextPage);
}

async function updatePage() {
    try {
        const selectDocument = document.getElementById('document-select');
        const doc_id = selectDocument.value;
        const selectElement = document.getElementById('title-select');
        const title_id = selectElement.value;
        const page = document.getElementById('page-input').value;
        if (isNaN(parseInt(doc_id)) || isNaN(parseInt(title_id)) || isNaN(parseInt(page))) return true;
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
                doc_id: doc_id,
                title_id: title_id,
                page: page,
                rtf_text: JSON.stringify(rtfText),
                text: text,
                last_local: last_local
            })
        });
        const data = await response;
        if (!data.ok) {
            alert("保存操作失败！" + data.message);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error updating page:', error);
        return false;
    }
}

async function getTotalPages(){
    const selectDocument = document.getElementById('document-select');
    const doc_id = selectDocument.value;
    const selectElement = document.getElementById('title-select');
    const title_id = selectElement.value;
    try {
        const response = await fetch(`/page/total?doc_id=${doc_id}&title_id=${title_id}`);
        const data = await response.json();
        document.getElementById('total-pages').textContent = "/ "+data.total_pages;
        document.getElementById('total-pages').value = data.total_pages;
    } catch (error) {
        console.error('Error getting total pages:', error);
    }
}

async function deletePageAt(){
    const doc_id = document.getElementById('document-select').value;
    const title_id = document.getElementById('title-select').value;
    const page = document.getElementById('page-input').value;
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
            body: JSON.stringify({doc_id: doc_id, title_id: title_id, page: page})
        });
        const data = await response.json();
        if(!data.ok)alert("操作失败："+data.message);
        let toPage;
        if(parseInt(page)!==1){
            toPage=(parseInt(page)-1).toString();
        }else {
            toPage=(parseInt(page)).toString();
        }
        await loadPage(doc_id, title_id, toPage);
    } catch (error) {
        console.error('Error deleting page:', error);
    }
}
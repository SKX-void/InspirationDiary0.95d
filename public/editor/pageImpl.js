async function insertPageAtEndOf(){
    const docId = getQueryParameter('docId'); // 从 URL 中获取 docId
    const titleId = getQueryParameter('titleId'); // 从 URL 中获取 titleId
    const currentPage = getQueryParameter('page'); // 从 URL 中获取 lastPage
    if (!docId || !titleId || !currentPage) {return;}
    const response = await fetch(`/page`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            doc_id: docId,
            title_id: titleId,
            page: currentPage
        })
    });
    const data = await response;
    if(!data.ok)alert("操作失败："+data.message);
    const nextPage = parseInt(currentPage) + 1;
    await getTotalPages();
    await goToPage(docId, titleId, nextPage);
}

async function deletePageAt(){
    const docId = getQueryParameter('docId'); // 从 URL 中获取 docId
    const titleId = getQueryParameter('titleId'); // 从 URL 中获取 titleId
    const currentPage = getQueryParameter('page'); // 从 URL 中获取 lastPage
    if(parseInt(currentPage)===1 && parseInt(document.getElementById('total-pages').value)===1){
        quill.root.innerHTML = '';
        return;
    }
    try {
        const response = await fetch(`/page`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_id: docId, title_id: titleId, page: currentPage})
        });
        const data = await response.json();
        if(!data.ok)alert("操作失败："+data.message);
        let toPage;
        if(parseInt(currentPage)!==1){
            toPage=(parseInt(currentPage)-1).toString();
        }else {
            toPage=(parseInt(currentPage)).toString();
        }
        await goToPage(docId, titleId, toPage);
    } catch (error) {
        console.error('Error deleting page:', error);
    }
}

async function goToPageOffset(offset){
    const docId = getQueryParameter('docId'); // 从 URL 中获取 docId
    const titleId = getQueryParameter('titleId'); // 从 URL 中获取 titleId
    const page = parseInt(getQueryParameter('page'))+ offset ; // 从 URL 中获取 lastPage
    await goToPage(docId, titleId, page);
}

async function updatePage() {
    const docId = getQueryParameter('docId'); // 从 URL 中获取 docId
    const titleId = getQueryParameter('titleId'); // 从 URL 中获取 titleId
    const page = getQueryParameter('page'); // 从 URL 中获取 lastPage
    if (!docId || !titleId || !page) {return;}
    try {
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
                doc_id: docId,
                title_id: titleId,
                page: page,
                rtf_text: JSON.stringify(rtfText),
                text: text,
                last_local: last_local
            })
        });
        const data = await response;
        if (!data.ok) {
            alert("保存操作失败！" + data.message);
        }
    } catch (error) {
        console.error('Error updating page:', error);
    }
}

async function autoCutPage() {
    const maxPageNumber = document.getElementById("auto-cut-input").value; // 每页最大字符数
    const cutStringList = ["\n", ".", "。", "!", "！", "?", "？"]; // 分割字符串列表
    // 获取Quill编辑器的纯文本内容和Delta内容
    let totalText = quill.getText();
    let totalDelta = quill.getContents();

    // 获取文本分割位置的函数
    function getTextCutIndex(text, maxLength, cutList) {
        for (let cutString of cutList) {
            let index = text.lastIndexOf(cutString, maxLength);
            if (index !== -1) return index + cutString.length;
        }
        return maxLength;
    }

    // 根据纯文本的截断位置，分割Delta内容
    function getDeltaContentUpToIndex(delta, textIndex) {
        let currentLength = 0;
        let resultDelta = [];
        for (let op of delta.ops) {
            if (currentLength >= textIndex) break;
            if (typeof op.insert === 'string') {
                let remainingLength = textIndex - currentLength;
                let insertText = op.insert.slice(0, remainingLength);
                resultDelta.push({ insert: insertText, attributes: op.attributes });
                currentLength += insertText.length;
            } else {
                resultDelta.push(op);
            }
        }
        return { ops: resultDelta };
    }

    // 获取剩余的Delta内容
    function getRemainingDelta(delta, textIndex) {
        let currentLength = 0;
        let resultDelta = [];
        for (let op of delta.ops) {
            if (currentLength >= textIndex) {
                resultDelta.push(op);
            } else if (typeof op.insert === 'string') {
                let remainingLength = textIndex - currentLength;
                if (remainingLength < op.insert.length) {
                    resultDelta.push({ insert: op.insert.slice(remainingLength), attributes: op.attributes });
                }
                currentLength += op.insert.length;
            }
        }
        return { ops: resultDelta };
    }



    // 分页逻辑
    let contentList=[];
    const virtualContainer = document.createElement('div');
    const tempQuill = new Quill(virtualContainer, {
        theme: 'snow', // 主题可以设置为 'snow' 或 'bubble'
        modules: {
            toolbar: false // 不显示工具栏
        }
    });
    while (totalText.length > maxPageNumber) {
        if(totalText.length < maxPageNumber){
            contentList.push(totalDelta);
            break;
        }
        let cutIndex = getTextCutIndex(totalText, maxPageNumber, cutStringList);
        let leftDelta = getDeltaContentUpToIndex(totalDelta, cutIndex);
        let rightDelta = getRemainingDelta(totalDelta, cutIndex);
        contentList.push(leftDelta);
        tempQuill.setContents(rightDelta);
        totalText = tempQuill.getText();
        totalDelta = tempQuill.getContents();
    }

    async function insertPageAtEndOf(docId, titleId, currentPage, rtfBytes, text, lastLocal){
        if (!docId || !titleId || !currentPage) {return;}
        const response = await fetch(`/page`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doc_id: docId,
                title_id: titleId,
                page: currentPage,
                rtf_bytes:rtfBytes,
                text: text,
                last_local: lastLocal
            })
        });
        const data = await response;
        if(!data.ok)alert("操作失败："+data.message);
    }



    const docId = getQueryParameter('docId'); // 从 URL 中获取 docId
    const titleId = getQueryParameter('titleId'); // 从 URL 中获取 titleId
    let page = parseInt(getQueryParameter('page')); // 从 URL 中获取 lastPage

    quill.setContents(contentList[0]);
    await updatePage();
    contentList.shift();
    for (const item of contentList) {
        tempQuill.setContents(item);
        await insertPageAtEndOf(docId, titleId, page, item, tempQuill.getText(), 0);
        page++;
    }

    await goToPage(docId, titleId, (page + 1));


}

async function goToPage(docId, titleId, page_num){
    await updatePage();
    window.location.href = `/editor?docId=${encodeURIComponent(docId)}&titleId=${encodeURIComponent(titleId)}&page=${encodeURIComponent(page_num)}`;
}

async function getTotalPages(doc_id, title_id){
    try {
        const response = await fetch(`/page/total?doc_id=${doc_id}&title_id=${title_id}`);
        const data = await response.json();
        document.getElementById('total-pages').textContent = "/ "+data.total_pages;
        document.getElementById('total-pages').value = data.total_pages;
    } catch (error) {
        console.error('Error getting total pages:', error);
        document.getElementById('total-pages').textContent = "/获取总页数失败！"+error.message;
    }
}

async function updateTitleLastPage(docId, titleId, lastPage) {
    if (!docId || !titleId || !lastPage) return;
    try {
        const response = await fetch(`/title/last-page`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_id: docId, title_id: titleId, last_page: lastPage})
        });
        const title = await response;
        if (!title.ok) alert('记录最后一页发生错误：' + title.message);
    } catch (error) {
        console.error('Error updating title:', error);
    }
}

function getQueryParameter(paramName) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(paramName);
}
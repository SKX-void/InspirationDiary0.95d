/**
 * 错误处理函数
 * @param {string} info 错误信息前缀
 * @param {Error} error 错误对象
 * @param {string|undefined} message 自定义错误信息
 */
function handleError(info, error, message) {
    let errMsg="no err mag";
    if(error)errMsg=error.message;
    let msg="no msg";
    if(message)msg=message;
    alert(`handleErrorMSG:\nprefix:${info}+\nerr:${errMsg}\nmsg:${msg}`);
}

let current_version;
/**
 * @param {string} docName
 * @param {string|number} chapterId
 * @param {number|string} pageNum
 */
async function loadPage(docName, chapterId, pageNum){
    try {
        let checkedPageNum=parseInt(pageNum);
        if (checkedPageNum <= 1) {
            checkedPageNum=1;
            document.getElementById('prev-page-btn').disabled = true;
        }else {
            document.getElementById('prev-page-btn').disabled = false;
        }
        await getTotalPages(docName, chapterId);

        const totalPages = parseInt(document.getElementById('total-pages').dataset.value);
        if (checkedPageNum>=totalPages){
            checkedPageNum=totalPages;
            document.getElementById('next-page-btn').disabled = true;
        }else {
            document.getElementById('next-page-btn').disabled = false;
        }
        document.getElementById('page-input').textContent = checkedPageNum.toString();
        document.getElementById('page-input').value = `${checkedPageNum}`;
        const response = await fetch(`/api/page?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}&page_num=${checkedPageNum}`);
        const data = await response.json();
        if (!response.ok) {
            quill.setText("加载页面失败！" + data.err);
            quill.disable();
            return;
        }
        current_version=data.current_version;
        const quillBytes = data.content;
        if (quillBytes) quill.setContents(JSON.parse(quillBytes));
        else quill.setText(data.plain_text);
        const last_local=data.last_local;
        if (last_local) quill.setSelection(last_local, 0);
        quill.enable();
        quillTextChange=false;
        document.getElementById('textChange').textContent = '文本已修改(翻页保存检测)：否';
        await updateChapterLastPage(docName, chapterId, checkedPageNum);
    } catch (error) {
        handleError('Error loading page:', error,`From loadPage(${docName},${chapterId},${pageNum})`);
    }
}

async function insertPageAtEndOf(){
    const docName = getQueryParameter('doc_name'); // 从 URL 中获取 docName
    const chapterId = getQueryParameter('chapter_id'); // 从 URL 中获取 chapterId
    const currentPage = getQueryParameter('page_num'); // 从 URL 中获取 lastPage
    if (!docName || !chapterId || !currentPage) {return;}
    const response = await fetch(`/api/page`, {
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
    const data = await response.json();
    if(!response.ok){
        handleError("服务器插入页面操作失败：",new Error(`${response.status}:${data.err}`),`:FROM insertPageAtEndOf()${currentPage}`);
        return;
    }
    const nextPage = parseInt(currentPage) + 1;
    await goToPage(docName, chapterId, nextPage,quillTextChange);
}

async function deletePageAt(){
    const docName = getQueryParameter('doc_name'); // 从 URL 中获取 docName
    const chapterId = getQueryParameter('chapter_id'); // 从 URL 中获取 chapterId
    const currentPage = getQueryParameter('page_num'); // 从 URL 中获取 lastPage
    if(parseInt(currentPage)===1 && parseInt(document.getElementById('total-pages').dataset.value)===1){
        quill.root.innerHTML = '';
        await updatePage();
        return;
    }
    try {
        const response = await fetch(`/api/page`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_name: docName, chapter_id: chapterId, page_num: currentPage})
        });
        const data = await response.json();
        if(!response.ok){
            handleError("服务器删除页面操作失败：",new Error(`${data.status}:${data.err}`),`FROM deletePageAt()${currentPage}`);
            return;
        }
        let toPage;
        if(parseInt(currentPage)>1){
            toPage=(parseInt(currentPage)-1).toString();
        }else {
            toPage="1";
        }
        await goToPage(docName, chapterId, toPage,false);
    } catch (error) {
        handleError('Error deleting pageNum:', error);
    }
}

/**
 * @param {number} offset
 */
async function goToPageOffset(offset){
    const docName = getQueryParameter('doc_name'); // 从 URL 中获取 docName
    const chapterId = getQueryParameter('chapter_id'); // 从 URL 中获取 chapterId
    const page = parseInt(getQueryParameter('page_num'))+ offset ; // 从 URL 中获取 lastPage
    await goToPage(docName, chapterId, page,quillTextChange);
}

async function updatePage() {
    SaveCartoon.onSaving()
    const docName = getQueryParameter('doc_name'); // 从 URL 中获取 docName
    const chapterId = getQueryParameter('chapter_id'); // 从 URL 中获取 chapterId
    const pageNum = getQueryParameter('page_num'); // 从 URL 中获取 lastPage
    if (!docName || !chapterId || !pageNum) {return false;}
    try {
        const quillText = quill.getContents();
        const text = quill.getText();
        const selection = quill.getSelection();
        const last_local = selection ? selection.index : 0;
        const response = await fetch(`/api/page`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doc_name: docName,
                chapter_id: chapterId,
                page_num: pageNum,
                content: JSON.stringify(quillText),
                plain_text: text,
                last_local: last_local,
                current_version:current_version
            })
        });
        const data = await response.json();
        if (!response.ok) {
            handleError("服务端保存操作失败！", new Error(`${response.status}:${data.err}`), data.message);
            SaveCartoon.onSaveFailed();
            return false;
        }
        quillTextChange = false;
        document.getElementById('textChange').textContent = '文本已修改(翻页保存检测)：否';
        SaveCartoon.onSaveSuccess();
        return true;
    } catch (error) {
        handleError('Error updating page:', error,"FROM updatePage()");
        SaveCartoon.onSaveFailed();
        return false;
    }
}

async function autoCutPage() {
    const cutInput = document.getElementById("auto-cut-input");
    if(!(cutInput instanceof HTMLElement))return;
    const maxPageNumber = cutInput.value; // 每页最大字符数
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
    if(totalText.length < maxPageNumber){
        contentList.push(totalDelta);
    }
    while (totalText.length > maxPageNumber) {

        let cutIndex = getTextCutIndex(totalText, maxPageNumber, cutStringList);
        let leftDelta = getDeltaContentUpToIndex(totalDelta, cutIndex);
        let rightDelta = getRemainingDelta(totalDelta, cutIndex);
        contentList.push(leftDelta);
        tempQuill.setContents(rightDelta);
        totalText = tempQuill.getText();
        totalDelta = tempQuill.getContents();
    }

    async function insertPageAtEndOf(docName, chapterId, currentPage, rtfBytes, text, lastLocal){
        if (!docName || !chapterId || !currentPage) {return false;}
        const response = await fetch(`/api/page`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doc_name: docName,
                chapter_id: chapterId,
                page_num: currentPage,
                content:JSON.stringify(rtfBytes),
                plain_text: text,
                last_local: lastLocal
            })
        });
        const data = await response.json();
        if(!response.ok){
            handleError("服务端插入页面操作失败：",new Error(`${response.status}:${data.err}`),data.message);
            return false;
        }
        return true;
    }

    const docName = getQueryParameter('doc_name'); // 从 URL 中获取 docName
    const chapterId = getQueryParameter('chapter_id'); // 从 URL 中获取 chapterId
    let page = parseInt(getQueryParameter('page_num')); // 从 URL 中获取 lastPage

    quill.setContents(contentList[0]);
    await updatePage();
    contentList.shift();
    for (const item of contentList) {
        tempQuill.setContents(item);
        if(!await insertPageAtEndOf(docName, chapterId, page, item, tempQuill.getText(), 0))break;
        page++;
    }
    await goToPage(docName, chapterId, page,true);
}

/**
 * @param {string} docName
 * @param {string|number} chapterId
 * @param {number|string} page_num
 * @param {boolean} update
 */
async function goToPage(docName, chapterId, page_num,update=true){
    if (update){
        const updateResult = await updatePage();
        if (!updateResult){
            return;
        }
    }
    const url= `/editor?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}&page_num=${page_num}`;
    history.pushState({}, '', url);
    await loadPage(docName, chapterId, page_num);
}

/**
 * @param {string} docName
 * @param {string|number} chapterId
 */
async function getTotalPages(docName, chapterId){
    try {
        const response = await fetch(`/api/page/total?doc_name=${encodeURIComponent(docName)}&chapter_id=${chapterId}`);
        const data = await response.json();
        if (!response.ok){
            handleError("服务端获取总页数失败", new Error(`${response.status}:${data.err}`),data.message);
            document.getElementById('total-pages').textContent = "/获取总页数失败！";
            return;
        }
        if(!data.total_pages)data.total_pages = -1;
        document.getElementById('total-pages').textContent = "/ "+data.total_pages;
        document.getElementById('total-pages').dataset.value = data.total_pages;
    } catch (error) {
        handleError('获取总页数未知错误:', error);
        document.getElementById('total-pages').textContent = "/获取总页数失败！"+error.message;
    }
}

/**
 * @param {string} docName
 * @param {string|number} chapterId
 * @param {number|string} lastPage
 */
async function updateChapterLastPage(docName, chapterId, lastPage) {
    if (!docName || !chapterId || !lastPage) return;
    try {
        const response = await fetch(`/api/chapter/last-page`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_name: docName, chapter_id: chapterId, last_page: lastPage})
        });
        const title = await response.json();
        if (response.status === 401)return;
        if (!response.ok) handleError('服务端记录最后一页发生错误：' ,new Error(`${response.status}:${title.err}`));
    } catch (error) {
        handleError('记录最后一页未知错误:', error);
    }
}

/**
 * @param {string} paramName
 */
function getQueryParameter(paramName) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(paramName);
}
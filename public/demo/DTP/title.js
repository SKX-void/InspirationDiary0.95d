async function insertChapter(){
    const docName = document.getElementById('document-select').value;
    const title = document.getElementById('new-chapter-name').value;
    try {
        const response = await fetch(`/chapter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_name: docName, title: title})
        });
        const titleRes = await response.json();
        if(!response.ok)alert('发生错误：'+titleRes.err);
        await selectChapterList();
    } catch (error) {
            alert('未知错误:', error);
        }
}

async function updateChapter(){
    const docName = document.getElementById('document-select').value;
    const chapterId = document.getElementById('chapter-select').value;
    const title = document.getElementById("chapter-select").options[document.getElementById("chapter-select").selectedIndex].text;
    const sortOrder = document.getElementById("chapter-select").options[document.getElementById("chapter-select").selectedIndex].getAttribute('data-sort-key');
    if (!chapterId) return;
    try {
        const response = await fetch(`/chapter`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ doc_Name: docName,chapter_id:chapterId, title: title, sort_order: sortOrder })
        }        );
        const title = await response.json();
        if (!response.ok) alert('发生错误：' + title.err);
        await selectChapterList();
    } catch (error) {
        alert('未知错误:', error);
    }
}

async function updateChapterLastPage() {
    const docName = document.getElementById('document-select').value;
    if (!docName) return;
    const chapterId = document.getElementById('chapter-select').value;
    if (!chapterId) return;
    const lastPage = document.getElementById('page-input').value;
    try {
        const response = await fetch(`/chapter/last-page`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_name: docName, chapter_id: chapterId, last_page: lastPage})
        });
        const title = await response.json();
        if (!response.ok) alert('记录最后一页发生错误：' + title.err);
    } catch (error) {
        alert('未知错误:', error);
    }
}

async function deleteChapter(){
    const docName = document.getElementById('document-select').value;
    const chapterId = document.getElementById('chapter-select').value;
    if (!chapterId) return;
    try {
        const response = await fetch(`/chapter`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_name: docName, chapter_id: chapterId})
        });
        const title = await response.json();
        if (!response.ok) alert('发生错误：' + title.err);
        await selectChapterList();
    } catch (error) {
        alert('未知错误:', error);
    }
}
async function selectChapterList(){
    const docName = document.getElementById('document-select').value;
    if (!docName) {
        document.getElementById('chapter-select').innerHTML = '<option value="">-- 未选择 --</option>';
        quill.root.innerHTML = '';
        quill.disable();
        return;
    }
    try {
        const response = await fetch(`/chapter?doc_name=${docName}`);
        const chapters = await response.json();
        if (!response.ok) {
            alert('获取章节列表发生错误：' + chapters.err);
            return;
        }
        const titleSelectElement = document.getElementById('chapter-select');
        titleSelectElement.innerHTML = '<option value="">-- 未选择 --</option>';
        chapters.forEach(title => {
            const option = document.createElement('option');
            option.value = title.chapter_id;
            option.textContent = title.title;
            option.setAttribute('data-sort-key', title.sort_order);
            option.setAttribute('data-last-page', title.last_page);
            titleSelectElement.appendChild(option);
        });
    } catch (error) {
        alert('未知错误:', error);
    }
}
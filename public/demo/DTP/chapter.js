async function insChapter(){
    const docElement = document.getElementById('document-select');
    const chapterElement = document.getElementById('new-chapter-name');
    if (!(docElement instanceof HTMLSelectElement) || !(chapterElement instanceof HTMLInputElement)) return;
    const docName = docElement.value;
    const title = chapterElement.value;
    try {
        const response = await fetch(`/api/chapter`, {
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

async function upChapter(){
    const docElement = document.getElementById('document-select');
    const chapterElement = document.getElementById('chapter-select');
    if (!(docElement instanceof HTMLSelectElement) || !(chapterElement instanceof HTMLSelectElement)) return;
    const docName = docElement.value;
    const chapterId = chapterElement.value;
    const title = chapterElement.options[chapterElement.selectedIndex].text;
    const sortOrder = chapterElement.options[chapterElement.selectedIndex].getAttribute('data-sort-key');
    if (!chapterId) return;
    try {
        const response = await fetch(`/api/chapter`, {
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

async function upChapterLastPage() {
    const docElement = document.getElementById('document-select');
    const chapterElement = document.getElementById('chapter-select');
    if (!(docElement instanceof HTMLSelectElement) || !(chapterElement instanceof HTMLSelectElement)) return;
    const docName = docElement.value;
    const chapterId = chapterElement.value;
    if (!docName || !chapterId) return;
    const pageInput = document.getElementById('page-input');
    if (!(pageInput instanceof HTMLInputElement)) return;
    const lastPage = pageInput.value;
    try {
        const response = await fetch(`/api/chapter/last-page`, {
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

async function delChapter(){
    const docElement = document.getElementById('document-select');
    const chapterElement = document.getElementById('chapter-select');
    if (!(docElement instanceof HTMLSelectElement) || !(chapterElement instanceof HTMLSelectElement)) return;
    const docName = docElement.value;
    const chapterId = chapterElement.value;
    if (!docName || !chapterId) return;
    try {
        const response = await fetch(`/api/chapter`, {
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
    const docElement = document.getElementById('document-select');
    if (!(docElement instanceof HTMLSelectElement)) return;
    const docName = docElement.value;
    if (!docName) {
        document.getElementById('chapter-select').innerHTML = '<option value="">-- 未选择 --</option>';
        quill.root.innerHTML = '';
        quill.disable();
        return;
    }
    try {
        const response = await fetch(`/api/chapter?doc_name=${encodeURIComponent(docName)}`);
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
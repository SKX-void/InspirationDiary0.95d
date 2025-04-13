async function insertTitle(){
    const selectElement = document.getElementById('document-select');
    const id = selectElement.value;
    const newTitleName = document.getElementById('new-title-name').value;
    try {
        const response = await fetch(`/title`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_id: id, new_title_name: newTitleName})
        });
        const title = await response;
        if(!title.ok)alert('发生错误：'+title.message);
        await selectTitleList();
    } catch (error) {
            console.error('Error inserting title:', error);
        }
}

async function updateTitle(){
    const selectElement = document.getElementById('document-select');
    const docId = selectElement.value;
    const titleId = document.getElementById('title-select').value;
    const titleName = document.getElementById("title-select").options[document.getElementById("title-select").selectedIndex].text;
    const sortKey = document.getElementById("title-select").options[document.getElementById("title-select").selectedIndex].getAttribute('data-sort-key');
    if (!titleId) return;
    try {
        const response = await fetch(`/title`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ doc_id: docId,title_id:titleId, title_name: titleName, sort_key: sortKey })
        }        );
        const title = await response;
        if (!title.ok) alert('发生错误：' + title.message);
        await selectTitleList();
    } catch (error) {
        console.error('Error updating title:', error);
    }
}

async function updateTitleLastPage() {
    const selectElement = document.getElementById('document-select');
    const id = selectElement.value;
    if (!id) return;
    const titleId = document.getElementById('title-select').value;
    if (!titleId) return;
    const lastPage = document.getElementById('page-input').value;
    try {
        const response = await fetch(`/title/last-page`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_id: id, title_id: titleId, last_page: lastPage})
        });
        const title = await response;
        if (!title.ok) alert('记录最后一页发生错误：' + title.message);
    } catch (error) {
        console.error('Error updating title:', error);
    }
}

async function deleteTitle(){
    const docId = document.getElementById('document-select').value;
    const titleId = document.getElementById('title-select').value;
    if (!titleId) return;
    try {
        const response = await fetch(`/title`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({doc_id: docId, title_id: titleId})
        });
        const title = await response;
        if (!title.ok) alert('发生错误：' + title.message);
        await selectTitleList();
    } catch (error) {
        console.error('Error deleting title:', error);
    }
}
async function selectTitleList(){
    const selectElement = document.getElementById('document-select');
    const id = selectElement.value;
    if (!id) {
        document.getElementById('title-select').innerHTML = '<option value="">-- 未选择 --</option>';
        quill.root.innerHTML = '';
        quill.disable();
        return;
    }
    try {
        const response = await fetch(`/title?doc_id=${id}`);
        const titles = await response.json();
        const titleSelectElement = document.getElementById('title-select');
        titleSelectElement.innerHTML = '<option value="">-- 未选择 --</option>';
        titles.forEach(title => {
            const option = document.createElement('option');
            option.value = title.title_id;
            option.textContent = title.title_name;
            option.setAttribute('data-sort-key', title.sort_key);
            option.setAttribute('data-last-page', title.last_page);
            titleSelectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading titles:', error);
    }
}
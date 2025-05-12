async function insertDoc() {
    const docNameInput = document.getElementById('new-doc-name');
    const docName = docNameInput.value.trim();
    if (!docName) return;
    try {
        const response = await fetch('/doc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ doc_name: docName })
        });
        if(!response.ok)alert("发生错误："+response.json().err);
        docNameInput.value = '';
        await selectDocList();
    } catch (error) {
        alert('未知错误：', error);
    }
}

async function deleteDoc() {
    const selectedDoc = document.getElementById('document-select');
    const selectedDocName = selectedDoc.value;
    if (!selectedDocName) return;
    try {
        const response = await fetch(`/doc`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ doc_name: selectedDocName })
        });
        if(!response.ok)alert("发生错误："+response.json().err);
        selectedDoc.value = '';
        quill.root.innerHTML = '';
        await selectDocList();
    } catch (error) {
        alert('未知错误:', error);
    }
}
async function updateDoc() {
    const selectedDoc = document.getElementById('document-select');
    const selectedDocName = selectedDoc.value;
    if (!selectedDocName) return;
    const newDocName =document.getElementById('rename-doc-name').value;
    try {
        const response = await fetch(`/doc`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ old_doc_name: selectedDocName,new_doc_name: newDocName })
        });
        if(!response.ok)alert("发生错误："+response.json().err);
    } catch (error) {
        alert('未知错误:', error);
    }
}

async function selectDocList() {
    try {
        const response = await fetch('/doc');
        if (!response.ok) alert('发生错误：' + response.json().err);
        const documents = await response.json();
        const selectElement = document.getElementById('document-select');
        selectElement.innerHTML = '<option value="">-- 未选择 --</option>';
        documents.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.doc_name;
            option.textContent = doc.doc_name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        alert('未知错误:', error);
    }
}
window.onload = selectDocList;



